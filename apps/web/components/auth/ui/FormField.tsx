"use client";

import { useState, useEffect } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";
import { type LucideIcon } from "lucide-react";
import { useAuthAvatar } from "./AuthCard";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  icon?: LucideIcon;
  error?: string;
  successMessage?: string;
  registration: UseFormRegisterReturn;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  pattern?: string;
  className?: string;
  helperText?: string;
}

export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  autoFocus,
  icon: Icon,
  error,
  successMessage,
  registration,
  inputMode,
  maxLength,
  pattern,
  className = "",
  helperText,
}: FormFieldProps) {
  const { registerFieldError } = useAuthAvatar();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  useEffect(() => {
    registerFieldError?.(id, Boolean(error));
  }, [id, error, registerFieldError]);

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-left">
      <span>{label}</span>

      <span className="relative block w-full">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          inputMode={inputMode}
          maxLength={maxLength}
          pattern={pattern}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`in ${error ? "e" : successMessage ? "g" : ""} ${className}`}
          {...registration}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1.5 h-7 px-2 border-0 bg-transparent text-[var(--m)] hover:text-[var(--i)] text-xs font-medium cursor-pointer rounded"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </span>

      {error ? (
        <small id={`${id}-error`} className="er" role="alert">
          {error}
        </small>
      ) : successMessage ? (
        <small className="ok">{successMessage}</small>
      ) : helperText ? (
        <small className="text-[var(--m)]">{helperText}</small>
      ) : null}
    </label>
  );
}
