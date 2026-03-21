"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, LoginInput } from "@/schemas/auth.schemas";
import { loginUser } from "@/lib/api/auth.api";
import useAuthStore from "@/store/authStore";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

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
        return;
      }

      if (response.account_status === "rejected") {
        router.push("/pending");
        return;
      }

      if (response.role === "admin") {
        router.push("/admin");
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid email or password";
      setServerError(message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Welcome back
        </h1>
        <p className="text-gray-500 text-sm">
          Sign in to your UNISON account
        </p>
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@uet.edu.pk"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition placeholder:text-gray-400"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-green-700 hover:text-green-800"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition placeholder:text-gray-400 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-green-800 hover:bg-green-900 disabled:bg-green-300 text-white text-sm font-medium rounded-lg transition"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-green-700 font-medium hover:text-green-800">
          Create one
        </Link>
      </p>

    </div>
  );
}