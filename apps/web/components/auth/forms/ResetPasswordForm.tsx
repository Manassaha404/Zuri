"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useResetPassword } from "@/hook/auth/useResetPassword";
import { useResendOtp } from "@/hook/auth/useResendOtp";
import {
  AuthCard,
  AuthCardHeading,
  ApiAlert,
  FormField,
  SubmitButton,
} from "@/components/auth/ui";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm({ id }: { id: string }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(30);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const { handleResetPassword, apiError, isSubmitting, setApiError } =
    useResetPassword();
  const { handleResend, isResending } = useResendOtp();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const newPassword = watch("newPassword") || "";
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const otp = digits.join("");

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputsRef.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  async function handleResendClick() {
    if (countdown > 0 || isResending) return;
    await handleResend(id);
    setCountdown(30);
  }

  return (
    <AuthCard
      isVerifying={isSubmitting}
      hasError={Boolean(apiError || Object.keys(errors).length > 0)}
    >
      <AuthCardHeading
        title="Reset password"
        description="Enter the code we emailed you."
      />

      <form
        onSubmit={handleSubmit((data) => {
          if (otp.length !== 6) {
            setApiError("Please enter the complete 6-digit code.");
            return;
          }
          setApiError(null);
          void handleResetPassword({
            id,
            otp,
            newPassword: data.newPassword,
          });
        })}
        className="flex flex-col gap-4 text-left"
        noValidate
      >
        <div className="o my-1">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              className="in"
              maxLength={1}
              value={digit}
              aria-label={`Digit ${index + 1}`}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputMode="numeric"
            />
          ))}
        </div>

        <FormField
          id="newPassword"
          label="New password"
          type="password"
          placeholder="••••••••••"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          registration={register("newPassword")}
        />

        <FormField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          placeholder="••••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

        <div className="flex flex-col gap-1 text-xs">
          <span className={hasMinLength ? "ok" : "text-[var(--m)]"}>
            {hasMinLength ? "✓" : "○"} At least 8 characters
          </span>
          <span className={hasNumber ? "ok" : "text-[var(--m)]"}>
            {hasNumber ? "✓" : "○"} One number
          </span>
          <span className={hasSymbol ? "ok" : "text-[var(--m)]"}>
            {hasSymbol ? "✓" : "○"} One symbol
          </span>
        </div>

        <ApiAlert error={apiError} />

        <SubmitButton
          loading={isSubmitting}
          disabled={otp.length !== 6}
          label="Reset password"
          loadingLabel="Resetting..."
        />

        <div className="text-center text-sm text-[var(--m)] mt-1">
          {countdown > 0 ? (
            <span>
              Resend code in 00:{countdown < 10 ? `0${countdown}` : countdown}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isResending}
              className="font-medium text-[var(--i)] hover:underline"
            >
              {isResending ? "Sending..." : "Resend code"}
            </button>
          )}
        </div>
      </form>
    </AuthCard>
  );
}
