import { useState } from "react";
import { trpc } from "@/trpc/client";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";

export const useForgotPassword = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const { mutateAsync: forgotPasswordMutation, isPending: isSubmitting } =
    trpc.auth.forgotPassword.useMutation();

  const handleForgotPassword = async (data: { email: string }) => {
    setApiError(null);
    setIsSuccess(false);
    try {
      const id = nanoid();
      await forgotPasswordMutation({ email: data.email, id });
      setIsSuccess(true);
      router.push(`/reset-password/${id}`);
    } catch (error: any) {
      setApiError(
        error.message || "Failed to send reset link. Please try again.",
      );
    }
  };

  return {
    handleForgotPassword,
    apiError,
    isSubmitting,
    isSuccess,
    setApiError,
  };
};
