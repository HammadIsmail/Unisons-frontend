import Link from "next/link";
import { ReactNode } from "react";

interface AuthShellProps {
  heading: string;
  subheading: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ heading, subheading, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen flex bg-background">

      {/* ── Left decorative panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 flex-col justify-between bg-blue-600 p-10 relative overflow-hidden">

        {/* Background pattern */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 -right-32 h-64 w-64 rounded-full bg-blue-400/20 blur-2xl" />
          <div className="absolute -bottom-20 left-1/4 h-80 w-80 rounded-full bg-blue-800/30 blur-3xl" />
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-1.5 rounded-full bg-white/70" />
            <span className="text-[20px] font-bold tracking-tight text-white">
              UNI<span className="text-blue-200">SON</span>
            </span>
          </div>
        </div>

        {/* Tagline block */}
        <div className="relative z-10 space-y-4">
          <blockquote className="text-2xl font-semibold text-white leading-snug">
            "Where graduates stay connected, grow together, and give back."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["bg-blue-300", "bg-blue-200", "bg-white/60"].map((c, i) => (
                <div key={i} className={`h-8 w-8 rounded-full ${c} ring-2 ring-blue-600`} />
              ))}
            </div>
            <p className="text-sm text-blue-100">
              Join thousands of alumni already on the network
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {[
            "Discover job and internship opportunities",
            "Connect with mentors in your field",
            "Stay in touch with your batch mates",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm text-blue-100">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 min-h-screen">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2.5">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
          <span className="text-[18px] font-bold tracking-tight text-foreground">
            UNI<span className="text-blue-600">SON</span>
          </span>
        </div>

        <div className="w-full max-w-[400px] space-y-6">

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{heading}</h1>
            <p className="text-sm text-muted-foreground">{subheading}</p>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
            {children}
          </div>

          {/* Footer link */}
          {footer && (
            <div className="text-center">
              {footer}
            </div>
          )}

        </div>
      </div>

    </main>
  );
}
