"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema, LoginInput } from "@/schemas/auth.schemas";
import { loginUser } from "@/lib/api/auth.api";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff, Lock, User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginInput) => {
    setServerError("");
    try {
      const response = await loginUser(formData.email, formData.password);
      setAuth(
        response.token,
        response.role,
        response.account_status,
        response.profile
      );

      if (response.account_status === "pending") {
        router.push("/pending");
      } else {
        router.push("/feed");
      }
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground ml-1">
            Email or Username
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#0a66c2] transition-colors">
              <User className="h-4 w-4" />
            </div>
            <Input
              {...register("email")}
              id="email"
              placeholder="Enter your email or username"
              autoComplete="username"
              className={`h-11 pl-10 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                errors.email ? "border-red-400 focus-visible:ring-red-500/10" : ""
              }`}
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[11px] font-medium text-red-600 flex items-center gap-1.5 ml-1"
            >
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#0a66c2] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#0a66c2] transition-colors">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`h-11 pl-10 pr-10 bg-muted/30 border-border/60 focus-visible:ring-[#0a66c2]/20 focus-visible:border-[#0a66c2] rounded-xl transition-all ${
                errors.password ? "border-red-400 focus-visible:ring-red-500/10" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[11px] font-medium text-red-600 flex items-center gap-1.5 ml-1"
            >
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </motion.p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-blue-500/10"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
