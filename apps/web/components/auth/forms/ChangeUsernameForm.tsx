"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useChangeUsername } from "@/hook/auth/useChangeUsername";
import { useUserInfoStore } from "@/store/userInfoStore";
import {
  AuthCard,
  AuthCardHeading,
  ApiAlert,
  SubmitButton,
} from "@/components/auth/ui";

const schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username cannot exceed 32 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
});

type FormValues = z.infer<typeof schema>;

export function ChangeUsernameForm() {
  const { handleChangeUsername, apiError, isChangingUsername, setApiError } =
    useChangeUsername();
  const { username, fullName } = useUserInfoStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: username || "",
    },
  });

  useEffect(() => {
    if (username) {
      reset({ username });
    }
  }, [username, reset]);

  const currentVal = watch("username");
  const isValid = currentVal && currentVal.length >= 3 && !errors.username;

  const initials = (fullName || username || "AL").slice(0, 2).toUpperCase();

  return (
    <AuthCard
      isVerifying={isChangingUsername}
      hasError={Boolean(apiError || Object.keys(errors).length > 0)}
    >
      <span className="self-center w-[72px] h-[72px] rounded-full bg-[#8b5cf6] text-[#111] grid place-items-center font-semibold text-[22px]">
        {initials}
      </span>

      <AuthCardHeading
        icon={<></>}
        title="Pick your username"
        description="This is how others will see you on Zuri."
      />

      <form
        onSubmit={handleSubmit((data) => {
          setApiError(null);
          void handleChangeUsername(data.username);
        })}
        className="flex flex-col gap-4 text-left"
        noValidate
      >
        <label className="flex flex-col gap-1.5 text-left">
          <span>Username</span>
          <span className="relative block w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m)] select-none pointer-events-none text-[15px] font-medium leading-none">
              @
            </span>
            <input
              className={`in in-prefix !pl-[34px] ${errors.username ? "e" : isValid ? "g" : ""}`}
              style={{ paddingLeft: "34px" }}
              placeholder="alex"
              autoComplete="username"
              autoFocus
              {...register("username")}
            />
          </span>
          {errors.username ? (
            <small className="er">{errors.username.message}</small>
          ) : isValid ? (
            <small className="ok">✓ @{currentVal} is available</small>
          ) : null}
        </label>

        <ApiAlert error={apiError} />

        <SubmitButton
          loading={isChangingUsername}
          label="Continue"
          loadingLabel="Saving..."
        />
      </form>
    </AuthCard>
  );
}
