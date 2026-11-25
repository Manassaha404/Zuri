import "dotenv/config";
import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { uploadRouter } from "./routes/upload/route";
import { router } from "./trpc";
import { agentRouter } from "./routes/agent/route";
import { notesRouter } from "./routes/notes/route";
import { habitsRouter } from "./routes/habits/route";
import { expensesRouter } from "./routes/expenses/route";
import { deadlinesRouter } from "./routes/deadlines/route";
import { meetingsRouter } from "./routes/meetings/route";
import { contactsRouter } from "./routes/contacts/route";
import { tasksRouter } from "./routes/tasks/route";
import { projectsRouter } from "./routes/projects/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  upload: uploadRouter,
  agent: agentRouter,
  notes: notesRouter,
  habits: habitsRouter,
  expenses: expensesRouter,
  deadlines: deadlinesRouter,
  meetings: meetingsRouter,
  contacts: contactsRouter,
  tasks: tasksRouter,
  projects: projectsRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
