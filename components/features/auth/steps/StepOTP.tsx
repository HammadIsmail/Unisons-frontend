"use client";

import { useState, useRef } from "react";
import { verifyOTP, sendOTP } from "@/lib/api/auth.api";
import useRegistrationStore from "@/store/registrationStore";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, KeyRound, ArrowLeft, Loader2, RotateCcw } from "lucide-react";

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
      // Shake the inputs by clearing them
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
    <div className="space-y-5">

      {/* Step header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 flex-shrink-0">
          <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Enter verification code</p>
          <p className="text-xs text-muted-foreground">
            Sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{serverError}</p>
        </div>
      )}

      {/* Resend success */}
      {resendMessage && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{resendMessage}</p>
        </div>
      )}

      {/* OTP inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2.5" onPaste={handlePaste}>
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
              aria-label={`OTP digit ${index + 1} of 6`}
              className={`
                h-12 w-11 text-center text-lg font-bold rounded-xl border transition-all duration-150
                bg-background text-foreground outline-none
                ${digit
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20"
                  : "border-border/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                }
              `}
            />
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {otp.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-200 ${
                i < filled ? "w-4 bg-blue-500" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Verify button */}
      <Button
        onClick={handleVerify}
        disabled={isVerifying || filled < 6}
        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/20 gap-2 disabled:opacity-40"
      >
        {isVerifying ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
        ) : "Verify code"}
      </Button>

      {/* Resend + back */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Wrong email?
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
        >
          {isResending ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Resending…</>
          ) : (
            <><RotateCcw className="h-3 w-3" /> Resend code</>
          )}
        </button>
      </div>

    </div>
  );
}
