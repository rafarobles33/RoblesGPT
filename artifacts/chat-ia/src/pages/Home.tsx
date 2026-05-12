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
    <div className="flex flex-col h-screen max-h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-medium text-sm tracking-wide">Assistente IA</h1>
            <p className="text-xs text-muted-foreground">Pronto para ajudar</p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Limpar histórico</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar conversa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apagará todo o histórico desta sessão. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center rotate-3">
              <Bot className="w-8 h-8 text-primary -rotate-3" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Como posso ajudar hoje?</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Estou aqui para responder suas perguntas, ajudar com código ou apenas conversar.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-8">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 \${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[85%] gap-4 \${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="flex-none mt-1">
                    {message.role === "user" ? (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className={`
                      rounded-2xl px-5 py-3.5 
                      \${message.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-secondary/50 text-foreground border border-border/50 rounded-tl-sm"
                      }
                    `}
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
            
            {mutation.isPending && (
              <div className="flex w-full justify-start animate-in fade-in">
                <div className="flex max-w-[85%] gap-4 flex-row">
                  <div className="flex-none mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="rounded-2xl px-5 py-4 bg-secondary/50 border border-border/50 rounded-tl-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 md:p-6 bg-background/80 backdrop-blur border-t border-border/40">
        <div className="max-w-3xl mx-auto relative group">
          <div className={`
            absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500
          `} />
          <div className="relative flex items-end gap-2 bg-secondary/40 border border-border rounded-xl p-2 focus-within:border-primary/50 focus-within:bg-secondary/60 transition-colors">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para quebrar linha)"
              className="min-h-[44px] max-h-32 resize-none border-0 focus-visible:ring-0 bg-transparent py-3 px-3 scrollbar-none"
              disabled={mutation.isPending}
            />
            <div className="flex-none pb-1 pr-1">
              <Button 
                size="icon" 
                className="h-10 w-10 rounded-lg shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || mutation.isPending}
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