import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-control border bg-surface-2/60 text-text placeholder:text-faint transition-colors " +
  "focus:border-brand/60 focus:bg-surface-2 focus-visible:outline-none disabled:opacity-60";

interface FieldWrapProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id: string;
  children: ReactNode;
}

export function Field({ label, hint, error, required, id, children }: FieldWrapProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-0.5 text-poor">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-poor">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, iconLeft, id: idProp, required, ...props },
  ref,
) {
  const genId = useId();
  const id = idProp ?? genId;
  const control = (
    <div className="relative">
      {iconLeft && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint [&>svg]:h-4 [&>svg]:w-4">
          {iconLeft}
        </span>
      )}
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          fieldBase,
          "h-10 px-3 text-sm",
          iconLeft && "pl-9",
          error && "border-poor/60",
          className,
        )}
        {...props}
      />
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {control}
    </Field>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, hint, error, id: idProp, required, ...props },
  ref,
) {
  const genId = useId();
  const id = idProp ?? genId;
  const control = (
    <textarea
      ref={ref}
      id={id}
      required={required}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      className={cn(fieldBase, "min-h-[7rem] resize-y px-3 py-2.5 text-sm leading-relaxed", error && "border-poor/60", className)}
      {...props}
    />
  );
  if (!label && !hint && !error) return control;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {control}
    </Field>
  );
});
