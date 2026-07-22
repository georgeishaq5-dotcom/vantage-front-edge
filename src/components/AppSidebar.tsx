import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Truck,
  KanbanSquare,
  Calendar,
  FileText,
  Clock,
  Contact,
  Receipt,
  Users,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import vantageLogo from "@/assets/vantage-logo.png";

import { supabase } from "@/integrations/supabase/client";

// Van's AI Hub is branded with a vehicle icon (matching the "Van" persona) in
// the canonical design, rather than a generic robot glyph.
const OPERATIONS_NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Dispatch Board", to: "/jobs", icon: KanbanSquare },
  { label: "Calendar", to: "/calendar", icon: Calendar },
  { label: "Estimates", to: "/estimates", icon: FileText },
  { label: "Customers", to: "/customers", icon: Contact },
  { label: "Client Ledger", to: "/ledger", icon: Receipt },
  { label: "Time & Timesheets", to: "/timesheets", icon: Clock },
  { label: "Van's AI Hub", to: "/ai-hub", icon: Truck },
  // Premium module — visible but not built yet (renders a coming-soon teaser).
  { label: "Financials", to: "/financials", icon: BarChart3, badge: "Soon" },
] as const;

const ACCOUNT_NAV = [
  { label: "My Team", to: "/team", icon: Users },
  { label: "Upgrade", to: "/upgrade", icon: Sparkle },
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
        "sticky top-0 hidden h-screen shrink-0 flex-col self-start bg-[oklch(0.112_0.02_263)] text-[oklch(0.95_0.006_247)] transition-[width] duration-300 ease-in-out md:flex",
        "border-r border-[oklch(1_0_0/8%)]",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex h-[58px] items-center border-b border-[oklch(1_0_0/8%)]",
          collapsed ? "justify-center px-2" : "justify-between px-[18px]",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img
              src={vantageLogo}
              alt="Vantage field service management logo"
              className="h-[19px] w-auto bg-transparent object-contain"
            />
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[oklch(0.95_0.006_247)]">
              Vantage
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-7 w-7 items-center justify-center text-[oklch(0.6_0.02_257)] transition-colors hover:text-[oklch(0.95_0.006_247)]"
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
          <span className="block px-3 pb-2 text-[9px] font-extrabold uppercase tracking-[0.26em] text-[oklch(0.45_0.02_257)]">
            Operations
          </span>
        )}
        {OPERATIONS_NAV.map((item) => (
          <SidebarNavLink key={item.to} item={item} pathname={pathname} collapsed={collapsed} />
        ))}

        {!collapsed && (
          <span className="block px-3 pb-2 pt-[18px] text-[9px] font-extrabold uppercase tracking-[0.26em] text-[oklch(0.45_0.02_257)]">
            Account
          </span>
        )}
        {ACCOUNT_NAV.map((item) => (
          <SidebarNavLink key={item.to} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-[oklch(1_0_0/8%)] px-[18px] py-3.5">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center bg-[oklch(0.3_0.02_260)] text-[10.5px] font-extrabold text-[oklch(0.95_0.006_247)]">
              {initials}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[11.5px] font-bold text-[oklch(0.95_0.006_247)]">
                {email || "Signed in"}
              </div>
              <div className="text-[10.5px] text-[oklch(0.55_0.02_257)]">Staff account</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "mt-2.5 flex w-full items-center gap-2 py-1.5 text-[11.5px] font-semibold text-[oklch(0.6_0.02_257)] transition-colors hover:text-[oklch(0.95_0.006_247)]",
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
  item: { label: string; to: string; icon: typeof LayoutDashboard; badge?: string };
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
        "relative flex h-9 items-center gap-2.5 px-3 text-xs font-bold tracking-wide transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]",
        collapsed && "justify-center px-0",
        active
          ? "bg-[oklch(1_0_0/6%)] text-[oklch(0.95_0.006_247)] shadow-[inset_2px_0_0_oklch(0.72_0.16_158)]"
          : "text-[oklch(0.6_0.02_257)] hover:text-[oklch(0.95_0.006_247)]",
      )}
    >
      <item.icon className="h-[15px] w-[15px] shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="rounded bg-[oklch(1_0_0/8%)] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider text-[oklch(0.6_0.02_257)]">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
