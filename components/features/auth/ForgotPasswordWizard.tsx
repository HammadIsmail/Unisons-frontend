"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  sendOTPSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  SendOTPInput,
  VerifyOTPInput,
  ResetPasswordInput,
} from "@/schemas/auth.schemas";
import { sendOTP, verifyOTP, resetPassword } from "@/lib/api/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STEPS = [
  { number: 1, label: "Enter Email" },
  { number: 2, label: "Verify Code" },
  { number: 3, label: "New Password" },
];

export default function ForgotPasswordWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 1 form ──
  const emailForm = useForm<SendOTPInput>({
    resolver: zodResolver(sendOTPSchema),
  });

  // ── Step 3 form ──
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // ── Step 1 submit ──
  const onSendOTP = async (formData: SendOTPInput) => {
    setServerError("");
    try {
      await sendOTP(formData.email, "forgot_password");
      setEmail(formData.email);
      setStep(2);
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Failed to send OTP. Try again."
      );
    }
  };

  // ── Step 2: OTP input handlers ──
  const inputRefs: (HTMLInputElement | null)[] = [];

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
  };

  const onVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setServerError("Please enter the complete 6-digit code.");
      return;
    }
    setServerError("");
    try {
      const response = await verifyOTP(email, otpString, "forgot_password");
      setVerifiedToken(response.verified_token);
      setStep(3);
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
    }
  };

  // ── Step 3 submit ──
  const onResetPassword = async (formData: ResetPasswordInput) => {
    setServerError("");
    try {
      await resetPassword(verifiedToken, formData.new_password);
      router.push("/login?reset=success");
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Failed to reset password. Try again."
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, index) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                  step > s.number
                    ? "bg-green-800 text-white"
                    : step === s.number
                    ? "bg-green-800 text-white ring-4 ring-green-100"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > s.number ? "✓" : s.number}
              </div>
              <span className={`mt-1 text-xs ${step >= s.number ? "text-green-800 font-medium" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition ${step > s.number ? "bg-green-800" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* ── Step 1: Email ── */}
      {step === 1 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Forgot your password?
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your email and we'll send you a reset code.
            </p>
          </div>
          <form onSubmit={emailForm.handleSubmit(onSendOTP)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                {...emailForm.register("email")}
                id="email"
                type="email"
                placeholder="you@uet.edu.pk"
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-red-600">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              className="w-full bg-green-800 hover:bg-green-900"
            >
              {emailForm.formState.isSubmitting ? "Sending..." : "Send reset code"}
            </Button>
          </form>
        </div>
      )}

      {/* ── Step 2: OTP ── */}
      {step === 2 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Enter reset code
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
          </div>
          <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                aria-label={`OTP digit ${index + 1} of 6`}
                className="w-11 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
              />
            ))}
          </div>
          <Button
            onClick={onVerifyOTP}
            className="w-full bg-green-800 hover:bg-green-900 mb-3"
          >
            Verify code
          </Button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            ← Wrong email? Go back
          </button>
        </div>
      )}

      {/* ── Step 3: New Password ── */}
      {step === 3 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Set new password
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a strong password for your account.
            </p>
          </div>
          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  {...resetForm.register("new_password")}
                  id="new_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {resetForm.formState.errors.new_password && (
                <p className="text-xs text-red-600">
                  {resetForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <div className="relative">
                <Input
                  {...resetForm.register("confirm_password")}
                  id="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {resetForm.formState.errors.confirm_password && (
                <p className="text-xs text-red-600">
                  {resetForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={resetForm.formState.isSubmitting}
              className="w-full bg-green-800 hover:bg-green-900"
            >
              {resetForm.formState.isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </div>
      )}

    </div>
  );
}