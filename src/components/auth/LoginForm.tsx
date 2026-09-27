"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "@/hooks/useForm";
import { validateLogin } from "@/lib/validation/auth";

/** Only allow same-site relative redirects to avoid open-redirects. */
function safeRedirect(target: string | null): string {
  return target && target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard";
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { values, errors, formError, isSubmitting, handleChange, handleSubmit } = useForm({
    initialValues: { email: "", password: "" },
    validate: validateLogin,
    onSubmit: async (credentials) => {
      await login(credentials);
      router.replace(safeRedirect(searchParams.get("redirect")));
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {searchParams.has("expired") && !formError && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Your session has expired. Please sign in again.
        </p>
      )}
      <Alert message={formError} />
      <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} error={errors.email} />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
