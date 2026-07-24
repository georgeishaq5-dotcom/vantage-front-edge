import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bot, Mic, Send, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAiConsent } from "@/components/AiConsentGate";
import { supabase } from "@/integrations/supabase/client";
import { createJob } from "@/lib/jobs.functions";
import { executeVanTool, type VanToolContext } from "@/lib/van-tools.actions";
import { useSpeechInput } from "@/hooks/useSpeechInput";

type OpenOptions = { voice?: boolean };

type VanChatContextValue = {
  open: (prefill?: string, opts?: OpenOptions) => void;
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

// Renders Van's replies as markdown so **bold**, bullet lists, etc. display
// formatted instead of showing raw asterisks. Element styles are kept tight to
// fit the narrow chat bubble.
function VanMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-2 [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-4">{children}</ol>,
          li: ({ children }) => <li className="marker:text-muted-foreground">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function VanChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Van's tools run in the browser as the signed-in user. `createJob` goes
  // through its server fn (RLS + active-job cap); `invalidate` refreshes the
  // React Query caches so the UI reflects Van's changes instantly.
  const createJobFn = useServerFn(createJob);
  const queryClient = useQueryClient();
  // Held in a ref so the tool callback always sees the latest closures without
  // re-subscribing useChat on every render.
  const toolCtx = useRef<VanToolContext>(undefined as unknown as VanToolContext);
  toolCtx.current = {
    createJob: (args) => createJobFn(args) as Promise<{ id: string; title: string }>,
    invalidate: (keys) => {
      for (const key of keys) queryClient.invalidateQueries({ queryKey: [key] });
    },
  };

  const { messages, sendMessage, addToolResult, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
    messages: [INTRO],
    // NOTE: tool execution is intentionally NOT done in `onToolCall`. That
    // callback is awaited inside the stream's serial job executor, and
    // `addToolResult` schedules on that same executor — awaiting it there
    // deadlocks the stream (status pins to "streaming" forever). Instead we
    // detect pending tool calls after the stream settles (effect below) and
    // execute them then; `sendAutomaticallyWhen` resumes the model to narrate.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError: (err) => {
      console.error("[VanChat] stream error:", err);
      toast.error("Van couldn't respond. Please try again.");
    },
  });

  // Execute Van's tool calls once the stream settles (status "ready"), outside
  // the stream job so `addToolResult` can run and trigger the auto-resume.
  const executedToolCalls = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (status !== "ready") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    for (const part of last.parts) {
      const type = part.type;
      const isTool =
        typeof type === "string" && (type.startsWith("tool-") || type === "dynamic-tool");
      if (!isTool) continue;
      const p = part as unknown as {
        state?: string;
        toolCallId?: string;
        toolName?: string;
        input?: unknown;
      };
      if (p.state !== "input-available" || !p.toolCallId) continue;
      if (executedToolCalls.current.has(p.toolCallId)) continue;
      executedToolCalls.current.add(p.toolCallId);
      const toolName = type === "dynamic-tool" ? (p.toolName ?? "") : type.slice("tool-".length);
      const toolCallId = p.toolCallId;
      void (async () => {
        const output = await executeVanTool(toolName, p.input, toolCtx.current);
        await addToolResult({ tool: toolName, toolCallId, output });
      })();
    }
  }, [messages, status, addToolResult]);

  const isLoading = status === "submitted" || status === "streaming";
  const { ensureConsent, granted } = useAiConsent();
  const [wantVoice, setWantVoice] = useState(false);

  // Click-to-talk: dictated text lands in the input for the operator to review
  // and send (so a mis-hear never fires an action on its own).
  const {
    supported: micSupported,
    listening,
    start: startMic,
    stop: stopMic,
    toggle: toggleMic,
  } = useSpeechInput({
    onResult: (t) => {
      setInput((prev) => (prev.trim() ? `${prev.trim()} ${t}` : t));
      inputRef.current?.focus();
    },
  });

  const open = useCallback(
    (prefill?: string, opts?: OpenOptions) => {
      // Gate the AI agent behind explicit consent before opening the chat.
      if (!ensureConsent()) return;
      setIsOpen(true);
      if (prefill) setInput(prefill);
      if (opts?.voice) setWantVoice(true);
    },
    [ensureConsent],
  );

  const close = useCallback(() => {
    stopMic();
    setIsOpen(false);
  }, [stopMic]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Auto-start the mic when Van was opened via a "Talk" entry point.
  useEffect(() => {
    if (isOpen && wantVoice && micSupported) {
      const t = setTimeout(() => startMic(), 250);
      setWantVoice(false);
      return () => clearTimeout(t);
    }
    if (!isOpen && wantVoice) setWantVoice(false);
  }, [isOpen, wantVoice, micSupported, startMic]);

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
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                    m.role === "user"
                      ? "whitespace-pre-wrap bg-revenue text-white"
                      : "bg-secondary text-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    text ? (
                      <VanMarkdown>{text}</VanMarkdown>
                    ) : (
                      "…"
                    )
                  ) : (
                    text || "…"
                  )}
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
              placeholder={listening ? "Listening… speak now" : "Talk or type a command…"}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            {micSupported && (
              <Button
                type="button"
                size="icon"
                variant={listening ? "destructive" : "outline"}
                aria-label={listening ? "Stop listening" : "Talk to Van"}
                aria-pressed={listening}
                onClick={toggleMic}
                className={cn(listening && "animate-pulse")}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
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
