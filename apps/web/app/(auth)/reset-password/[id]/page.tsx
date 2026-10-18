import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/ui";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Enter your verification code and set a new password on Zuri.",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AuthLayout
      theme="dark"
      backHref="/forgot-password"
      backLabel="Back to forgot password"
    >
      <ResetPasswordForm id={id} />
    </AuthLayout>
  );
}
