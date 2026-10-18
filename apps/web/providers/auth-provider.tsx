"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUserInfo, setInitialized, isInitialized } = useUserInfoStore();
  const { data, isLoading, isError } = trpc.auth.getMe.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;
    const publicRoutes = ["/signin", "/forgot-password"];
    const isPublicRoute =
      publicRoutes.includes(pathname) ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/reset-password/") ||
      pathname.startsWith("/legal");

    if (isError || !data?.users?.userId) {
      setInitialized(true);
      setUserInfo({
        userId: undefined,
        email: undefined,
        fullName: undefined,
        username: undefined,
        avatarUrl: null,
      });
      if (!isPublicRoute) {
        router.replace("/signin");
      }
      return;
    }
    if (data?.users?.userId) {
      const first = data.users.firstName ?? "";
      const last = data.users.lastName ?? "";
      const derivedFullName = `${first}`.trim() || data.users.username;

      setUserInfo({
        userId: data.users.userId,
        email: data.users.email,
        fullName: derivedFullName,
        username: data.users.username,
        avatarUrl: data?.users.avatarUrl,
      });
      setInitialized(true);

      const isAuthRoute =
        pathname === "/signin" || pathname.startsWith("/signup");

      if (isAuthRoute) {
        router.replace("/");
      }
    }
  }, [data, isLoading, isError, pathname, router, setInitialized, setUserInfo]);

  if (!isInitialized && isLoading) {
    return <></>;
  }
  return <>{children}</>;
}
