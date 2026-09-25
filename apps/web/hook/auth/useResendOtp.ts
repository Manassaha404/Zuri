import { trpc } from "@/trpc/client";

export const useResendOtp = () => {
  const { mutateAsync: resendOtpMutation, isPending: isResending } =
    trpc.auth.resendOtp.useMutation();

  const handleResend = async (id: string) => {
    if (!id) return;
    try {
      await resendOtpMutation({ id });
    } catch (error: any) {}
  };

  return { handleResend, isResending };
};
