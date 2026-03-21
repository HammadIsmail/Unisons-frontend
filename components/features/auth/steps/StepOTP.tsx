"use client";

import { useState, useRef } from "react";
import { verifyOTP, sendOTP } from "@/lib/api/auth.api";
import useRegistrationStore from "@/store/registrationStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
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
    pasted.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setServerError("Please enter the complete 6-digit code.");
      return;
    }
    setIsVerifying(true);
    setServerError("");
    try {
      const response = await verifyOTP(email, otpString, otpType);
      setVerifiedToken(response.verified_token);
      setStep(3);
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
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
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Failed to resend. Try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Enter verification code
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-gray-700">{email}</span>
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {resendMessage && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{resendMessage}</AlertDescription>
        </Alert>
      )}

      {/* OTP Boxes */}
      <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
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
            className="w-11 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        disabled={isVerifying}
        className="w-full bg-green-800 hover:bg-green-900 mb-4"
      >
        {isVerifying ? "Verifying..." : "Verify code"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-green-700 font-medium hover:text-green-800 disabled:opacity-50"
        >
          {isResending ? "Resending..." : "Resend"}
        </button>
      </p>

      <button
        type="button"
        onClick={() => setStep(1)}
        className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
      >
        ← Wrong email? Go back
      </button>
    </div>
  );
}