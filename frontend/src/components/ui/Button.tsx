import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-fg hover:bg-brand-hover shadow-[0_8px_24px_-10px_rgb(var(--brand)/0.7)] disabled:shadow-none",
  secondary:
    "bg-surface-2 text-text border border-line/60 hover:border-line hover:bg-surface-2/70",
  ghost: "text-muted hover:text-text hover:bg-surface-2/60",
  danger: "bg-poor/15 text-poor border border-poor/30 hover:bg-poor/25",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[0.5rem]",
  md: "h-10 px-4 text-sm gap-2 rounded-control",
  lg: "h-12 px-5 text-[0.95rem] gap-2 rounded-control",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, iconLeft, iconRight, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 ease-emphasized",
        "disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.985]",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});
