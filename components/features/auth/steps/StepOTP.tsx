"use client";

import { useState, useRef } from "react";
import { verifyOTP, sendOTP } from "@/lib/api/auth.api";
import useRegistrationStore from "@/store/registrationStore";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, KeyRound, ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StepOTP() {
  const { email, otpType, setVerifiedToken, setStep } = useRegistrationStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [serverError, setServerError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) { setServerError("Please enter the complete 6-digit code."); return; }
    setIsVerifying(true);
    setServerError("");
    try {
      const response = await verifyOTP(email, otpString, otpType);
      setVerifiedToken(response.verified_token);
      setStep(3);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage("");
    setServerError("");
    try {
      await sendOTP(email, otpType);
      setResendMessage("A new code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Failed to resend. Try again.");
    } finally {
      setIsResending(false);
    }
  };

  const filled = otp.filter(Boolean).length;

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
          <KeyRound className="h-5 w-5 text-[#0a66c2]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Verification Code</h3>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            Check your email <span className="font-semibold text-foreground">{email}</span> for the 6-digit code.
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
        {resendMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-tight">
              {resendMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`
                h-12 w-10 sm:w-12 text-center text-lg font-bold rounded-xl border transition-all duration-150
                bg-muted/30 text-foreground outline-none
                ${digit
                  ? "border-[#0a66c2] ring-2 ring-[#0a66c2]/10 bg-white"
                  : "border-border/60 focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/10"
                }
              `}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {otp.map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                width: i < filled ? 16 : 8,
                backgroundColor: i < filled ? "#0a66c2" : "#e2e8f0"
              }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      </div>

      <Button
        onClick={handleVerify}
        disabled={isVerifying || filled < 6}
        className="w-full h-11 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-blue-500/10 disabled:opacity-50"
      >
        {isVerifying ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying...</span>
          </div>
        ) : (
          "Verify and Continue"
        )}
      </Button>

      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#0a66c2] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Edit Email
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0a66c2] hover:underline disabled:opacity-50"
        >
          {isResending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
          Resend Code
        </button>
      </div>
    </motion.div>
  );
}
