import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/ui";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Enter your email and we'll send a reset code for your Zuri account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout theme="light" backHref="/signin" backLabel="Back to log in">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
