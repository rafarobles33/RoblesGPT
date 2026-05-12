import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const router = Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
});

router.post("/chat", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Requisição inválida" });
    return;
  }

  const { messages } = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });
    return;
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system:
        "Você é o RoblesGPT, um assistente de IA inteligente, direto e amigável. Responda sempre em português brasileiro de forma clara e natural.",
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    res.json({ message: text, role: "assistant" });
  } catch (err: unknown) {
    req.log.error({ err }, "Erro ao chamar Anthropic API");
    const msg =
      err instanceof Anthropic.APIError
        ? `Erro da API Anthropic: ${err.message}`
        : "Erro interno ao processar sua mensagem";
    res.status(500).json({ error: msg });
  }
});

export default router;
