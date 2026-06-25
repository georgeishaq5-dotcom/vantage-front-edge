import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bot, Send, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAiConsent } from "@/components/AiConsentGate";
import { supabase } from "@/integrations/supabase/client";

type VanChatContextValue = {
  open: (prefill?: string) => void;
  close: () => void;
};

const VanChatContext = createContext<VanChatContextValue | null>(null);

export function useVanChat() {
  const ctx = useContext(VanChatContext);
  if (!ctx) throw new Error("useVanChat must be used within VanChatProvider");
  return ctx;
}

const INTRO: UIMessage = {
  id: "intro",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hi, I'm Van — your AI operator. Give me a command or ask for recommendations.",
    },
  ],
};

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export function VanChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
    messages: [INTRO],
    onError: (err) => {
      console.error("[VanChat] stream error:", err);
      toast.error("Van couldn't respond. Please try again.");
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const { ensureConsent, granted } = useAiConsent();

  const open = useCallback(
    (prefill?: string) => {
      // Gate the AI agent behind explicit consent before opening the chat.
      if (!ensureConsent()) return;
      setIsOpen(true);
      if (prefill) setInput(prefill);
    },
    [ensureConsent],
  );

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    if (!granted) return;
    void sendMessage({ text });
    setInput("");
  }, [input, isLoading, sendMessage, granted]);

  return (
    <VanChatContext.Provider value={{ open, close }}>
      {children}

      {/* Slide-out chat panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-card shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-label="Van chat"
        aria-hidden={!isOpen}
      >
        <header className="flex items-center justify-between border-b border-border bg-sidebar px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-revenue text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Van</div>
              <div className="text-[11px] text-white/60">AI Operator</div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close Van chat"
            onClick={close}
            className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => {
            const text = messageText(m);
            if (!text && m.role !== "assistant") return null;
            return (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                    m.role === "user" ? "bg-revenue text-white" : "bg-secondary text-foreground",
                  )}
                >
                  {text || "…"}
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-destructive/10 px-3.5 py-2 text-sm text-destructive">
                Something went wrong. Please try sending your message again.
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Give Van a command…"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              type="button"
              size="icon"
              variant="revenue"
              aria-label="Send message to Van"
              disabled={isLoading || !input.trim()}
              onClick={send}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </VanChatContext.Provider>
  );
}
