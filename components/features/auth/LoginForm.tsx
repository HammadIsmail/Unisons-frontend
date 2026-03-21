"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, LoginInput } from "@/schemas/auth.schemas";
import { loginUser } from "@/lib/api/auth.api";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

            if (response.account_status === "pending" || response.account_status === "rejected") {
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
                <Alert variant="destructive" className="mb-5">
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* Email */}
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
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

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-green-700 hover:text-green-800"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            {...register("password")}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
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

                {/* Submit */}
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-800 hover:bg-green-900"
                >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>

            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="text-green-700 font-medium hover:text-green-800"
                >
                    Create one
                </Link>
            </p>

        </div>
    );
}