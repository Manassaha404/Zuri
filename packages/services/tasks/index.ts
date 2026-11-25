// Task Service - Core business logic for tasks, subtasks, and shared projects
import db, { eq, and, asc, desc, inArray } from "@repo/database";
import {
  taskProjects,
  tasks,
  taskSubtasks,
  type TaskProjectRecord,
  type TaskRecord,
  type TaskSubtaskRecord,
} from "@repo/database/models";
import { AppError } from "@repo/error";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "doing" | "done";
export type TaskRecurrence =
  | "none"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly";
export type TaskReminderOffset =
  | "none"
  | "at_time"
  | "10m"
  | "30m"
  | "1h"
  | "1d";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface CreateProjectInput {
  name: string;
  color?: string;
  description?: string;
  status?: ProjectStatus;
  deadline?: string;
}

export interface UpdateProjectInput {
  projectId: string;
  name?: string;
  color?: string;
  description?: string | null;
  status?: ProjectStatus;
  deadline?: string | null;
}

export interface CreateTaskInput {
  projectId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string[];
  recurrence?: TaskRecurrence;
  reminder?: TaskReminderOffset;
  estimateMinutes?: number;
  subtasks?: Array<{ text: string; completed?: boolean }>;
}

export interface UpdateTaskInput {
  taskId: string;
  projectId?: string;
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string[];
  recurrence?: TaskRecurrence;
  reminder?: TaskReminderOffset;
  estimateMinutes?: number | null;
  loggedMinutes?: number;
  subtasks?: Array<{ text: string; completed?: boolean }>;
}

export interface HydratedTask extends TaskRecord {
  subtasks: TaskSubtaskRecord[];
}

export class TaskService {
  // Ensure default Inbox project exists for user
  async ensureDefaultProject(userId: string): Promise<TaskProjectRecord[]> {
    const existing = await db
      .select()
      .from(taskProjects)
      .where(eq(taskProjects.userId, userId))
      .orderBy(asc(taskProjects.createdAt));

    if (existing.length === 0) {
      const [inbox] = await db
        .insert(taskProjects)
        .values({
          userId,
          name: "Inbox",
          color: "#6b7280",
          status: "active",
        })
        .returning();
      return inbox ? [inbox] : [];
    }

    return existing;
  }

  // Hydrate tasks with subtasks
  private async hydrateTasks(taskRows: TaskRecord[]): Promise<HydratedTask[]> {
    if (taskRows.length === 0) return [];
    const taskIds = taskRows.map((t) => t.taskId);
    const subtaskRows = await db
      .select()
      .from(taskSubtasks)
      .where(inArray(taskSubtasks.taskId, taskIds))
      .orderBy(asc(taskSubtasks.createdAt));

    const map = new Map<string, TaskSubtaskRecord[]>();
    for (const s of subtaskRows) {
      const list = map.get(s.taskId) || [];
      list.push(s);
      map.set(s.taskId, list);
    }

    return taskRows.map((t) => ({
      ...t,
      subtasks: map.get(t.taskId) || [],
    }));
  }

