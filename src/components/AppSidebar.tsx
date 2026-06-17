import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Bot,
  KanbanSquare,
  CalendarDays,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Van's AI Hub", to: "/ai-hub", icon: Bot },
  { label: "Dispatch Board", to: "/jobs", icon: KanbanSquare },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  { label: "My Team", to: "/team", icon: Users },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col self-start bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
          V
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-white tracking-tight">Vantage</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
            FSM
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pt-2">
        {NAV.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-white">
            FS
          </div>
          <div className="leading-tight">
            <div className="text-xs font-medium text-white">Field Supervisor</div>
            <div className="text-[11px] text-sidebar-foreground/60">admin@vantage.io</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
