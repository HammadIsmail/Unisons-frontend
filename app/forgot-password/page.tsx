import ForgotPasswordWizard from "@/components/features/auth/ForgotPasswordWizard";
import { AuthShell } from "@/components/features/auth/AuthShell";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      heading="Reset your password"
      subheading="We'll send you a link to get back in"
      footer={
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordWizard />
    </AuthShell>
  );
}
