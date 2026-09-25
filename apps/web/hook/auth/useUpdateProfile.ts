import { useState } from "react";
import { trpc } from "@/trpc/client";
import { useUserInfoStore } from "@/store/userInfoStore";
import { toast } from "sonner";

interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
}

export const useUpdateProfile = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutateAsync: updateProfileMutation, isPending: isUpdatingProfile } =
    trpc.auth.updateProfile.useMutation();
  const { setUserInfo } = useUserInfoStore();
  const utils = trpc.useUtils();

  const handleUpdateProfile = async (payload: UpdateProfilePayload) => {
    setApiError(null);
    try {
      const response = await updateProfileMutation(payload);
      if (response?.success) {
        setUserInfo({
          ...payload,
        });

        await utils.auth.getMe.invalidate();
        toast.success(response.message || "Profile updated successfully");
        return true;
      }
    } catch (error: any) {
      const errorMsg =
        error.message || "Failed to update profile. Please try again.";
      setApiError(errorMsg);
      toast.error(errorMsg);
      return false;
    }
  };

  return { handleUpdateProfile, apiError, isUpdatingProfile, setApiError };
};
