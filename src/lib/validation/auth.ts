import type { LoginCredentials, RegisterData } from "@/types/auth";

/** Client-side checks that mirror the Laravel LoginRequest / RegisterRequest rules. */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values: LoginCredentials): FormErrors<LoginCredentials> {
  const errors: FormErrors<LoginCredentials> = {};
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(values.email)) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Password is required.";
  return errors;
}

export function validateRegister(values: RegisterData): FormErrors<RegisterData> {
  const errors: FormErrors<RegisterData> = {};

  if (!values.name.trim()) errors.name = "Name is required.";
  else if (values.name.length > 255) errors.name = "Name may not be longer than 255 characters.";

  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(values.email)) errors.email = "Enter a valid email address.";

  const pw = values.password;
  if (!pw) errors.password = "Password is required.";
  else if (pw.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw) || !/[@$!%*#?&]/.test(pw))
    errors.password = "Password must contain uppercase, lowercase, number, and symbol.";

  if (values.password_confirmation !== pw)
    errors.password_confirmation = "Password confirmation does not match.";

  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
