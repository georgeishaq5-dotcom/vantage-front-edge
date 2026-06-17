import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";

import { NotificationBell } from "@/components/NotificationBell";
import { useVanChat } from "@/components/VanChat";
import { fetchMyProfile } from "@/lib/fsm";

export function HeaderBar() {
  const van = useVanChat();
  const { data: profile } = useQuery({
    queryKey: ["my_profile"],
    queryFn: fetchMyProfile,
  });

  const companyName = profile?.company_name?.trim() || "Vantage";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <span className="truncate text-sm font-bold tracking-tight text-foreground md:text-base">
        {companyName}
      </span>
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <button
          type="button"
          aria-label="Open Van AI assistant"
          onClick={() => van.open()}
          className="flex h-9 items-center gap-1.5 rounded-full bg-revenue px-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">Van</span>
        </button>
      </div>
    </header>
  );
}
