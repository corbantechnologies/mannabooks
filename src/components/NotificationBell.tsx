"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  type NotificationType,
} from "@/lib/actions/notifications";
import toast from "react-hot-toast";

interface NotificationItem {
  id: string;
  userId: string;
  shopId: string | null;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

interface NotificationBellProps {
  shopId: string;
  shopSlug: string;
}

const TYPE_CONFIG: Record<string, { icon: string; badge: string; bg: string }> = {
  INVOICE_OVERDUE: { icon: "🔴", badge: "Overdue", bg: "bg-rose-50 border-rose-200 text-rose-800" },
  SUBSCRIPTION_ALERT: { icon: "⚡", badge: "Subscription", bg: "bg-amber-50 border-amber-200 text-amber-900" },
  QUOTE_EXPIRED: { icon: "⏳", badge: "Quote Expired", bg: "bg-orange-50 border-orange-200 text-orange-900" },
  QUOTE_ACCEPTED: { icon: "✓", badge: "Quote Accepted", bg: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  PAYMENT_RECEIVED: { icon: "💰", badge: "Payment", bg: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  STOCK_LOW: { icon: "⚠️", badge: "Low Stock", bg: "bg-amber-50 border-amber-200 text-amber-800" },
  SYSTEM: { icon: "🔔", badge: "System", bg: "bg-zinc-50 border-zinc-200 text-zinc-700" },
};

export function NotificationBell({ shopId, shopSlug }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      const res = await getNotificationsAction(shopId);
      if (res.success) {
        setNotifications((res.notifications as any) || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  useEffect(() => {
    loadNotifications();
    // Periodic refresh every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [shopId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleMarkRead(id: string, link?: string | null) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await markNotificationReadAction(id, shopSlug);

    if (link) {
      setIsOpen(false);
      router.push(link);
    }
  }

  async function handleMarkAllRead() {
    setLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const res = await markAllNotificationsReadAction(shopId, shopSlug);
    setLoading(false);
    if (res.success) {
      toast.success("All notifications marked as read.");
    }
  }

  const displayedList = filter === "UNREAD" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL ICON BUTTON */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        title="Activity & Notifications"
        className="relative p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-md transition-colors flex items-center justify-center cursor-pointer border border-zinc-200 bg-white"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-zinc-200/90 rounded-lg shadow-xl z-50 overflow-hidden font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* HEADER */}
          <div className="p-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-tight text-black text-xs">
                Activity &amp; Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-200">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[10px] text-zinc-500 hover:text-black font-semibold uppercase underline hover:no-underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* FILTER TABS */}
          <div className="flex border-b border-zinc-100 bg-white px-3 pt-2 text-[11px] gap-3">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`pb-2 font-semibold border-b-2 transition-colors ${
                filter === "ALL"
                  ? "border-black text-black"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("UNREAD")}
              className={`pb-2 font-semibold border-b-2 transition-colors ${
                filter === "UNREAD"
                  ? "border-black text-black"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* NOTIFICATION LIST */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
            {displayedList.map((item) => {
              const conf = TYPE_CONFIG[item.type] || TYPE_CONFIG.SYSTEM;
              return (
                <div
                  key={item.id}
                  className={`p-3 transition-colors flex items-start gap-3 relative group ${
                    item.isRead ? "bg-white hover:bg-zinc-50/80" : "bg-blue-50/30 hover:bg-blue-50/60"
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{conf.icon}</span>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${conf.bg}`}>
                        {conf.badge}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className={`text-xs font-semibold text-black leading-snug ${item.isRead ? "text-zinc-700" : "text-black"}`}>
                      {item.title}
                    </p>

                    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {item.link && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(item.id, item.link)}
                        className="text-[11px] font-semibold text-blue-600 hover:underline pt-0.5 inline-block text-left"
                      >
                        View Details →
                      </button>
                    )}
                  </div>

                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                      title="Mark as read"
                      className="text-zinc-300 hover:text-black p-1 rounded transition-colors shrink-0"
                    >
                      ✓
                    </button>
                  )}
                </div>
              );
            })}

            {displayedList.length === 0 && (
              <div className="py-10 text-center text-zinc-400 space-y-1">
                <p className="text-xl">✨</p>
                <p className="font-semibold text-xs text-zinc-600">
                  {filter === "UNREAD" ? "No unread notifications" : "No activity notifications"}
                </p>
                <p className="text-[10px] text-zinc-400">
                  System alerts, quotation decisions, and overdue updates will show up here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
