import { Queue } from "bullmq";
import { env } from "../env";
export type EmailJobData = {
  type: "VERIFICATION" | "PASSWORD_RESET";
  email: string;
  otp: string;
};

export const emailQueue = new Queue<EmailJobData>("email-queue", {
  connection: {
    host: env.REDIS_HOST || "localhost",
    port: 6379,
  },
});
