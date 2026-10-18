import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/ui";
import { ChangeUsernameForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Pick Username",
  description: "Pick your unique handle and identity on Zuri.",
};

export default function UsernamePage() {
  return (
    <AuthLayout theme="light" backHref="/" backLabel="Back to chat">
      <ChangeUsernameForm />
    </AuthLayout>
  );
}