  // Get full task workspace
  async getUserTaskWorkspace(userId: string): Promise<{
    projects: TaskProjectRecord[];
    tasks: HydratedTask[];
  }> {
    const projects = await this.ensureDefaultProject(userId);
    const taskRows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));

    const hydrated = await this.hydrateTasks(taskRows);
    return { projects, tasks: hydrated };
  }

  // Create project
  async createProject(
    userId: string,
    input: CreateProjectInput,
  ): Promise<TaskProjectRecord> {
    const name = input.name.trim();
    if (!name) {
      throw new AppError("BAD_REQUEST", "Project name is required");
    }

    const [created] = await db
      .insert(taskProjects)
      .values({
        userId,
        name,
        color: input.color || "#3b82f6",
        description: input.description?.trim() || null,
        status: input.status || "active",
        deadline: input.deadline || null,
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create project");
    }
    return created;
  }

  // Update project
  async updateProject(
    userId: string,
    input: UpdateProjectInput,
  ): Promise<TaskProjectRecord> {
    const [existing] = await db
      .select()
      .from(taskProjects)
      .where(
        and(
          eq(taskProjects.projectId, input.projectId),
          eq(taskProjects.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Project not found");
    }

    const values: Partial<typeof taskProjects.$inferInsert> = {};
    if (input.name !== undefined) values.name = input.name.trim();
    if (input.color !== undefined) values.color = input.color;
    if (input.description !== undefined)
      values.description = input.description ? input.description.trim() : null;
    if (input.status !== undefined) values.status = input.status;
    if (input.deadline !== undefined) values.deadline = input.deadline;

    const [updated] = await db
      .update(taskProjects)
      .set(values)
      .where(
        and(
          eq(taskProjects.projectId, input.projectId),
          eq(taskProjects.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to update project");
    }
    return updated;
  }

  // Delete project
  async deleteProject(
    projectId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(taskProjects)
      .where(
        and(
          eq(taskProjects.projectId, projectId),
          eq(taskProjects.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Project not found");
    }

    await db
      .delete(taskProjects)
      .where(
        and(
          eq(taskProjects.projectId, projectId),
          eq(taskProjects.userId, userId),
        ),
      );

    return { success: true };
  }

  // Create task
  async createTask(
    userId: string,
    input: CreateTaskInput,
  ): Promise<HydratedTask> {
    const title = input.title.trim();
    if (!title) {
      throw new AppError("BAD_REQUEST", "Task title is required");
    }

    let resolvedProjectId = input.projectId;
    if (!resolvedProjectId) {
      const projects = await this.ensureDefaultProject(userId);
      resolvedProjectId = projects[0]?.projectId;
    }
    if (!resolvedProjectId) {
      throw new AppError("BAD_REQUEST", "Project ID is required");
    }

    const status = input.status || "todo";
    const [created] = await db
      .insert(tasks)
      .values({
        userId,
        projectId: resolvedProjectId,
        title,
        description: input.description?.trim() || null,
        dueDate: input.dueDate || null,
        dueTime: input.dueTime || null,
        priority: input.priority || "medium",
        status,
        tags: input.tags || [],
        recurrence: input.recurrence || "none",
        reminder: input.reminder || "none",
        estimateMinutes: input.estimateMinutes ?? null,
        loggedMinutes: 0,
        completedAt: status === "done" ? new Date() : null,
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to create task");
    }

    if (input.subtasks && input.subtasks.length > 0) {
      await db.insert(taskSubtasks).values(
        input.subtasks.map((s) => ({
          taskId: created.taskId,
          userId,
          text: s.text.trim(),
          completed: Boolean(s.completed),
        })),
      );
    }

    const [hydrated] = await this.hydrateTasks([created]);
    return hydrated!;
  }

  // Update task
  async updateTask(
    userId: string,
    input: UpdateTaskInput,
  ): Promise<HydratedTask> {
    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskId, input.taskId), eq(tasks.userId, userId)));

    if (!existing) {
      throw new AppError("NOT_FOUND", "Task not found");
    }

    const values: Partial<typeof tasks.$inferInsert> = {};
    if (input.projectId !== undefined) values.projectId = input.projectId;
    if (input.title !== undefined) values.title = input.title.trim();
    if (input.description !== undefined)
      values.description = input.description ? input.description.trim() : null;
    if (input.dueDate !== undefined) values.dueDate = input.dueDate;
    if (input.dueTime !== undefined) values.dueTime = input.dueTime;
    if (input.priority !== undefined) values.priority = input.priority;
    if (input.status !== undefined) {
      values.status = input.status;
      values.completedAt = input.status === "done" ? new Date() : null;
    }
    if (input.tags !== undefined) values.tags = input.tags;
    if (input.recurrence !== undefined) values.recurrence = input.recurrence;
    if (input.reminder !== undefined) values.reminder = input.reminder;
    if (input.estimateMinutes !== undefined)
      values.estimateMinutes = input.estimateMinutes;
    if (input.loggedMinutes !== undefined)
      values.loggedMinutes = input.loggedMinutes;

    const [updated] = await db
      .update(tasks)
      .set(values)
      .where(and(eq(tasks.taskId, input.taskId), eq(tasks.userId, userId)))
      .returning();

    if (!updated) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to update task");
    }

    if (input.subtasks !== undefined) {
      await db
        .delete(taskSubtasks)
        .where(eq(taskSubtasks.taskId, input.taskId));
      if (input.subtasks.length > 0) {
        await db.insert(taskSubtasks).values(
          input.subtasks.map((s) => ({
            taskId: input.taskId,
            userId,
            text: s.text.trim(),
            completed: Boolean(s.completed),
          })),
        );
      }
    }

    const [hydrated] = await this.hydrateTasks([updated]);
    return hydrated!;
  }

  // Delete task
  async deleteTask(
    taskId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskId, taskId), eq(tasks.userId, userId)));

    if (!existing) {
      throw new AppError("NOT_FOUND", "Task not found");
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.taskId, taskId), eq(tasks.userId, userId)));

    return { success: true };
  }

  // Add subtask
  async addSubtask(
    userId: string,
    taskId: string,
    text: string,
  ): Promise<TaskSubtaskRecord> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskId, taskId), eq(tasks.userId, userId)));

    if (!task) {
      throw new AppError("NOT_FOUND", "Task not found");
    }

    const [created] = await db
      .insert(taskSubtasks)
      .values({
        taskId,
        userId,
        text: text.trim(),
        completed: false,
      })
      .returning();

    if (!created) {
      throw new AppError("INTERNAL_SERVER_ERROR", "Failed to add subtask");
    }
    return created;
  }

  // Toggle subtask
  async toggleSubtask(
    userId: string,
    subtaskId: string,
  ): Promise<TaskSubtaskRecord> {
    const [existing] = await db
      .select()
      .from(taskSubtasks)
      .where(
        and(
          eq(taskSubtasks.subtaskId, subtaskId),
          eq(taskSubtasks.userId, userId),
        ),
      );

    if (!existing) {
      throw new AppError("NOT_FOUND", "Subtask not found");
    }

    const [updated] = await db
      .update(taskSubtasks)
      .set({ completed: !existing.completed })
      .where(
        and(
          eq(taskSubtasks.subtaskId, subtaskId),
          eq(taskSubtasks.userId, userId),
        ),
      )
      .returning();

    return updated!;
  }

  // Delete subtask
  async deleteSubtask(
    userId: string,
    subtaskId: string,
  ): Promise<{ success: boolean }> {
    await db
      .delete(taskSubtasks)
      .where(
        and(
          eq(taskSubtasks.subtaskId, subtaskId),
          eq(taskSubtasks.userId, userId),
        ),
      );

    return { success: true };
  }
}

export default TaskService;
