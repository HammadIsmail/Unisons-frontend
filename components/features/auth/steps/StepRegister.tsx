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
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { StudentCardUpload } from "@/components/layout/StudentCardUpload";
import { motion, AnimatePresence } from "framer-motion";

const DEGREES = ["BSCS", "BSIT", "BSSE", "BSEE", "BSME", "BSCE", "MBA", "MS", "PhD"];

export default function StepRegister() {
  const router = useRouter();
  const { email, verifiedToken, reset, setStep } = useRegistrationStore();
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
    trigger,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email },
    mode: "onChange",
  });

  const selectedRole = watch("role");

  const onSubmit = async (formData: RegisterInput) => {
    setServerError("");
    setStudentCardError("");
    
    const isValid = await trigger();
    if (!isValid) return;
    
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
        batch: formData.batch,
        degree: formData.degree,
        graduation_year: formData.graduation_year,
        semester: formData.semester,
        student_card: studentCardFile,
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30">
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Email Verified</h3>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            Step 3 of 3: Complete your profile to join the community.
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Role Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-[#0a66c2]" />
            I am a
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {(["student", "alumni"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setValue("role", r, { shouldValidate: true })}
                className={`
                  flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200
                  ${selectedRole === r
                    ? "border-[#0a66c2] bg-blue-50/50 text-[#0a66c2] ring-4 ring-blue-500/5 shadow-sm"
                    : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                  }
                `}
              >
                {r === "alumni" ? <GraduationCap className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                <span className="text-sm font-bold capitalize">{r}</span>
              </button>
            ))}
          </div>
          {errors.role && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.role.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
              <UserCircle2 className="h-3.5 w-3.5 text-[#0a66c2]" />
              Full Name
            </Label>
            <Input
              {...register("display_name")}
              id="display_name"
              placeholder="e.g. Hammad Ismail"
              className={`h-11 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                errors.display_name ? "border-red-400" : ""
              }`}
            />
            {errors.display_name && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.display_name.message}</p>}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
              <AtSign className="h-3.5 w-3.5 text-[#0a66c2]" />
              Username
            </Label>
            <Input
              {...register("username")}
              id="username"
              placeholder="hammad_dev"
              className={`h-11 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                errors.username ? "border-red-400" : ""
              }`}
            />
            {errors.username && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.username.message}</p>}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[#0a66c2]" />
            Password
          </Label>
          <div className="relative group">
            <Input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className={`h-11 pr-10 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                errors.password ? "border-red-400" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.password.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Roll Number */}
          <div className="space-y-2">
            <Label htmlFor="roll_number" className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-[#0a66c2]" />
              Roll Number
            </Label>
            <Input
              {...register("roll_number")}
              id="roll_number"
              placeholder="e.g. 2020-CS-45"
              className={`h-11 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                errors.roll_number ? "border-red-400" : ""
              }`}
            />
            {errors.roll_number && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.roll_number.message}</p>}
          </div>

          {/* Batch */}
          <div className="space-y-2">
            <Label htmlFor="batch" className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-[#0a66c2]" />
              Batch
            </Label>
            <Input
              {...register("batch")}
              id="batch"
              type="text"
              placeholder="e.g. Fall 2020 or 2020"
              className={`h-11 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                errors.batch ? "border-red-400" : ""
              }`}
            />
            {errors.batch && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.batch.message}</p>}
          </div>

          {/* Degree */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-[#0a66c2]" />
              Degree
            </Label>
            <Select onValueChange={(v) => setValue("degree", v, { shouldValidate: true })}>
              <SelectTrigger className={`h-11 bg-muted/30 border-border/60 rounded-xl ${errors.degree ? "border-red-400" : ""}`}>
                <SelectValue placeholder="Select Degree" />
              </SelectTrigger>
              <SelectContent>
                {DEGREES.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.degree && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.degree.message}</p>}
          </div>
        </div>

        {/* Role Specific Fields */}
        <AnimatePresence mode="wait">
          {selectedRole === "alumni" && (
            <motion.div
              key="alumni-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <Label htmlFor="graduation_year" className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-[#0a66c2]" />
                Graduation Year
              </Label>
              <Input
                {...register("graduation_year", { valueAsNumber: true })}
                id="graduation_year"
                type="number"
                placeholder="e.g. 2024"
                className={`h-11 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                  errors.graduation_year ? "border-red-400" : ""
                }`}
              />
              {errors.graduation_year && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.graduation_year.message}</p>}
            </motion.div>
          )}

          {selectedRole === "student" && (
            <motion.div
              key="student-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <Label className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-[#0a66c2]" />
                Current Semester
              </Label>
              <Select onValueChange={(v) => setValue("semester", parseInt(v), { shouldValidate: true })}>
                <SelectTrigger className={`h-11 bg-muted/30 border-border/60 rounded-xl ${errors.semester ? "border-red-400" : ""}`}>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.semester && <p className="text-[11px] text-red-600 ml-1 font-medium">{errors.semester.message}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <StudentCardUpload
          file={studentCardFile}
          error={studentCardError}
          onFileChange={(file) => { setStudentCardFile(file); setStudentCardError(""); }}
          onRemove={() => setStudentCardFile(null)}
        />

        <div className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-blue-500/10"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Complete Registration"
            )}
          </Button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go back to OTP
          </button>
        </div>
      </form>
    </motion.div>
  );
}