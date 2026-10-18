"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateProfile } from "@/hook/auth/useUpdateProfile";
import {
  AuthCard,
  AuthCardHeading,
  ApiAlert,
  FormField,
  SubmitButton,
} from "@/components/auth/ui";

const schema = z.object({
  firstName: z
    .string()
    .min(1, "First name cannot be empty")
    .optional()
    .or(z.literal("")),
  lastName: z.string().optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function UpdateProfileForm() {
  const { handleUpdateProfile, apiError, isUpdatingProfile, setApiError } =
    useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <AuthCard
      isVerifying={isUpdatingProfile}
      hasError={Boolean(apiError || Object.keys(errors).length > 0)}
    >
      <AuthCardHeading
        title="Profile Settings"
        description="Update your personal details on Zuri."
      />

      <form
        onSubmit={handleSubmit((data) => {
          setApiError(null);
          const payload: Record<string, string> = {};
          if (data.firstName?.trim()) payload.firstName = data.firstName.trim();
          if (data.lastName?.trim()) payload.lastName = data.lastName.trim();
          if (data.username?.trim()) payload.username = data.username.trim();
          if (data.avatarUrl?.trim()) payload.avatarUrl = data.avatarUrl.trim();
          void handleUpdateProfile(payload);
        })}
        className="flex flex-col gap-4 text-left"
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
          id="avatarUrl"
          label="Avatar URL"
          placeholder="https://example.com/avatar.png"
          error={errors.avatarUrl?.message}
          registration={register("avatarUrl")}
        />

        <ApiAlert error={apiError} />

        <SubmitButton
          loading={isUpdatingProfile}
          label="Save changes"
          loadingLabel="Saving..."
        />
      </form>
    </AuthCard>
  );
}
