import { useState } from "react";
import {
  Bell,
  UserPlus,
  CheckCircle2,
  Truck,
  MessageSquare,
  Sparkles,
  Check,
  type LucideIcon,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/fsm";
import {
  useNotifications,
  CATEGORY_LABELS,
  type NotificationCategory,
} from "@/lib/notifications";

const CATEGORY_ICON: Record<NotificationCategory, LucideIcon> = {
  new_lead: UserPlus,
  quote_approved: CheckCircle2,
  job_status: Truck,
  customer_message: MessageSquare,
  quote_resurrection: Sparkles,
};

const CATEGORY_TINT: Record<NotificationCategory, string> = {
  new_lead: "bg-brand-muted text-brand",
  quote_approved: "bg-revenue-muted text-revenue",
  job_status: "bg-amber-50 text-amber-600",
  customer_message: "bg-sky-50 text-sky-600",
  quote_resurrection: "bg-violet-50 text-violet-600",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && unreadCount > 0) markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[360px] rounded-xl border-border p-0 shadow-md"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <Bell className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = CATEGORY_ICON[n.category];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                        !n.read && "bg-brand-muted/30",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          CATEGORY_TINT[n.category],
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {n.title}
                          </span>
                          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                          {CATEGORY_LABELS[n.category]} · {formatRelativeTime(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={markAllRead}
            >
              <Check className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
