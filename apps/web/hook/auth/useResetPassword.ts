import { useState } from "react";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";

export const useResetPassword = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const { mutateAsync: resetPasswordMutation, isPending: isSubmitting } =
    trpc.auth.resetPassword.useMutation();

  const handleResetPassword = async (data: {
    id: string;
    otp: string;
    newPassword: string;
  }) => {
    setApiError(null);
    setIsSuccess(false);
    try {
      await resetPasswordMutation(data);
      setIsSuccess(true);
      router.replace("/signin");
    } catch (error: any) {
      setApiError(
        error.message || "Failed to reset password. Please try again.",
      );
    }
  };

  return {
    handleResetPassword,
    apiError,
    isSubmitting,
    isSuccess,
    setApiError,
  };
};
