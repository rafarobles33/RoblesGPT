import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListConversations,
  useCreateConversation,
  useGetConversation,
  useDeleteConversation,
  useSendChatMessage,
  useGetUserProfile,
  useUpdateUserProfile,
  getGetConversationQueryKey,
  getListConversationsQueryKey,
} from "@workspace/api-client-react";
import type { ChatMessage, ConversationDetail } from "@workspace/api-client-react";
import {
  Plus,
  Send,
  Trash2,
  Bot,
  User,
  Loader2,
  LogOut,
  ChevronLeft,
  Menu,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useToast } from "@/hooks/use-toast";
import { useClerk } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ChatPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const conversationId = params.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: profile } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();

  const displayName =
    profile?.displayName ??
    user?.firstName ??
    user?.username ??
    null;

  const { data: conversations = [], isLoading: loadingConvos } = useListConversations();
  const { data: activeConvo, isLoading: loadingConvo } = useGetConversation(
    conversationId ?? 0,
    { query: { enabled: !!conversationId, queryKey: ["/api/conversations", conversationId] as const } },
  );

  const createConvo = useCreateConversation();
  const deleteConvo = useDeleteConversation();
  const sendMessage = useSendChatMessage();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConvo?.messages, sendMessage.isPending, scrollToBottom]);

  useEffect(() => {
    if (!sendMessage.isPending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sendMessage.isPending, conversationId]);

  useEffect(() => {
    if (!conversationId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversationId]);

  const handleNewChat = async () => {
    const result = await createConvo.mutateAsync(
      { data: { title: "Nova conversa" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
      },
    );
    navigate(`/chat/${result.id}`);
  };

  const handleDeleteConvo = async (id: number) => {
    await deleteConvo.mutateAsync(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          if (conversationId === id) navigate("/chat");
        },
        onError: () => {
          toast({ title: "Erro", description: "Não foi possível excluir a conversa.", variant: "destructive" });
        },
      },
    );
  };

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    if (!conversationId) {
      toast({ title: "Selecione uma conversa", description: "Crie ou selecione uma conversa para enviar uma mensagem." });
      return;
    }

    const content = input.trim();
    setInput("");

    sendMessage.mutate(
      {
        id: conversationId,
        data: { content, displayName: displayName ?? undefined },
      },
      {
        onSuccess: (reply) => {
          queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          if (reply.conversationTitle) {
            queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          }
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao enviar mensagem.", variant: "destructive" });
          setInput(content);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveName = () => {
    if (!nameValue.trim()) return;
    updateProfile.mutate(
      { data: { displayName: nameValue.trim() } },
      {
        onSuccess: () => {
          setEditingName(false);
          toast({ title: "Nome atualizado!", description: `Olá, ${nameValue.trim()}!` });
        },
      },
    );
  };

  const messages: ChatMessage[] = activeConvo?.messages ?? [];

  const optimisticMessages: ChatMessage[] = sendMessage.isPending
    ? [
        ...messages,
        {
          id: -1,
          role: "user" as const,
          content: input || "",
          createdAt: new Date().toISOString(),
        },
      ]
    : messages;

  return (
    <div className="flex h-screen max-h-screen overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside
        className={`flex-none flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
        style={{
          background: "rgba(5,14,10,0.85)",
          borderRight: "1px solid rgba(52,211,153,0.1)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex flex-col h-full min-w-72">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-4 flex-none">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}
              >
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-sm tracking-tight">RoblesGPT</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* New Chat */}
          <div className="px-3 pb-3 flex-none">
            <Button
              className="w-full gap-2 glow-primary"
              onClick={handleNewChat}
              disabled={createConvo.isPending}
            >
              {createConvo.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Nova conversa
            </Button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-3">
            {loadingConvos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary/50 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 leading-relaxed">
                Nenhuma conversa ainda.
                <br />Clique em &ldquo;Nova conversa&rdquo;.
              </p>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.id}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                    conversationId === convo.id
                      ? "bg-primary/15 border border-primary/30"
                      : "hover:bg-white/5"
                  }`}
                  onClick={() => navigate(`/chat/${convo.id}`)}
                >
                  <p className="flex-1 text-sm truncate text-foreground/85">
                    {convo.title}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-none opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConvo(convo.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* User section */}
          <div
            className="flex-none px-3 py-3 border-t"
            style={{ borderColor: "rgba(52,211,153,0.1)" }}
          >
            {editingName ? (
              <div className="flex gap-1">
                <Input
                  className="h-8 text-xs bg-transparent border-primary/30 focus-visible:ring-primary/40 text-foreground"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  placeholder="Seu nome"
                  autoFocus
                  maxLength={50}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-primary"
                  onClick={handleSaveName}
                  disabled={updateProfile.isPending}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setEditingName(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-none text-xs font-semibold text-primary"
                  style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}
                >
                  {(displayName ?? user?.firstName ?? "?")[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-xs text-muted-foreground truncate">
                  {displayName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Usuário"}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setNameValue(displayName ?? "");
                    setEditingName(true);
                  }}
                  title="Editar nome"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => signOut(() => navigate("/"))}
                  title="Sair"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="glass-header flex-none flex items-center gap-3 px-4 py-3 z-10"
        >
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            {conversationId && activeConvo ? (
              <p className="text-sm font-medium truncate text-foreground/85">
                {activeConvo.title}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">RoblesGPT</p>
            )}
          </div>
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleNewChat}
              disabled={createConvo.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </header>

        {/* Messages */}
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6"
        >
          {!conversationId ? (
            /* Welcome / no conversation selected */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  boxShadow: "0 0 32px rgba(52,211,153,0.15), inset 0 1px 0 rgba(52,211,153,0.2)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Bot
                  className="w-9 h-9 text-primary"
                  style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,0.5))" }}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {displayName
                    ? `Como posso te ajudar, ${displayName}?`
                    : "Como posso te ajudar?"}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Crie uma nova conversa para começar.
                </p>
              </div>
              <Button className="glow-primary gap-2" onClick={handleNewChat}>
                <Plus className="w-4 h-4" />
                Nova conversa
              </Button>
            </div>
          ) : loadingConvo ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary/50 animate-spin" />
            </div>
          ) : messages.length === 0 && !sendMessage.isPending ? (
            /* Empty convo */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto animate-in fade-in duration-500">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.2)",
                }}
              >
                <Bot className="w-7 h-7 text-primary/70" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground/80 mb-1">
                  {displayName
                    ? `Olá, ${displayName}! Pode falar.`
                    : "Nova conversa"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Digite uma mensagem para começar.
                </p>
              </div>
            </div>
          ) : (
            /* Messages list */
            <div className="max-w-3xl mx-auto w-full space-y-5 pb-2">
              {optimisticMessages.map((message, index) => (
                <div
                  key={message.id !== -1 ? message.id : `pending-${index}`}
                  className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
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
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-primary"
                          style={{
                            background: "rgba(52,211,153,0.12)",
                            border: "1px solid rgba(52,211,153,0.25)",
                          }}
                        >
                          {(displayName ?? "U")[0]?.toUpperCase()}
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
              {sendMessage.isPending && (
                <div className="flex w-full justify-start animate-in fade-in">
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
                    <div className="glass-bubble-ai rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(52,211,153,0.7)", animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(52,211,153,0.7)", animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(52,211,153,0.7)", animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Input area */}
        <footer className="glass-footer flex-none p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="glass-input rounded-xl p-2 flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  conversationId
                    ? "Digite sua mensagem… (Enter para enviar, Shift+Enter para nova linha)"
                    : "Crie uma conversa para começar…"
                }
                className="min-h-[44px] max-h-36 resize-none border-0 focus-visible:ring-0 bg-transparent py-3 px-3 text-foreground placeholder:text-muted-foreground/60 scrollbar-none"
                disabled={sendMessage.isPending || !conversationId}
              />
              <div className="flex-none pb-1 pr-1">
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-lg shrink-0 glow-primary transition-all"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending || !conversationId}
                >
                  {sendMessage.isPending ? (
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
    </div>
  );
}
