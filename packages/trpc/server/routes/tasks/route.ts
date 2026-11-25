import { router, protectedProcedure } from "../../trpc";
import { handleRouteError } from "../../utils/error";
import { taskService } from "../../services";
import {
  createProjectDto,
  updateProjectDto,
  projectIdDto,
  createTaskDto,
  updateTaskDto,
  taskIdDto,
  addSubtaskDto,
  subtaskIdDto,
} from "./model";

export const tasksRouter = router({
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await taskService.getUserTaskWorkspace(ctx.user.id);
    } catch (error) {
      return handleRouteError(error);
    }
  }),

  createProject: protectedProcedure
    .input(createProjectDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.createProject(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  updateProject: protectedProcedure
    .input(updateProjectDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.updateProject(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteProject: protectedProcedure
    .input(projectIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.deleteProject(input.projectId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  createTask: protectedProcedure
    .input(createTaskDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.createTask(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  updateTask: protectedProcedure
    .input(updateTaskDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.updateTask(ctx.user.id, input);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteTask: protectedProcedure
    .input(taskIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.deleteTask(input.taskId, ctx.user.id);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  addSubtask: protectedProcedure
    .input(addSubtaskDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.addSubtask(
          ctx.user.id,
          input.taskId,
          input.text,
        );
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  toggleSubtask: protectedProcedure
    .input(subtaskIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.toggleSubtask(ctx.user.id, input.subtaskId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),

  deleteSubtask: protectedProcedure
    .input(subtaskIdDto)
    .mutation(async ({ ctx, input }) => {
      try {
        return await taskService.deleteSubtask(ctx.user.id, input.subtaskId);
      } catch (error) {
        return handleRouteError(error);
      }
    }),
});
