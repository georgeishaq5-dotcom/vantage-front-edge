import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Clock,
  Menu,
  Bot,
  Contact,
  Users,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VantageLogo } from "@/components/VantageLogo";

const PRIMARY = [
  { label: "Home", to: "/dashboard", icon: LayoutDashboard },
  { label: "Schedule", to: "/calendar", icon: CalendarDays },
  { label: "Estimates", to: "/quotes", icon: FileText },
  { label: "Time", to: "/timesheets", icon: Clock },
] as const;

const MORE = [
  { label: "Van's AI Hub", to: "/ai-hub", icon: Bot },
  { label: "Dispatch Board", to: "/jobs", icon: LayoutDashboard },
  { label: "Estimates List", to: "/estimates", icon: FileText },
  { label: "Customers", to: "/customers", icon: Contact },
  { label: "My Team", to: "/team", icon: Users },
  { label: "Upgrade", to: "/upgrade", icon: Sparkles },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const [moreOpen, setMoreOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  const email = user?.email ?? "";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {PRIMARY.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-brand" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <SheetTitle className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                  <VantageLogo className="h-4 w-5" />
                </span>
                Menu
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col px-3 py-3">
              {MORE.map((item) => {
                const active = pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto border-t border-border px-5 py-4">
              {email && (
                <p className="mb-3 truncate text-xs text-muted-foreground">{email}</p>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sign out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
