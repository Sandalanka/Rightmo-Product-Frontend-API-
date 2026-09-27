"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "@/hooks/useForm";
import { validateRegister } from "@/lib/validation/auth";

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isNavigating, startTransition] = useTransition();

  const { values, errors, formError, isSubmitting, handleChange, handleSubmit } = useForm({
    initialValues: { name: "", email: "", password: "", password_confirmation: "" },
    validate: validateRegister,
    onSubmit: async (data) => {
      const user = await register(data);
      toast.success(`Account created. Welcome, ${user.name}!`);
      startTransition(() => router.replace("/dashboard"));
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Alert message={formError} />
      <Input label="Name" name="name" autoComplete="name" value={values.name} onChange={handleChange} error={errors.name} />
      <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} error={errors.email} />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
      />
      <Input
        label="Confirm password"
        name="password_confirmation"
        type="password"
        autoComplete="new-password"
        value={values.password_confirmation}
        onChange={handleChange}
        error={errors.password_confirmation}
      />
      <Button type="submit" isLoading={isSubmitting || isNavigating} className="w-full">
        Create account
      </Button>
    </form>
  );
}
