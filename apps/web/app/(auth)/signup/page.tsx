import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/ui";
import { SignUpForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your account and start exploring with Zuri.",
};

export default function SignUpPage() {
  return (
    <AuthLayout theme="dark" backLabel="Back to home">
      <SignUpForm />
    </AuthLayout>
  );
}
