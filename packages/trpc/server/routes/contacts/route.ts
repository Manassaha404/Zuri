import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { contactService } from "../../services";
import { createContactDto, updateContactDto, contactIdDto } from "./model";

export const contactsRouter = router({
  getContacts: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await contactService.getContacts(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  createContact: protectedProcedure
    .input(createContactDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await contactService.createContact(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  updateContact: protectedProcedure
    .input(updateContactDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await contactService.updateContact(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteContact: protectedProcedure
    .input(contactIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await contactService.deleteContact(input.contactId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
