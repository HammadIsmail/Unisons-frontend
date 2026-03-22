import ForgotPasswordWizard from "@/components/features/auth/ForgotPasswordWizard";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-green-800 tracking-tight">
            UNISON
          </span>
        </div>

        <ForgotPasswordWizard />

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/login" className="text-green-700 font-medium hover:text-green-800">
            Sign in
          </Link>
        </p>

      </div>
    </main>
  );
}