import LoginForm from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-green-800 tracking-tight">
            UNISON
          </span>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}