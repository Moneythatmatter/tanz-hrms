import { Suspense } from "react";
import { LoginPageClient } from "@/components/auth/LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#071018] text-sm text-slate-300">
          Loading…
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
