"use client";

import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import { toApiError } from "@/lib/api";

type Errors<T> = Partial<Record<keyof T, string>>;

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Errors<T>;
  onSubmit: (values: T) => Promise<void>;
}

/**
 * Reusable form state: values, client validation, submit state and
 * mapping of Laravel 422 field errors back onto the matching inputs.
 */
export function useForm<T extends Record<string, string>>({ initialValues, validate, onSubmit }: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name as keyof T] ? { ...prev, [name]: undefined } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);

      const clientErrors = validate?.(values) ?? {};
      setErrors(clientErrors);
      if (Object.keys(clientErrors).length > 0) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (err) {
        const apiError = toApiError(err);
        if (apiError.isValidationError) {
          const mapped: Errors<T> = {};
          for (const key of Object.keys(apiError.fieldErrors)) {
            if (key in values) mapped[key as keyof T] = apiError.fieldError(key);
          }
          setErrors(mapped);
        }
        setFormError(apiError.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit],
  );

  return { values, errors, formError, isSubmitting, handleChange, handleSubmit };
}
