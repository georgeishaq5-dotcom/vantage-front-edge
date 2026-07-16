import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Bot,
  KanbanSquare,
  CalendarDays,
  FileText,
  Clock,
  Contact,
  Users,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import vantageLogo from "@/assets/vantage-logo.png";


import { supabase } from "@/integrations/supabase/client";

const OPERATIONS_NAV = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Van's AI Hub", to: "/ai-hub", icon: Bot },
  { label: "Dispatch Board", to: "/jobs", icon: KanbanSquare },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  { label: "Estimates", to: "/estimates", icon: FileText },
  { label: "Customers", to: "/customers", icon: Contact },
  { label: "Time & Timesheets", to: "/timesheets", icon: Clock },
] as const;

const ACCOUNT_NAV = [
  { label: "My Team", to: "/team", icon: Users },
  { label: "Upgrade", to: "/upgrade", icon: Sparkles },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

const COLLAPSE_KEY = "vantage_sidebar_collapsed";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  const email = user?.email ?? "";
  const initials = email ? email.slice(0, 2).toUpperCase() : "VF";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col self-start border-r border-white/5 bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out md:flex",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex h-[58px] items-center border-b border-white/5",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img
              src={vantageLogo}
              alt="Vantage field service management logo"
              className="h-[19px] w-auto bg-transparent object-contain"
            />
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-white">Vantage</span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-7 w-7 items-center justify-center text-sidebar-foreground/60 transition-colors hover:text-white"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pt-3.5">
        {!collapsed && (
          <span className="block px-3 pb-2 text-[9px] font-extrabold uppercase tracking-[0.26em] text-sidebar-foreground/40">
            Operations
          </span>
        )}
        {OPERATIONS_NAV.map((item) => (
          <SidebarNavLink key={item.to} item={item} pathname={pathname} collapsed={collapsed} />
        ))}

        {!collapsed && (
          <span className="block px-3 pb-2 pt-4 text-[9px] font-extrabold uppercase tracking-[0.26em] text-sidebar-foreground/40">
            Account
          </span>
        )}
        {ACCOUNT_NAV.map((item) => (
          <SidebarNavLink key={item.to} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-white/5 px-4 py-3.5">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center bg-white/10 text-[10.5px] font-extrabold text-white">
              {initials}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[11.5px] font-bold text-white">{email || "Signed in"}</div>
              <div className="text-[10.5px] text-sidebar-foreground/55">Staff account</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "mt-2.5 flex w-full items-center gap-2 py-1.5 text-[11.5px] font-semibold text-sidebar-foreground/70 transition-colors hover:text-white",
            collapsed && "mt-0 justify-center px-0",
          )}
        >
          <LogOut className="h-[13px] w-[13px] shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}

function SidebarNavLink({
  item,
  pathname,
  collapsed,
}: {
  item: { label: string; to: string; icon: typeof LayoutDashboard };
  pathname: string;
  collapsed: boolean;
}) {
  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
  return (
    <Link
      key={item.to}
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 px-3 text-xs font-semibold tracking-wide transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-white shadow-[inset_2px_0_0_var(--sidebar-primary)]"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-white",
      )}
    >
      <item.icon className="h-[15px] w-[15px] shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
    </Link>
  );
}
