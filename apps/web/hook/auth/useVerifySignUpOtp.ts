import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useVerifySignUpOtp = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutateAsync: verifyOtpMutation, isPending } =
    trpc.auth.verifySignUpOtp.useMutation();

  const handleVerify = async (id: string, otp: string) => {
    if (otp.length < 6) return;
    setApiError(null);
    try {
      await verifyOtpMutation({ id, otp });

      router.push("/");
    } catch (error: any) {
      setApiError(error?.message || "Invalid verification code");
    }
  };

  return { handleVerify, isPending, apiError, setApiError };
};
