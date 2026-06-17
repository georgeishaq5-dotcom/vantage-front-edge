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

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type VanMessage = { id: string; role: "user" | "van"; text: string };

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

export function VanChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState<VanMessage[]>([
    {
      id: "intro",
      role: "van",
      text: "Hi, I'm Van — your AI operator. Give me a command or ask for recommendations.",
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = useCallback((prefill?: string) => {
    setIsOpen(true);
    if (prefill) setInput(prefill);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text },
      {
        id: crypto.randomUUID(),
        role: "van",
        text: "Got it — I'm analyzing that now. (Van's live reasoning will connect here.)",
      },
    ]);
    setInput("");
  }, [input]);

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

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "user"
                    ? "bg-revenue text-white"
                    : "bg-secondary text-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
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
              variant={recording ? "destructive" : "secondary"}
              aria-label={recording ? "Stop recording" : "Record voice command"}
              aria-pressed={recording}
              onClick={() => setRecording((r) => !r)}
              className={cn(recording && "animate-pulse")}
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="revenue"
              aria-label="Send message to Van"
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
