import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/ui";
import { VerifyOtpForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Enter the 6-digit code to verify your Zuri account.",
};

export default async function VerifyOtpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AuthLayout theme="light" backHref="/signup" backLabel="Back to sign up">
      <VerifyOtpForm id={id} />
    </AuthLayout>
  );
}
