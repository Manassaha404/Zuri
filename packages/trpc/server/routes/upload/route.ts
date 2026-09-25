import { protectedProcedure, router } from "../../trpc";
import { getUploadSignatureDto } from "@repo/services/upload/model";
import { uploadService } from "../../services";
import { handleRouteError } from "../../utils/error";

export const uploadRouter = router({
  /**
   * getSignature — protected mutation.
   *
   * Client sends file metadata → server returns a Cloudinary signature.
   * The client then uploads the file *directly* to Cloudinary with this signature.
   * No file bytes ever pass through our server.
   */
  getSignature: protectedProcedure
    .input(getUploadSignatureDto)
    .mutation(({ input }) => {
      try {
        return uploadService.getUploadSignature(input);
      } catch (error) {
        handleRouteError(error);
      }
    }),
});
