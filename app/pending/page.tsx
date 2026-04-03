"use client";

import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import {
  Clock,
  XCircle,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Mail,
  ShieldCheck,
} from "lucide-react";

const STEPS = [
  { label: "Account created",  completedIdx: 0 },
  { label: "Email verified",   completedIdx: 1 },
  { label: "Admin approval",   completedIdx: 2 },
  { label: "Access granted",   completedIdx: 3 },
];

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
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 flex-col justify-between bg-[#0a66c2] p-10 relative overflow-hidden">
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

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-1.5 rounded-full bg-white/70" />
            <span className="text-[20px] font-bold tracking-tight text-white">
              UNI<span className="text-blue-200">SON</span>
            </span>
          </div>
        </motion.div>

        <div className="relative z-10 space-y-4">
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white leading-tight"
          >
            {isRejected
              ? "We're sorry this didn't work out."
              : "Quality is our priority."}
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-blue-100 leading-relaxed max-w-[280px]"
          >
            {isRejected
              ? "Please reach out to your university admin for more information."
              : "To maintain a safe and professional community, every profile is manually verified by our team."}
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 text-xs font-medium text-blue-200/80 uppercase tracking-widest"
        >
          Trust & Safety Center
        </motion.div>
      </div>

      {/* ── Right: content panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 min-h-screen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[420px] space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-2.5">
            <div className="h-5 w-1 rounded-full bg-[#0a66c2]" />
            <span className="text-[18px] font-bold tracking-tight text-foreground">
              UNI<span className="text-[#0a66c2]">SON</span>
            </span>
          </div>

          <div className="space-y-6">
            {/* Status icon */}
            <div className={`h-20 w-20 rounded-3xl flex items-center justify-center mx-auto shadow-sm relative ${
              isRejected
                ? "bg-red-50 ring-1 ring-red-100"
                : "bg-amber-50 ring-1 ring-amber-100"
            }`}>
              {isRejected
                ? <XCircle className="h-10 w-10 text-red-600" />
                : <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
              }
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center border border-border">
                <ShieldCheck className="h-4 w-4 text-[#0a66c2]" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isRejected ? "Registration Not Approved" : "Verification in Progress"}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isRejected
                  ? "Unfortunately, we couldn't verify your affiliation. Please contact the administration."
                  : <>
                      Hi <span className="font-bold text-foreground">{profile?.display_name ?? "User"}</span>, your account is being reviewed. You'll receive an email as soon as you're approved.
                    </>
                }
              </p>
            </div>
          </div>

          <AnimatePresence>
            {!isRejected && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                  Verification Roadmap
                </p>
                <div className="space-y-4">
                  {STEPS.map((step, i) => {
                    const done = PENDING_DONE[i];
                    const isCurrent = !done && PENDING_DONE[i - 1];
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          done
                            ? "bg-[#0a66c2] shadow-blue-500/20"
                            : isCurrent
                            ? "bg-amber-50 ring-2 ring-amber-400"
                            : "bg-muted ring-1 ring-border/60"
                        }`}>
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          ) : isCurrent ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
                          ) : (
                            <Circle className="h-2 w-2 text-muted-foreground/30" />
                          )}
                        </div>
                        <span className={`text-sm flex-1 ${
                          done ? "text-foreground font-semibold" : isCurrent ? "text-amber-700 font-bold" : "text-muted-foreground"
                        }`}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <motion.span 
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"
                          >
                            Current Step
                          </motion.span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 rounded-full border-border/60 text-sm font-bold gap-2 hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Sign out and go back
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              Questions? Contact help@unison.edu.pk
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
