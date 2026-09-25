import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";

export const useLogin = () => {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutateAsync: loginMutation, isPending: isLoggingIn } =
    trpc.auth.loginWithEmailAndPass.useMutation();
  const { setUserInfo } = useUserInfoStore();
  const utils = trpc.useUtils();

  const handleLogin = async (data: {
    emailOrUsername: string;
    password: string;
  }) => {
    setApiError(null);
    try {
      const response = await loginMutation(data);
      if (response?.user) {
        setUserInfo({
          userId: response.user.userId,
          email: response.user.email,
          fullName: `${response.user.firstName} ${response.user.lastName}`,
          username: response.user.username,
        });

        await utils.auth.getMe.invalidate();
        router.replace("/");
      }
    } catch (error: any) {
      setApiError(error.message || "Failed to login. Please try again.");
    }
  };

  return { handleLogin, apiError, isLoggingIn, setApiError };
};
