import { useUserInfoStore } from "@/store/userInfoStore";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export const useLogout = () => {
  const router = useRouter();
  const { setUserInfo } = useUserInfoStore();
  const queryClient = useQueryClient();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setUserInfo({
        userId: undefined,
        email: undefined,
        fullName: undefined,
        username: undefined,
      });
      queryClient.clear();
      router.replace("/");
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  return {
    handleLogout,
    isLoggingOut: logoutMutation.isPending,
  };
};
