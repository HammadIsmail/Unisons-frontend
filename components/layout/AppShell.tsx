"use client";

import Navbar from "./Navbar";
import { useChatSocket } from "@/hooks/useChatSocket";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Initialize real-time chat socket listener
  useChatSocket();
  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <main className="w-full">
          <div className="animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}