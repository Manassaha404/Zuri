"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useVerifySignUpOtp } from "@/hook/auth/useVerifySignUpOtp";
import { useResendOtp } from "@/hook/auth/useResendOtp";
import { useUserInfoStore } from "@/store/userInfoStore";
import { ZuriAvatar } from "@/components/ui/avatar-logo/ZuriAvatar";
import {
  AuthCard,
  SubmitButton,
  useAuthAvatar,
  ApiAlert,
} from "@/components/auth/ui";

function VerifyOtpAvatar() {
  const { animation, expression, isEffectiveError } = useAuthAvatar();

  return (
    <div
      className={`relative transition-transform duration-300 ${
        isEffectiveError ? "bot-shake" : ""
      }`}
    >
      <ZuriAvatar
        size={64}
        defaultAnimation="greet"
        animation={animation}
        expression={expression}
        ariaLabel="Zuri"
      />
    </div>
  );
}

export function VerifyOtpForm({ id }: { id: string }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(30);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const { email } = useUserInfoStore();
  const { handleVerify, isPending, apiError, setApiError } =
    useVerifySignUpOtp();
  const { handleResend, isResending } = useResendOtp();

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
    if (apiError) setApiError(null);

    const newDigits = [...digits];
    if (value.length > 1) {
      // Pasting multi-character string
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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasteData) return;
    const newDigits = [...digits];
    pasteData.split("").forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);
    const nextIdx = Math.min(pasteData.length, 5);
    inputsRef.current[nextIdx]?.focus();
  };

  async function handleResendClick() {
    if (countdown > 0 || isResending) return;
    await handleResend(id);
    setCountdown(30);
  }

  return (
    <AuthCard isVerifying={isPending} hasError={Boolean(apiError)}>
      <div className="self-center relative w-[88px] mb-1">
        <VerifyOtpAvatar />
        <svg
          width="36"
          height="26"
          viewBox="0 0 36 26"
          className="absolute right-0 -bottom-1"
        >
          <rect
            width="36"
            height="26"
            rx="4"
            fill="var(--bg)"
            stroke="var(--i)"
            strokeWidth="2"
          />
          <path
            d="m3 5 15 11L33 5"
            fill="none"
            stroke="var(--i)"
            strokeWidth="2"
          />
        </svg>
      </div>

      <h1>Verify your email</h1>
      <p>
        We sent a 6-digit code to{" "}
        <span className="font-medium text-[var(--i)]">
          {email || "your email"}
        </span>
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (otp.length === 6) {
            void handleVerify(id, otp);
          }
        }}
        className="flex flex-col gap-4 mt-2"
      >
        <div className="o">
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
              onPaste={handlePaste}
              inputMode="numeric"
            />
          ))}
        </div>

        <ApiAlert error={apiError} />

        <SubmitButton
          loading={isPending}
          disabled={otp.length !== 6}
          label="Verify"
          loadingLabel="Verifying..."
        />

        <div className="text-center text-sm text-[var(--m)]">
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

        <Link
          href="/signup"
          className="text-sm font-semibold text-[var(--i)] hover:underline text-center"
        >
          Change email
        </Link>
      </form>
    </AuthCard>
  );
}
