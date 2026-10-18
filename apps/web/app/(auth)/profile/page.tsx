import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/ui";
import { UpdateProfileForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Update your profile settings on Zuri.",
};

export default function ProfilePage() {
  return (
    <AuthLayout theme="light" backHref="/" backLabel="Back to chat">
      <UpdateProfileForm />
    </AuthLayout>
  );
}
