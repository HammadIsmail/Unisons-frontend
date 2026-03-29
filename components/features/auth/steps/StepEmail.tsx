"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { sendOTPSchema, SendOTPInput } from "@/schemas/auth.schemas";
import { sendOTP } from "@/lib/api/auth.api";
import useRegistrationStore from "@/store/registrationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Mail } from "lucide-react";

export default function StepEmail() {
  const { setEmail, setStep, setOtpType } = useRegistrationStore();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SendOTPInput>({
    resolver: zodResolver(sendOTPSchema),
  });

  const onSubmit = async (formData: SendOTPInput) => {
    setServerError("");
    try {
      setOtpType("email_verification");
      await sendOTP(formData.email, "email_verification");
      setEmail(formData.email);
      setStep(2);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Failed to send OTP. Try again.");
    }
  };

  return (
    <div className="space-y-5">

      {/* Step header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 flex-shrink-0">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Verify your email</p>
          <p className="text-xs text-muted-foreground">
            We'll send a 6-digit code to your university email.
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            University Email
          </Label>
          <Input
            {...register("email")}
            id="email"
            type="email"
            placeholder="you@uet.edu.pk"
            className={`h-10 text-sm ${errors.email ? "border-rose-400 focus-visible:ring-rose-500/20" : ""}`}
          />
          {errors.email && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/20 gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending code…</>
          ) : "Send verification code"}
        </Button>
      </form>
    </div>
  );
}
