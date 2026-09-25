import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";

export const useChangeUsername = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutateAsync: changeUsernameMutation, isPending: isChangingUsername } =
    trpc.auth.changeUsername.useMutation();
  const { setUserInfo } = useUserInfoStore();
  const utils = trpc.useUtils();

  const handleChangeUsername = async (newUsername: string) => {
    setApiError(null);
    try {
      const response = await changeUsernameMutation({ newUsername });
      if (response?.success) {
        setUserInfo({
          username: response.newUsername,
        });

        await utils.auth.getMe.invalidate();
        router.replace("/");
      }
    } catch (error: any) {
      setApiError(
        error.message || "Failed to change username. Please try again.",
      );
    }
  };

  return { handleChangeUsername, apiError, isChangingUsername, setApiError };
};
