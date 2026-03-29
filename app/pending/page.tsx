"use client";

import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
  Clock,
  XCircle,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Mail,
} from "lucide-react";

const STEPS = [
  { label: "Account created",  completedIdx: 0 },
  { label: "Email verified",   completedIdx: 1 },
  { label: "Admin approval",   completedIdx: 2 },
  { label: "Access granted",   completedIdx: 3 },
];

// Which steps are "done" in the pending state
const PENDING_DONE = [true, true, false, false];

export default function PendingPage() {
  const router = useRouter();
  const { account_status, profile, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const isRejected = account_status === "rejected";

  return (
    <main className="min-h-screen flex bg-background">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 flex-col justify-between bg-blue-600 p-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 -right-32 h-64 w-64 rounded-full bg-blue-400/20 blur-2xl" />
          <div className="absolute -bottom-20 left-1/4 h-80 w-80 rounded-full bg-blue-800/30 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-1.5 rounded-full bg-white/70" />
            <span className="text-[20px] font-bold tracking-tight text-white">
              UNI<span className="text-blue-200">SON</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          <p className="text-2xl font-semibold text-white leading-snug">
            {isRejected
              ? "We're sorry this didn't work out."
              : "Almost there — just one step left."}
          </p>
          <p className="text-sm text-blue-100">
            {isRejected
              ? "Please reach out to your university admin for more information."
              : "Our admin team typically reviews accounts within 24 hours."}
          </p>
        </div>

        <div className="relative z-10 text-sm text-blue-200">
          UNISON Alumni Network
        </div>
      </div>

      {/* ── Right: content panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 min-h-screen">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2.5">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
          <span className="text-[18px] font-bold tracking-tight text-foreground">
            UNI<span className="text-blue-600">SON</span>
          </span>
        </div>

        <div className="w-full max-w-[400px] space-y-5">

          {/* Status icon */}
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
            isRejected
              ? "bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-200 dark:ring-rose-800"
              : "bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200 dark:ring-amber-800"
          }`}>
            {isRejected
              ? <XCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              : <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            }
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isRejected ? "Account not approved" : "Account under review"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRejected
                ? "Unfortunately your registration was not approved. Please contact the university administration for more information."
                : <>
                    Hi{" "}
                    <span className="font-medium text-foreground">
                      {profile?.display_name ?? "there"}
                    </span>
                    , your account is pending admin approval. We'll email{" "}
                    <span className="font-medium text-foreground">
                      {profile?.email ?? "you"}
                    </span>{" "}
                    once it's been reviewed.
                  </>
              }
            </p>
          </div>

          {/* Progress steps */}
          {!isRejected && (
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Account progress
              </p>
              {STEPS.map((step, i) => {
                const done = PENDING_DONE[i];
                const isCurrent = !done && PENDING_DONE[i - 1];
                return (
                  <div key={i} className="flex items-center gap-3">
                    {/* Step indicator */}
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done
                        ? "bg-blue-600 shadow-sm shadow-blue-600/25"
                        : isCurrent
                        ? "bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-400 dark:ring-amber-500"
                        : "bg-muted ring-1 ring-border/60"
                    }`}>
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : isCurrent ? (
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Label */}
                    <span className={`text-sm flex-1 ${
                      done
                        ? "text-foreground font-medium"
                        : isCurrent
                        ? "text-amber-700 dark:text-amber-400 font-medium"
                        : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </span>

                    {/* Status tag */}
                    {done && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Done
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Pending
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Email note */}
          {!isRejected && profile?.email && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-muted/50 border border-border/50">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Notification will be sent to{" "}
                <span className="font-medium text-foreground">{profile.email}</span>
              </p>
            </div>
          )}

          {/* Back button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full h-10 gap-2 border-border/60 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Button>

        </div>
      </div>

    </main>
  );
}
