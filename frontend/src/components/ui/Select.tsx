import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field } from "./Input";
import { IconChevronDown } from "./icons";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, error, id: idProp, required, children, ...props },
  ref,
) {
  const genId = useId();
  const id = idProp ?? genId;
  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={!!error}
        className={cn(
          "h-10 w-full appearance-none rounded-control border bg-surface-2/60 px-3 pr-9 text-sm text-text transition-colors",
          "focus:border-brand/60 focus:bg-surface-2 focus-visible:outline-none disabled:opacity-60",
          error && "border-poor/60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {control}
    </Field>
  );
});
