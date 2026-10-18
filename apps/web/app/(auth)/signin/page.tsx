import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/ui";
import { SignInForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to continue with Zuri.",
};

export default function SignInPage() {
  return (
    <AuthLayout theme="light" backLabel="Back to home">
      <SignInForm />
    </AuthLayout>
  );
}
