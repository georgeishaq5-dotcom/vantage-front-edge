import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";

import { NotificationBell } from "@/components/NotificationBell";
import { useVanChat } from "@/components/VanChat";
import { fetchMyProfile } from "@/lib/fsm";
import vantageLogo from "@/assets/vantage-logo.png";

export function HeaderBar() {
  const van = useVanChat();
  const { data: profile } = useQuery({
    queryKey: ["my_profile"],
    queryFn: fetchMyProfile,
  });

  const companyName = profile?.company_name?.trim() || "Vantage";

  return (
    <header className="sticky top-0 z-30 flex h-[58px] items-center gap-2.5 border-b border-[oklch(0.2_0.02_262/9%)] bg-[oklch(0.985_0.002_247/82%)] px-4 backdrop-blur-[10px] md:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src={vantageLogo}
          alt={`${companyName} field service management logo`}
          className="h-[19px] w-auto shrink-0 bg-transparent object-contain"
        />
        <span className="truncate text-[15px] font-extrabold text-[oklch(0.22_0.02_262)]">
          {companyName}
        </span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <button
          type="button"
          aria-label="Open Van AI assistant"
          onClick={() => van.open()}
          className="flex h-[34px] items-center gap-1.5 bg-revenue px-3.5 text-[12.5px] font-extrabold text-[oklch(0.16_0.04_158)] transition-transform hover:brightness-[1.07] active:scale-[0.96]"
        >
          <Truck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Van</span>
        </button>
      </div>
    </header>
  );
}
