"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { sendOTPSchema, SendOTPInput } from "@/schemas/auth.schemas";
import { sendOTP } from "@/lib/api/auth.api";
import useRegistrationStore from "@/store/registrationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Mail, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function StepEmail() {
  const { setEmail, setStep, setOtpType } = useRegistrationStore();
  const [serverError, setServerError] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SendOTPInput>({
    resolver: zodResolver(sendOTPSchema),
  });

  useEffect(() => {
    if (retryAfter <= 0) return;
    const interval = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfter]);

  const onSubmit = async (formData: SendOTPInput) => {
    setServerError("");
    try {
      setOtpType("email_verification");
      await sendOTP(formData.email, "email_verification");
      setEmail(formData.email);
      setStep(2);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Failed to send OTP. Try again.");
      if (error.response?.status === 429) {
        const retrySeconds = Number(error.response?.data?.retry_after_seconds) || 60;
        setRetryAfter(retrySeconds);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30">
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
          <Mail className="h-5 w-5 text-[#0a66c2]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Verify your email</h3>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            We'll send a 6-digit code to your university email to verify your identity.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {serverError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
          >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 leading-tight">
              {serverError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground ml-1">
            University Email
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#0a66c2] transition-colors">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="you@uet.edu.pk"
              className={`h-11 pl-10 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                errors.email ? "border-red-400 focus-visible:ring-red-500/10" : ""
              }`}
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[11px] font-medium text-red-600 flex items-center gap-1.5 ml-1"
            >
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </motion.p>
          )}
        </div>

        <AnimatePresence>
          {retryAfter > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center justify-center gap-2 text-xs font-normal text-gray-500 dark:text-gray-400"
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Try again in {formatCountdown(retryAfter)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={isSubmitting || retryAfter > 0}
          className="w-full h-11 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-blue-500/10"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending code...</span>
            </div>
          ) : (
            "Send verification code"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
