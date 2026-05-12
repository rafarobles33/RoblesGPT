import { useLocation } from "wouter";
import { Bot, MessageSquare, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="glass-header flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(52,211,153,0.15)",
              border: "1px solid rgba(52,211,153,0.3)",
              boxShadow: "0 0 12px rgba(52,211,153,0.2)",
            }}
          >
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">RoblesGPT</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/sign-in")}
          >
            Entrar
          </Button>
          <Button
            className="glow-primary"
            onClick={() => navigate("/sign-up")}
          >
            Começar grátis
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{
            background: "rgba(52,211,153,0.1)",
            border: "1px solid rgba(52,211,153,0.25)",
            boxShadow:
              "0 0 48px rgba(52,211,153,0.15), inset 0 1px 0 rgba(52,211,153,0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Bot
            className="w-11 h-11 text-primary"
            style={{ filter: "drop-shadow(0 0 10px rgba(52,211,153,0.6))" }}
          />
        </div>

        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "100ms" }}
        >
          <span className="text-foreground">Robles</span>
          <span className="text-primary">GPT</span>
        </h1>

        <p
          className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "200ms" }}
        >
          Seu assistente de IA pessoal, alimentado pelo modelo mais avançado da Groq.
          Converse, pergunte, aprenda — tudo com histórico persistente.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "300ms" }}
        >
          <Button
            size="lg"
            className="glow-primary text-base px-8"
            onClick={() => navigate("/sign-up")}
          >
            Começar agora — é grátis
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8"
            style={{
              border: "1px solid rgba(52,211,153,0.3)",
              background: "rgba(52,211,153,0.05)",
            }}
            onClick={() => navigate("/sign-in")}
          >
            Já tenho conta
          </Button>
        </div>

        {/* Features */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "400ms" }}
        >
          {[
            {
              icon: Zap,
              title: "Ultra rápido",
              desc: "Respostas instantâneas com a API Groq e llama-3.3-70b",
            },
            {
              icon: MessageSquare,
              title: "Histórico salvo",
              desc: "Suas conversas ficam salvas e acessíveis a qualquer hora",
            },
            {
              icon: Shield,
              title: "Conta segura",
              desc: "Login com Google. Seus dados são privados e protegidos",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass-subtle rounded-2xl p-5 text-left"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: "rgba(52,211,153,0.12)",
                  border: "1px solid rgba(52,211,153,0.2)",
                }}
              >
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted-foreground/50">
        © 2026 RoblesGPT
      </footer>
    </div>
  );
}
