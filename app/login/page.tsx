import LoginForm from "@/components/features/auth/LoginForm";
import { AuthShell } from "@/components/features/auth/AuthShell";
import Link from "next/link";

export default function LoginPage() {
  return (
    <AuthShell
      heading="Welcome back"
      subheading="Sign in to your UNISON account"
      footer={
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
          >
            Create one
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
