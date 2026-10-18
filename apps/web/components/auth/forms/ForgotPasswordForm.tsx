"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useForgotPassword } from "@/hook/auth/useForgotPassword";
import {
  AuthCard,
  AuthCardHeading,
  ApiAlert,
  FormField,
  SubmitButton,
} from "@/components/auth/ui";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const {
    handleForgotPassword,
    apiError,
    isSubmitting,
    isSuccess,
    setApiError,
  } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <AuthCard
      isVerifying={isSubmitting}
      hasError={Boolean(apiError || Object.keys(errors).length > 0)}
    >
      <AuthCardHeading
        title="Forgot your password?"
        description="Enter your email and we’ll send a reset code."
      />

      <form
        onSubmit={handleSubmit((data) => {
          setApiError(null);
          void handleForgotPassword(data);
        })}
        className="flex flex-col gap-4 text-left"
        noValidate
      >
        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email")}
        />

        <ApiAlert
          error={apiError}
          success={isSuccess ? "Reset code has been emailed to you." : null}
        />

        <SubmitButton
          loading={isSubmitting}
          label="Send reset code"
          loadingLabel="Sending..."
        />

        <div className="text-center mt-1">
          <Link
            href="/signin"
            className="text-sm font-semibold text-[var(--i)] hover:underline"
          >
            Back to log in
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
