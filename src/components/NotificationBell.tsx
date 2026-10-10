"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import toast from "react-hot-toast";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useNotifications(shopId);
  const markReadMutation = useMarkNotificationRead(shopId);
  const markAllReadMutation = useMarkAllNotificationsRead(shopId);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

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
    markReadMutation.mutate(id);
    if (link) {
      setIsOpen(false);
      router.push(link);
    }
  }

  async function handleMarkAllRead() {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read.");
      },
    });
  }

  const displayedList =
    filter === "UNREAD"
      ? notifications.filter((n) => !n.is_read && !n.isRead)
      : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL ICON BUTTON */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) refetch();
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
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN PANEL */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-zinc-200/80 rounded-xl shadow-2xl z-50 overflow-hidden font-mono text-xs animate-in zoom-in-95 duration-100 origin-top-right">
          {/* HEADER */}
          <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold uppercase tracking-wider text-xs text-black">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  className="text-[10px] text-zinc-500 hover:text-black hover:underline uppercase transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* FILTER TABS */}
          <div className="flex border-b border-zinc-100 bg-white text-[10px] font-semibold uppercase">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
                filter === "ALL"
                  ? "border-black text-black"
                  : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("UNREAD")}
              className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
                filter === "UNREAD"
                  ? "border-black text-black"
                  : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* LIST CONTAINER */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
            {displayedList.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <p className="text-xl mb-1">🎉</p>
                <p className="font-sans text-xs">
                  {filter === "UNREAD" ? "No unread notifications" : "No notifications yet"}
                </p>
              </div>
            ) : (
              displayedList.map((notif) => {
                const isRead = Boolean(notif.is_read || notif.isRead);
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
                const dateStr = notif.created_at || notif.createdAt;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkRead(notif.id, notif.link)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      isRead ? "bg-white hover:bg-zinc-50" : "bg-emerald-50/20 hover:bg-emerald-50/40"
                    }`}
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${config.bg}`}
                        >
                          {config.badge}
                        </span>
                        {dateStr && (
                          <span className="text-[9px] text-zinc-400">
                            {new Date(dateStr).toLocaleDateString("en-KE", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs font-sans truncate ${
                          isRead ? "text-zinc-700 font-normal" : "text-black font-semibold"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-sans line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
