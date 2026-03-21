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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      setServerError(
        error.response?.data?.message || "Failed to send OTP. Try again."
      );
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Verify your email
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          We'll send a 6-digit code to confirm your email address.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">University Email</Label>
          <Input
            {...register("email")}
            id="email"
            type="email"
            placeholder="you@uet.edu.pk"
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-800 hover:bg-green-900"
        >
          {isSubmitting ? "Sending code..." : "Send verification code"}
        </Button>
      </form>
    </div>
  );
}