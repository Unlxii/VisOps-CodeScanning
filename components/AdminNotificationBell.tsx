"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Bell, UserPlus, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useSWR(
    "/api/admin/notifications/pending-users",
    fetcher,
    { refreshInterval: 30000 } // poll every 30s
  );

  const pendingUsers: any[] = data?.pendingUsers || [];
  const count = data?.count || 0;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
        title="Pending user approvals"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in duration-200 shadow-sm">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus size={15} className="text-orange-500" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Pending Approvals
              </span>
              {count > 0 && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </div>
            <Link
              href="/admin/users?tab=PENDING"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              Manage all
              <ExternalLink size={11} />
            </Link>
          </div>

          {/* User List */}
          <div className="max-h-72 overflow-y-auto">
            {pendingUsers.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pending approvals</p>
              </div>
            ) : (
              pendingUsers.map((u) => (
                <Link
                  key={u.id}
                  href="/admin/users?tab=PENDING"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm font-bold shrink-0">
                    {(u.name || u.email || "?").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {u.name || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {u.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                    <Clock size={10} />
                    {timeAgo(u.createdAt)}
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer CTA */}
          {count > 0 && (
            <div className="px-4 py-3 bg-orange-50 dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-900/20">
              <Link
                href="/admin/users?tab=PENDING"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <UserPlus size={14} />
                Approve {count} pending user{count !== 1 ? "s" : ""}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
