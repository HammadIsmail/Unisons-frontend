"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  sendOTPSchema,
  resetPasswordSchema,
  SendOTPInput,
  ResetPasswordInput,
} from "@/schemas/auth.schemas";
import { sendOTP, verifyOTP, resetPassword } from "@/lib/api/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepIndicator } from "./StepIndicator";

import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

const STEPS = [
  { number: 1, label: "Enter Email" },
  { number: 2, label: "Verify Code" },
  { number: 3, label: "New Password" },
];

// ── Inline error ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  );
}

// ── Server error banner ───────────────────────────────────────────────────────

function ServerError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 mb-4">
      <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-rose-700 dark:text-rose-300">{message}</p>
    </div>
  );
}

// ── OTP input ─────────────────────────────────────────────────────────────────

function OTPInput({
  otp,
  onChange,
  onKeyDown,
  onPaste,
  inputRefs,
}: {
  otp: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}) {
  return (
    <div className="flex items-center justify-center gap-2.5" onPaste={onPaste}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          aria-label={`OTP digit ${index + 1} of 6`}
          className={`
            h-12 w-11 text-center text-lg font-bold rounded-xl border transition-all duration-150
            bg-background text-foreground outline-none
            ${digit
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20"
              : "border-border/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            }
          `}
        />
      ))}
    </div>
  );
}

// ── Password field with toggle ────────────────────────────────────────────────

function PasswordInput({
  id,
  label,
  show,
  onToggle,
  error,
  registration,
  placeholder,
}: {
  id: string;
  label: string;
  show: boolean;
  onToggle: () => void;
  error?: string;
  registration: object;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Input
          {...registration}
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          className={`h-10 text-sm pr-10 ${error ? "border-rose-400 focus-visible:ring-rose-500/20" : ""}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ForgotPasswordWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Using a ref array so OTPInput can focus next/prev
  const inputRefs = { current: [] as (HTMLInputElement | null)[] };

  const emailForm = useForm<SendOTPInput>({ resolver: zodResolver(sendOTPSchema) });
  const resetForm = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  // ── Step 1 ──
  const onSendOTP = async (formData: SendOTPInput) => {
    setServerError("");
    try {
      await sendOTP(formData.email, "forgot_password");
      setEmail(formData.email);
      setStep(2);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Failed to send OTP. Try again.");
    }
  };

  // ── Step 2: OTP handlers ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
  };

  const onVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) { setServerError("Please enter the complete 6-digit code."); return; }
    setServerError("");
    try {
      const response = await verifyOTP(email, otpString, "forgot_password");
      setVerifiedToken(response.verified_token);
      setStep(3);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Invalid code. Please try again.");
    }
  };

  // ── Step 3 ──
  const onResetPassword = async (formData: ResetPasswordInput) => {
    setServerError("");
    try {
      await resetPassword(verifiedToken, formData.new_password);
      router.push("/login?reset=success");
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Failed to reset password. Try again.");
    }
  };

  return (
    <div className="w-full space-y-1">
      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">

        <ServerError message={serverError} />

        {/* ── Step 1: Email ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Forgot your password?</p>
                <p className="text-xs text-muted-foreground">We'll send a reset code to your email.</p>
              </div>
            </div>

            <form onSubmit={emailForm.handleSubmit(onSendOTP)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                <Input
                  {...emailForm.register("email")}
                  id="email"
                  type="email"
                  placeholder="you@uet.edu.pk"
                  className={`h-10 text-sm ${emailForm.formState.errors.email ? "border-rose-400" : ""}`}
                />
                <FieldError message={emailForm.formState.errors.email?.message} />
              </div>
              <Button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/20 gap-2"
              >
                {emailForm.formState.isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                ) : "Send reset code"}
              </Button>
            </form>
          </div>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center ring-1 ring-violet-500/20">
                <KeyRound className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Enter reset code</p>
                <p className="text-xs text-muted-foreground">
                  Sent to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
            </div>

            <OTPInput
              otp={otp}
              onChange={handleOtpChange}
              onKeyDown={handleOtpKeyDown}
              onPaste={handleOtpPaste}
              inputRefs={inputRefs}
            />

            <Button
              onClick={onVerifyOTP}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/20"
            >
              Verify code
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Wrong email? Go back
            </button>
          </div>
        )}

        {/* ── Step 3: New Password ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Set new password</p>
                <p className="text-xs text-muted-foreground">Choose a strong password for your account.</p>
              </div>
            </div>

            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
              <PasswordInput
                id="new_password"
                label="New Password"
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                error={resetForm.formState.errors.new_password?.message}
                registration={resetForm.register("new_password")}
                placeholder="Min 8 chars, uppercase, number, special"
              />
              <PasswordInput
                id="confirm_password"
                label="Confirm Password"
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                error={resetForm.formState.errors.confirm_password?.message}
                registration={resetForm.register("confirm_password")}
              />
              <Button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/20 gap-2"
              >
                {resetForm.formState.isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</>
                ) : "Reset password"}
              </Button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
