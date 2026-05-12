import { useState, useRef, useEffect } from "react";
import { useSendMessage } from "@workspace/api-client-react";
import type { ChatMessage } from "@workspace/api-client-react";
import { Send, Trash2, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const mutation = useSendMessage();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, mutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");

    mutation.mutate(
      { data: { messages: newMessages } },
      {
        onSuccess: (response) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: response.message },
          ]);
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Não foi possível enviar a mensagem. Tente novamente.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div
      className="flex flex-col h-screen max-h-screen overflow-hidden text-foreground"
      data-testid="chat-container"
    >
      {/* Header */}
      <header className="glass-header flex-none flex items-center justify-between px-6 py-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", boxShadow: "0 0 12px rgba(52,211,153,0.2)" }}>
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-wide text-foreground">RoblesGPT</h1>
            <p className="text-xs text-primary/70">Pronto para ajudar</p>
          </div>
        </div>

        {messages.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                data-testid="button-clear-history"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Limpar historico</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass border-0" style={{ background: "rgba(8,20,14,0.85)", backdropFilter: "blur(24px)", border: "1px solid rgba(52,211,153,0.18)" }}>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar conversa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apagara todo o historico desta sessao. Esta acao nao pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClear}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, limpar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </header>

      {/* Chat Area */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6"
        data-testid="chat-messages"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.25)",
                boxShadow: "0 0 32px rgba(52,211,153,0.15), inset 0 1px 0 rgba(52,211,153,0.2)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Bot className="w-9 h-9 text-primary" style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,0.5))" }} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                Como posso ajudar hoje?
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sou o RoblesGPT. Pergunte qualquer coisa, ajudo com codigo, textos ou apenas uma boa conversa.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-6 pb-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
                data-testid={`message-${message.role}-${index}`}
              >
                <div
                  className={`flex max-w-[85%] gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-none mt-1">
                    {message.role === "user" ? (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(52,211,153,0.12)",
                          border: "1px solid rgba(52,211,153,0.25)",
                        }}
                      >
                        <User className="w-4 h-4 text-primary/80" />
                      </div>
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(52,211,153,0.15)",
                          border: "1px solid rgba(52,211,153,0.3)",
                          boxShadow: "0 0 10px rgba(52,211,153,0.15)",
                        }}
                      >
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-5 py-3.5 ${
                      message.role === "user"
                        ? "glass-bubble-user rounded-tr-sm text-foreground"
                        : "glass-bubble-ai rounded-tl-sm text-foreground"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                        {message.content}
                      </p>
                    ) : (
                      <MarkdownRenderer content={message.content} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {mutation.isPending && (
              <div
                className="flex w-full justify-start animate-in fade-in"
                data-testid="status-typing"
              >
                <div className="flex max-w-[85%] gap-3 flex-row">
                  <div className="flex-none mt-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(52,211,153,0.15)",
                        border: "1px solid rgba(52,211,153,0.3)",
                        boxShadow: "0 0 10px rgba(52,211,153,0.15)",
                      }}
                    >
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div
                    className="glass-bubble-ai rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5"
                  >
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "rgba(52,211,153,0.7)", animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "rgba(52,211,153,0.7)", animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "rgba(52,211,153,0.7)", animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="glass-footer flex-none p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass-input rounded-xl p-2 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              className="min-h-[44px] max-h-36 resize-none border-0 focus-visible:ring-0 bg-transparent py-3 px-3 text-foreground placeholder:text-muted-foreground/60 scrollbar-none"
              disabled={mutation.isPending}
              data-testid="input-message"
            />
            <div className="flex-none pb-1 pr-1">
              <Button
                size="icon"
                className="h-10 w-10 rounded-lg shrink-0 glow-primary transition-all"
                onClick={handleSend}
                disabled={!input.trim() || mutation.isPending}
                data-testid="button-send"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
