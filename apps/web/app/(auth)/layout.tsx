import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s · Zuri",
    default: "Auth · Zuri",
  },
  description: "Sign in or create your Zuri account.",
};

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
