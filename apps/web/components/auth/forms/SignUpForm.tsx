"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSignup } from "@/hook/auth/useSignup";
import {
  AuthCard,
  AuthCardHeading,
  ApiAlert,
  AuthDivider,
  FormField,
  GoogleButton,
  SubmitButton,
} from "@/components/auth/ui";

const schema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function SignUpForm() {
  const { handleSignup, apiError, apiSuccess, isSigningUp, setApiError } =
    useSignup();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const emailValue = watch("email");
  const isEmailValid = emailValue && !errors.email && emailValue.includes("@");

  return (
    <AuthCard
      isVerifying={isSigningUp}
      hasError={Boolean(apiError || Object.keys(errors).length > 0)}
    >
      <AuthCardHeading
        title="Create your account"
        description="Start exploring with Zuri."
      />

      <form
        onSubmit={handleSubmit((data) => {
          setApiError(null);
          void handleSignup({
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            email: data.email,
            password: data.password,
          });
        })}
        className="flex flex-col gap-3.5 text-left"
        noValidate
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="firstName"
            label="First name"
            placeholder="Jane"
            autoComplete="given-name"
            error={errors.firstName?.message}
            registration={register("firstName")}
          />
          <FormField
            id="lastName"
            label="Last name"
            placeholder="Doe"
            autoComplete="family-name"
            error={errors.lastName?.message}
            registration={register("lastName")}
          />
        </div>

        <FormField
          id="username"
          label="Username"
          placeholder="jane_doe"
          autoComplete="username"
          error={errors.username?.message}
          registration={register("username")}
        />

        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          error={errors.email?.message}
          successMessage={isEmailValid ? "✓ Looks good" : undefined}
          registration={register("email")}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="••••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

        <ApiAlert error={apiError} success={apiSuccess} />

        <SubmitButton
          loading={isSigningUp}
          label="Create account"
          loadingLabel="Creating account..."
          className="mt-1 btn-create-account"
        />

        <AuthDivider label="or" />

        <GoogleButton
          onClick={() => setApiError("Google sign-up is coming soon.")}
        />

        <p className="text-center text-sm text-[var(--m)] mt-2">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-[var(--i)] hover:underline"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
