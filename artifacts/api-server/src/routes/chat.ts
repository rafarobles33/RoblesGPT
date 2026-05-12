import { Router } from "express";
import Groq from "groq-sdk";
import { z } from "zod";

const router = Router();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: "GROQ_API_KEY não configurada" });
    return;
  }

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content:
            "Você é o RoblesGPT, um assistente de IA inteligente, direto e amigável. Responda sempre em português brasileiro de forma clara e natural.",
        },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    res.json({ message: text, role: "assistant" });
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
