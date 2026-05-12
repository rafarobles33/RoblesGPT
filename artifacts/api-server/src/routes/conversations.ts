import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  conversationsTable,
  messagesTable,
  userProfilesTable,
} from "@workspace/db/schema";
import {
  CreateConversationBody,
  SendChatMessageBody,
  GetConversationParams,
  DeleteConversationParams,
  SendChatMessageParams,
} from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";
import Groq from "groq-sdk";

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.get("/conversations", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const convos = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.clerkUserId, userId))
    .orderBy(desc(conversationsTable.updatedAt));

  res.json(convos);
});

router.post("/conversations", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = CreateConversationBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const [convo] = await db
    .insert(conversationsTable)
    .values({ clerkUserId: userId, title: parsed.data.title })
    .returning();

  res.status(201).json(convo);
});

router.get("/conversations/:id", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const paramsParsed = GetConversationParams.safeParse(req.params);

  if (!paramsParsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const { id } = paramsParsed.data;

  const convo = await db.query.conversationsTable.findFirst({
    where: and(
      eq(conversationsTable.id, id),
      eq(conversationsTable.clerkUserId, userId),
    ),
  });

  if (!convo) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  res.json({ ...convo, messages: msgs });
});

router.delete("/conversations/:id", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const paramsParsed = DeleteConversationParams.safeParse(req.params);

  if (!paramsParsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const { id } = paramsParsed.data;

  const deleted = await db
    .delete(conversationsTable)
    .where(
      and(
        eq(conversationsTable.id, id),
        eq(conversationsTable.clerkUserId, userId),
      ),
    )
    .returning();

  if (deleted.length === 0) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }

  res.status(204).send();
});

router.post("/conversations/:id/messages", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const paramsParsed = SendChatMessageParams.safeParse(req.params);

  if (!paramsParsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const bodyParsed = SendChatMessageBody.safeParse(req.body);

  if (!bodyParsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const { id } = paramsParsed.data;
  const { content, displayName } = bodyParsed.data;

  const convo = await db.query.conversationsTable.findFirst({
    where: and(
      eq(conversationsTable.id, id),
      eq(conversationsTable.clerkUserId, userId),
    ),
  });

  if (!convo) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  const [userMsg] = await db
    .insert(messagesTable)
    .values({ conversationId: id, role: "user", content })
    .returning();

  const sysPrompt = displayName
    ? `Você é o RoblesGPT, um assistente de IA inteligente, direto e amigável. O usuário se chama ${displayName}. Responda sempre em português brasileiro de forma clara e natural.`
    : `Você é o RoblesGPT, um assistente de IA inteligente, direto e amigável. Responda sempre em português brasileiro de forma clara e natural.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [
        { role: "system", content: sysPrompt },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content },
      ],
    });

    const aiText = completion.choices[0]?.message?.content ?? "";

    const [assistantMsg] = await db
      .insert(messagesTable)
      .values({ conversationId: id, role: "assistant", content: aiText })
      .returning();

    const isDefaultTitle =
      convo.title === "Nova conversa" || convo.title === content.slice(0, 50);
    let finalTitle = convo.title;

    if (history.length === 0) {
      finalTitle = content.slice(0, 60).trim() || "Nova conversa";
      await db
        .update(conversationsTable)
        .set({ title: finalTitle, updatedAt: new Date() })
        .where(eq(conversationsTable.id, id));
    } else {
      await db
        .update(conversationsTable)
        .set({ updatedAt: new Date() })
        .where(eq(conversationsTable.id, id));
    }

    res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      conversationTitle: isDefaultTitle && history.length === 0 ? finalTitle : convo.title,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "Erro ao chamar Groq API");
    const msg =
      err instanceof Groq.APIError
        ? `Erro da API Groq: ${err.message}`
        : "Erro interno ao processar sua mensagem";
    res.status(500).json({ error: msg });
  }
});

export default router;
