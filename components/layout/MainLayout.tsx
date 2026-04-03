"use client";

import Navbar from "./Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 w-full">
        <section className="w-full">
          {children}
        </section>
      </main>
    </div>
  );
}
