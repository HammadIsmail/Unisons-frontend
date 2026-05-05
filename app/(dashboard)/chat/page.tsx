"use client";

import { MessageSquare, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default function MessagesRootPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-muted/10 dark:bg-muted/5 p-8 select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center max-w-sm">
        {/* Icon cluster */}
        <div className="relative mb-8">
          {/* Background ring */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 flex items-center justify-center shadow-xl shadow-blue-500/10 ring-1 ring-blue-200/50 dark:ring-blue-800/30">
            <MessageSquare className="w-12 h-12 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </div>

          {/* Floating decorative icons */}
          <div
            className="absolute -top-2 -right-3 w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-border/50 flex items-center justify-center"
            style={{ animation: "chatFloat 4s ease-in-out infinite" }}
          >
            <Sparkles className="w-[18px] h-[18px] text-amber-500" />
          </div>
          <div
            className="absolute -bottom-1 -left-4 w-9 h-9 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-border/50 flex items-center justify-center"
            style={{ animation: "chatFloat 4s ease-in-out infinite 1s" }}
          >
            <Users className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
          Your Messages
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-[260px]">
          Select a conversation from the sidebar to start chatting with your alumni network.
        </p>

        {/* CTA */}
        <Link
          href="/network"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Users className="w-4 h-4" />
          Explore Connections
        </Link>

        {/* Feature hints */}
        <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-xs">
          {[
            { emoji: "💬", label: "Real-time chat" },
            { emoji: "🔔", label: "Read receipts" },
            { emoji: "🔍", label: "Search chats" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1.5 p-3 bg-background/80 dark:bg-background/60 rounded-xl border border-border/40 shadow-sm"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-[10.5px] font-medium text-muted-foreground text-center leading-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes chatFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
