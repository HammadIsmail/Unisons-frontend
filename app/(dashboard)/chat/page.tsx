"use client";

import { MessageSquare, Users, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function MessagesRootPage() {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center h-full bg-muted/5 select-none">
      <div className="flex flex-col items-center text-center max-w-xs">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-border/60 flex items-center justify-center mb-6 shadow-sm">
          <MessageSquare className="w-6 h-6 text-slate-600 dark:text-slate-300" strokeWidth={1.5} />
        </div>

        <h2 className="text-[18px] font-semibold text-foreground mb-2 tracking-tight">
          Select a conversation
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-7 max-w-[220px]">
          Choose from the sidebar or start a new conversation with your network.
        </p>

        <Link
          href="/network"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[13px] font-medium rounded-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        >
          <Users className="w-3.5 h-3.5" />
          Browse Network
        </Link>

        {/* Subtle feature list */}
        <div className="mt-10 flex flex-col gap-2.5 text-left w-full max-w-[200px]">
          {[
            { icon: Zap, label: "Real-time messaging" },
            { icon: ShieldCheck, label: "Read receipts" },
            { icon: MessageSquare, label: "Message history" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-3 h-3 text-muted-foreground/70" />
              </div>
              <span className="text-[12px] text-muted-foreground/60 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
