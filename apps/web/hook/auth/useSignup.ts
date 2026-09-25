import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { nanoid } from "nanoid";

export const useSignup = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const { mutateAsync: signupMutation, isPending: isSigningUp } =
    trpc.auth.registerUserWithEmailandPass.useMutation();
  const { setUserInfo } = useUserInfoStore();

  const handleSignup = async (data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
  }) => {
    setApiError(null);
    setApiSuccess(null);
    try {
      const id = nanoid();
      await signupMutation({
        ...data,
        id,
      });
      setUserInfo({
        email: data.email,
        fullName: `${data.firstName} ${data.lastName}`,
        username: data.username,
      });
      setApiSuccess("Account created successfully! Redirecting...");
      router.replace(`/signup/verify/${id}`);
    } catch (error: any) {
      setApiError(
        error.message || "Failed to create account. Please try again later.",
      );
    }
  };

  return {
    handleSignup,
    apiError,
    apiSuccess,
    isSigningUp,
    setApiError,
    setApiSuccess,
  };
};
