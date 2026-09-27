import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const control = (error?: string) =>
  `block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:ring-2 ${
    error ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-brand-500 focus:ring-brand-200"
  }`;

function FieldShell({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function Textarea({ label, error, hint, id, className = "", ...props }: TextareaProps) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint}>
      <textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`${control(error)} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  placeholder?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, error, placeholder, options, id, className = "", ...props }: SelectProps) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  return (
    <FieldShell id={fieldId} label={label} error={error}>
      <select
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`${control(error)} bg-white ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
