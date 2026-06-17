import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NotificationCategory =
  | "new_lead"
  | "quote_approved"
  | "job_status"
  | "customer_message"
  | "quote_resurrection";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  new_lead: "New Lead",
  quote_approved: "Quote Approved",
  job_status: "Job Status Change",
  customer_message: "Customer Message",
  quote_resurrection: "Quote Resurrection",
};

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  pushEnabled: boolean;
  notify: (
    category: NotificationCategory,
    title: string,
    body: string,
  ) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  enablePush: () => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const STORAGE_KEY = "vantage_notifications";
const PUSH_KEY = "vantage_push_enabled";

const SEED: Omit<AppNotification, "createdAt">[] = [
  {
    id: "seed-lead",
    category: "new_lead",
    title: "New lead captured",
    body: "Website widget captured a prospect for gutter cleaning in Maple Heights.",
    read: false,
  },
  {
    id: "seed-quote",
    category: "quote_approved",
    title: "Quote approved & signed",
    body: "Jordan Reyes checked out and e-signed a $1,240 estimate.",
    read: false,
  },
  {
    id: "seed-status",
    category: "job_status",
    title: "Tech en route",
    body: "Marcus Webb marked the Collins job as 'En Route'.",
    read: true,
  },
];

function loadStored(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppNotification[];
  } catch {
    /* ignore */
  }
  const now = Date.now();
  return SEED.map((n, i) => ({ ...n, createdAt: now - i * 1_800_000 }));
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    setNotifications(loadStored());
    setPushEnabled(window.localStorage.getItem(PUSH_KEY) === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || notifications.length === 0) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  const notify = useCallback<NotificationsContextValue["notify"]>(
    (category, title, body) => {
      const entry: AppNotification = {
        id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category,
        title,
        body,
        createdAt: Date.now(),
        read: false,
      };
      setNotifications((prev) => [entry, ...prev].slice(0, 50));

      // Mirror to native push if the user has enabled it.
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, { body });
        } catch {
          /* ignore */
        }
      }
    },
    [],
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, "[]");
  }, []);

  const enablePush = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      // No native support — still flip the in-app toggle on.
      setPushEnabled(true);
      if (typeof localStorage !== "undefined") localStorage.setItem(PUSH_KEY, "1");
      return true;
    }
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    const ok = permission === "granted";
    setPushEnabled(ok);
    window.localStorage.setItem(PUSH_KEY, ok ? "1" : "0");
    return ok;
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      pushEnabled,
      notify,
      markRead,
      markAllRead,
      clearAll,
      enablePush,
    }),
    [notifications, unreadCount, pushEnabled, notify, markRead, markAllRead, clearAll, enablePush],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
