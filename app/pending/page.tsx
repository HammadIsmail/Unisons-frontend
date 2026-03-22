"use client";

import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";

export default function PendingPage() {
  const router = useRouter();
  const { account_status, profile, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const isRejected = account_status === "rejected";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">

        {/* Logo */}
        <div className="mb-6">
          <span className="text-2xl font-bold text-green-800 tracking-tight">
            UNISON
          </span>
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
          isRejected ? "bg-red-50" : "bg-amber-50"
        }`}>
          <span className="text-3xl">
            {isRejected ? "✗" : "⏳"}
          </span>
        </div>

        {/* Content */}
        {isRejected ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Account not approved
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Unfortunately your account registration was not approved.
              Please contact the university administration for more information.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Account under review
            </h1>
            <p className="text-sm text-gray-500 mb-2">
              Hi <span className="font-medium text-gray-700">
                {profile?.name ?? "there"}
              </span>, your account is pending admin approval.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You'll receive an email at{" "}
              <span className="font-medium text-gray-700">
                {profile?.email ?? "your email"}
              </span>{" "}
              once your account has been reviewed.
            </p>
          </>
        )}

        {/* Steps */}
        {!isRejected && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
            {[
              { done: true,  label: "Account created" },
              { done: true,  label: "Email verified" },
              { done: false, label: "Admin approval" },
              { done: false, label: "Access granted" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  item.done
                    ? "bg-green-800 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}>
                  {item.done ? "✓" : ""}
                </div>
                <span className={`text-sm ${item.done ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full"
        >
          Back to login
        </Button>

      </div>
    </main>
  );
}