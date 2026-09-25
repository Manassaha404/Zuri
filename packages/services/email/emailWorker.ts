import { Worker, Job } from "bullmq";
import { Resend } from "resend";
import { env } from "../env";
import { EmailJobData } from "./emailQueue";

const resend = new Resend(env.RESEND_API_KEY);

export const emailWorker = new Worker<EmailJobData>(
  "email-queue",
  async (job: Job<EmailJobData>) => {
    const { type, email, otp } = job.data;
    try {
      if (type === "VERIFICATION") {
        await resend.emails.send({
          from: "App <verify@manasx.online>",
          to: email,
          subject: "Verify your email address",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
              <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <div style="height: 6px; background-color: #76ABAE; width: 100%;"></div>
                
                <div style="padding: 32px;">
                  <h2 style="margin-top: 0; color: #222831; font-size: 24px; font-weight: 600;">Welcome to Vibe Check!</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 16px;">
                    We're excited to have you on board. Please use the following verification code to complete your registration.
                  </p>
                  
                  <div style="background-color: #f3f4f6; border-radius: 6px; padding: 24px; text-align: center; margin: 32px 0;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #222831;">${otp}</span>
                  </div>
                  
                  <p style="color: #4b5563; font-size: 14px; margin-bottom: 0;">
                    This code will expire in <strong>5 minutes</strong>. If you did not create an account, you can safely ignore this email.
                  </p>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} Vibe Check. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          `,
        });
        console.log(`Sent verification email to ${email}`);
      } else if (type === "PASSWORD_RESET") {
        await resend.emails.send({
          from: "App <onboarding@manasx.online>",
          to: email,
          subject: "Reset your password",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
              <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <div style="height: 6px; background-color: #e11d48; width: 100%;"></div>
                
                <div style="padding: 32px;">
                  <h2 style="margin-top: 0; color: #222831; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 16px;">
                    We received a request to reset the password for your Vibe Check account. Use the code below to set up a new password.
                  </p>
                  
                  <div style="background-color: #f3f4f6; border-radius: 6px; padding: 24px; text-align: center; margin: 32px 0; border: 1px solid #e5e7eb;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #e11d48;">${otp}</span>
                  </div>
                  
                  <p style="color: #4b5563; font-size: 14px; margin-bottom: 0;">
                    This code will expire in <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email or contact support if you have concerns.
                  </p>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} Vibe Check Security.
                  </p>
                </div>
              </div>
            </div>
          `,
        });
        console.log(`Sent password reset email to ${email}`);
      }
    } catch (error) {
      console.error(`Failed to send ${type} email to ${email}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: env.REDIS_HOST || "localhost",
      port: 6379,
    },
  },
);

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed!`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});
