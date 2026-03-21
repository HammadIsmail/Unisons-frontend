"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerSchema, RegisterInput } from "@/schemas/auth.schemas";
import { registerUser } from "@/lib/api/auth.api";
import useRegistrationStore from "@/store/registrationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEGREES = ["BSCS", "BSIT", "BSSE", "BSEE", "BSME", "BSCE", "MBA", "MS", "PhD"];

export default function StepRegister() {
  const router = useRouter();
  const { email, verifiedToken, reset } = useRegistrationStore();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email },
  });

  const selectedRole = watch("role");

  const onSubmit = async (formData: RegisterInput) => {
    setServerError("");
    try {
      await registerUser({
        verified_token: verifiedToken,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        roll_number: formData.roll_number,
        degree: formData.degree,
        graduation_year: formData.graduation_year,
        semester: formData.semester,
      });
      reset();
      router.push("/pending");
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Create your account
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Fill in your details to complete registration.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input {...register("name")} id="name" placeholder="Ahmed Raza" />
          {errors.name && (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email (prefilled, readonly) */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            {...register("email")}
            id="email"
            type="email"
            readOnly
            className="bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              {...register("password")}
              id="password"
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
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <Label>I am a</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["alumni", "student"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setValue("role", r, { shouldValidate: true })}
                className={`py-2.5 px-4 rounded-lg border text-sm font-medium capitalize transition ${
                  selectedRole === r
                    ? "border-green-700 bg-green-50 text-green-800"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="text-xs text-red-600">{errors.role.message}</p>
          )}
        </div>

        {/* Roll Number */}
        <div className="space-y-1.5">
          <Label htmlFor="roll_number">Roll Number</Label>
          <Input
            {...register("roll_number")}
            id="roll_number"
            placeholder="UET-2020-CS-045"
          />
          {errors.roll_number && (
            <p className="text-xs text-red-600">{errors.roll_number.message}</p>
          )}
        </div>

        {/* Degree */}
        <div className="space-y-1.5">
          <Label>Degree</Label>
          <Select onValueChange={(val) => setValue("degree", val, { shouldValidate: true })}>
            <SelectTrigger>
              <SelectValue placeholder="Select your degree" />
            </SelectTrigger>
            <SelectContent>
              {DEGREES.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.degree && (
            <p className="text-xs text-red-600">{errors.degree.message}</p>
          )}
        </div>

        {/* Conditional: Alumni → Graduation Year */}
        {selectedRole === "alumni" && (
          <div className="space-y-1.5">
            <Label htmlFor="graduation_year">Graduation Year</Label>
            <Input
              {...register("graduation_year", { valueAsNumber: true })}
              id="graduation_year"
              type="number"
              placeholder="2020"
              min={1990}
              max={new Date().getFullYear()}
            />
            {errors.graduation_year && (
              <p className="text-xs text-red-600">{errors.graduation_year.message}</p>
            )}
          </div>
        )}

        {/* Conditional: Student → Semester */}
        {selectedRole === "student" && (
          <div className="space-y-1.5">
            <Label>Current Semester</Label>
            <Select onValueChange={(val) => setValue("semester", parseInt(val), { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.semester && (
              <p className="text-xs text-red-600">{errors.semester.message}</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-800 hover:bg-green-900"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

      </form>
    </div>
  );
}