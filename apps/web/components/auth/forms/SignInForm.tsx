"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useLogin } from "@/hook/auth/useLogin";
import {
  AuthCard,
  AuthCardHeading,
  ApiAlert,
  AuthDivider,
  FormField,
  GoogleButton,
  SubmitButton,
} from "@/components/auth/ui";

const schema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function SignInForm({
  onGoogleLogin,
}: { onGoogleLogin?: () => void } = {}) {
  const { handleLogin, apiError, isLoggingIn, setApiError } = useLogin();

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/trpc", "") || "";
    window.location.href = `${apiUrl}/auth/google`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <AuthCard
      isVerifying={isLoggingIn}
      hasError={Boolean(apiError || Object.keys(errors).length > 0)}
    >
      <AuthCardHeading
        title="Welcome back"
        description="Log in to continue with Zuri."
      />

      <form
        onSubmit={handleSubmit((data) => {
          setApiError(null);
          void handleLogin(data);
        })}
        className="flex flex-col gap-4 text-left"
        noValidate
      >
        <FormField
          id="emailOrUsername"
          label="Email or username"
          type="text"
          placeholder="you@email.com"
          autoComplete="username"
          error={errors.emailOrUsername?.message}
          registration={register("emailOrUsername")}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-[13px] text-[var(--i)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <ApiAlert error={apiError} />

        <SubmitButton
          loading={isLoggingIn}
          label="Log in"
          loadingLabel="Logging in..."
          className="btn-signin btn-login"
        />

        <AuthDivider label="or" />

        <GoogleButton onClick={onGoogleLogin ?? handleGoogleLogin} />

        <p className="text-center text-sm text-[var(--m)] mt-2">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[var(--i)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
