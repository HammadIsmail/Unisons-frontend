import RegisterWizard from "@/components/features/auth/RegisterWizard";
import { AuthShell } from "@/components/features/auth/AuthShell";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <AuthShell
      heading="Create your account"
      subheading="Join the UNISON Alumni Network"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterWizard />
    </AuthShell>
  );
}
