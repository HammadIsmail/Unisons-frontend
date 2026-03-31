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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  UserCircle2,
  AtSign,
  Mail,
  Lock,
  GraduationCap,
  Hash,
  BookOpen,
  Users,
  CalendarDays,
  Layers,
  IdCard,
} from "lucide-react";
import { StudentCardUpload } from "@/components/layout/StudentCardUpload";

const DEGREES = ["BSCS", "BSIT", "BSSE", "BSEE", "BSME", "BSCE", "MBA", "MS", "PhD"];

// ── Reusable field components ─────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground/70 mt-1">{children}</p>;
}

function FieldLabel({ icon, children, htmlFor }: { icon: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      <span className="text-muted-foreground/60">{icon}</span>
      {children}
    </Label>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function StepRegister() {
  const router = useRouter();
  const { email, verifiedToken, reset } = useRegistrationStore();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const [studentCardError, setStudentCardError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    trigger, // Add this to manually trigger validation
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email },
    mode: "onChange", // Add this to validate on change
  });

  const selectedRole = watch("role");

  const onSubmit = async (formData: RegisterInput) => {
    // Clear previous errors
    setServerError("");
    setStudentCardError("");
    
    // Manually trigger form validation first
    const isValid = await trigger();
    
    if (!isValid) {
      console.log("Form validation failed:", errors);
      return;
    }
    
    // Check student card after form validation
    if (!studentCardFile) {
      setStudentCardError("Please upload your student or alumni card.");
      return;
    }
    
    try {
      await registerUser({
        verified_token: verifiedToken,
        username: formData.username,
        display_name: formData.display_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        roll_number: formData.roll_number,
        degree: formData.degree,
        graduation_year: formData.graduation_year,
        semester: formData.semester,
        student_card: studentCardFile,
      });
      reset();
      router.push("/pending");
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Check if it's a validation error from the API
      if (error.response?.data?.errors) {
        // Handle field-specific errors from API
        const apiErrors = error.response.data.errors;
        Object.keys(apiErrors).forEach((field) => {
          // You might want to set these errors in react-hook-form
          console.log(`${field}: ${apiErrors[field]}`);
        });
        setServerError(apiErrors.message || "Please check your input and try again.");
      } else {
        setServerError(
          error.response?.data?.message || "Registration failed. Please try again."
        );
      }
    }
  };

  // Helper to handle degree selection with validation
  const handleDegreeChange = (value: string) => {
    setValue("degree", value, { shouldValidate: true });
  };

  // Helper to handle semester selection with validation
  const handleSemesterChange = (value: string) => {
    setValue("semester", parseInt(value), { shouldValidate: true });
  };

  return (
    <div className="space-y-5">

      {/* Step header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20 flex-shrink-0">
          <UserCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Create your account</p>
          <p className="text-xs text-muted-foreground">Fill in your details to complete registration.</p>
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

        {/* ── Role selector — first so it shapes the rest ── */}
        <div className="space-y-2">
          <FieldLabel icon={<Users className="h-3.5 w-3.5" />}>I am a</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            {(["alumni", "student"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setValue("role", r, { shouldValidate: true })}
                className={`
                  flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold capitalize transition-all duration-150
                  ${selectedRole === r
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-background"
                  }
                `}
              >
                {r === "alumni"
                  ? <GraduationCap className="h-4 w-4" />
                  : <BookOpen className="h-4 w-4" />
                }
                {r}
              </button>
            ))}
          </div>
          <FieldError message={errors.role?.message} />
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* ── Display Name ── */}
        <div className="space-y-1.5">
          <FieldLabel icon={<UserCircle2 className="h-3.5 w-3.5" />} htmlFor="display_name">
            Display Name
          </FieldLabel>
          <Input
            {...register("display_name")}
            id="display_name"
            placeholder="Ahmed The Dev"
            className={`h-10 text-sm ${errors.display_name ? "border-rose-400 focus-visible:ring-rose-500/20" : ""}`}
          />
          <FieldHint>This is how your name appears across the platform.</FieldHint>
          <FieldError message={errors.display_name?.message} />
        </div>

        {/* ── Username ── */}
        <div className="space-y-1.5">
          <FieldLabel icon={<AtSign className="h-3.5 w-3.5" />} htmlFor="username">
            Username
          </FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm select-none">@</span>
            <Input
              {...register("username")}
              id="username"
              placeholder="ahmed_h"
              className={`h-10 text-sm pl-7 ${errors.username ? "border-rose-400 focus-visible:ring-rose-500/20" : ""}`}
            />
          </div>
          <FieldHint>Lowercase letters, numbers, and underscores only.</FieldHint>
          <FieldError message={errors.username?.message} />
        </div>

        {/* ── Email (read-only) ── */}
        <div className="space-y-1.5">
          <FieldLabel icon={<Mail className="h-3.5 w-3.5" />} htmlFor="email">
            Email
          </FieldLabel>
          <Input
            {...register("email")}
            id="email"
            type="email"
            readOnly
            className="h-10 text-sm bg-muted/50 text-muted-foreground cursor-not-allowed border-border/40"
          />
        </div>

        {/* ── Password ── */}
        <div className="space-y-1.5">
          <FieldLabel icon={<Lock className="h-3.5 w-3.5" />} htmlFor="password">
            Password
          </FieldLabel>
          <div className="relative">
            <Input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 chars, uppercase, number, special"
              className={`h-10 text-sm pr-10 ${errors.password ? "border-rose-400 focus-visible:ring-rose-500/20" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        {/* ── Roll Number ── */}
        <div className="space-y-1.5">
          <FieldLabel icon={<Hash className="h-3.5 w-3.5" />} htmlFor="roll_number">
            Roll Number
          </FieldLabel>
          <Input
            {...register("roll_number")}
            id="roll_number"
            placeholder="UET-2020-CS-045"
            className={`h-10 text-sm ${errors.roll_number ? "border-rose-400 focus-visible:ring-rose-500/20" : ""}`}
          />
          <FieldError message={errors.roll_number?.message} />
        </div>

        {/* ── Degree ── */}
        <div className="space-y-1.5">
          <FieldLabel icon={<GraduationCap className="h-3.5 w-3.5" />}>Degree</FieldLabel>
          <Select onValueChange={handleDegreeChange}>
            <SelectTrigger className={`h-10 text-sm ${errors.degree ? "border-rose-400" : "border-border/60"}`}>
              <SelectValue placeholder="Select your degree" />
            </SelectTrigger>
            <SelectContent>
              {DEGREES.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.degree?.message} />
        </div>

        {/* ── Conditional fields ── */}
        {selectedRole === "alumni" && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <FieldLabel icon={<CalendarDays className="h-3.5 w-3.5" />} htmlFor="graduation_year">
              Graduation Year
            </FieldLabel>
            <Input
              {...register("graduation_year", { valueAsNumber: true })}
              id="graduation_year"
              type="number"
              placeholder="2020"
              min={1990}
              max={new Date().getFullYear()}
              className={`h-10 text-sm ${errors.graduation_year ? "border-rose-400 focus-visible:ring-rose-500/20" : ""}`}
            />
            <FieldError message={errors.graduation_year?.message} />
          </div>
        )}

        {selectedRole === "student" && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <FieldLabel icon={<Layers className="h-3.5 w-3.5" />}>Current Semester</FieldLabel>
            <Select onValueChange={handleSemesterChange}>
              <SelectTrigger className={`h-10 text-sm ${errors.semester ? "border-rose-400" : "border-border/60"}`}>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.semester?.message} />
          </div>
        )}
        <StudentCardUpload
          file={studentCardFile}
          error={studentCardError}
          onFileChange={(file) => { setStudentCardFile(file); setStudentCardError(""); }}
          onRemove={() => setStudentCardFile(null)}
        />
        {/* ── Submit ── */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/20 gap-2 mt-2"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
          ) : "Create account"}
        </Button>

      </form>
    </div>
  );
}