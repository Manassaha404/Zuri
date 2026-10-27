import { Router } from "express";
import crypto from "node:crypto";
import redis from "@repo/redis";
import { publisher } from "@repo/redis/pubsub";
import { inngest } from "@repo/services/inngest/index";
import { composio } from "@repo/services/agent/composio";
import logger from "@repo/logger/logger";
import { env } from "./env";

const composioWebhookRouter: Router = Router();

// Fallback HMAC verification for Composio / Svix webhook signatures
function verifyComposioSignature(
  rawBody: Buffer | undefined,
  bodyObj: any,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
): boolean {
  if (!secret) return true;

  // Direct header secret match
  if (
    headers["x-composio-webhook-secret"] === secret ||
    headers["x-webhook-secret"] === secret ||
    headers["authorization"] === secret ||
    headers["authorization"] === `Bearer ${secret}`
  ) {
    return true;
  }

  const signatureHeader =
    (headers["webhook-signature"] as string) ||
    (headers["x-composio-signature"] as string) ||
    (headers["x-signature"] as string) ||
    (headers["composio-signature"] as string);

  if (!signatureHeader) {
    return false;
  }

  const payloadStr =
    rawBody instanceof Buffer
      ? rawBody.toString("utf-8")
      : typeof rawBody === "string"
        ? rawBody
        : JSON.stringify(bodyObj || {});

  const webhookId =
    (headers["webhook-id"] as string) ||
    (headers["x-webhook-id"] as string) ||
    "";
  const webhookTimestamp =
    (headers["webhook-timestamp"] as string) ||
    (headers["x-webhook-timestamp"] as string) ||
    "";

  // Svix / Composio format: signed content is `${id}.${timestamp}.${payload}`
  const toSignCandidates: string[] = [];
  if (webhookId && webhookTimestamp) {
    toSignCandidates.push(`${webhookId}.${webhookTimestamp}.${payloadStr}`);
  }
  if (webhookTimestamp) {
    toSignCandidates.push(`${webhookTimestamp}.${payloadStr}`);
  }
  toSignCandidates.push(payloadStr);

  // Signatures can be multiple separated by spaces (e.g. "v1,sig1 v1,sig2")
  const signatures = signatureHeader
    .split(" ")
    .map((s) => s.replace(/^v1,|^v1=|^sha256=/, "").trim())
    .filter(Boolean);

  // Keys to try: raw string secret, and if 64-char hex, the decoded Buffer
  const keys: (string | Buffer)[] = [secret];
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    keys.push(Buffer.from(secret, "hex"));
  }
  if (secret.startsWith("whsec_")) {
    try {
      keys.push(Buffer.from(secret.slice(6), "base64"));
    } catch {}
  }

  for (const toSign of toSignCandidates) {
    for (const key of keys) {
      const expectedBase64 = crypto
        .createHmac("sha256", key)
        .update(toSign)
        .digest("base64");
      const expectedHex = crypto
        .createHmac("sha256", key)
        .update(toSign)
        .digest("hex");

      for (const sig of signatures) {
        if (sig === expectedBase64 || sig === expectedHex) {
          return true;
        }
      }
    }
  }

  return false;
}

// Handle Composio connection status webhooks
composioWebhookRouter.post("/", async (req, res) => {
  try {
    const webhookSecret =
      env.COMPOSIO_WEBHOOK_SECRET || process.env.COMPOSIO_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = (req.headers["webhook-signature"] ||
        req.headers["x-composio-signature"] ||
        req.headers["x-signature"]) as string;
      const webhookId = (req.headers["webhook-id"] ||
        req.headers["x-webhook-id"]) as string;
      const webhookTimestamp = (req.headers["webhook-timestamp"] ||
        req.headers["x-webhook-timestamp"]) as string;

      const rawPayload = (req as any).rawBody
        ? (req as any).rawBody.toString("utf-8")
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body || {});

      let verified = false;

      // 1. Try official Composio SDK verification
      if (signature && webhookId && webhookTimestamp) {
        try {
          await composio.triggers.verifyWebhook({
            payload: rawPayload,
            signature,
            id: webhookId,
            timestamp: webhookTimestamp,
            secret: webhookSecret,
            tolerance: 0, // Disable strict clock skew in development
          });
          verified = true;
        } catch (err: any) {
          logger.info("Composio SDK verifyWebhook attempt details:", {
            error: err?.message || String(err),
          });
        }
      }

      // 2. Fallback to resilient manual HMAC check
      if (!verified) {
        verified = verifyComposioSignature(
          (req as any).rawBody,
          req.body,
          req.headers,
          webhookSecret,
        );
      }

      if (!verified) {
        logger.warn(
          "Unauthorized Composio webhook rejected: invalid signature",
          {
            headers: req.headers,
          },
        );
        return res
          .status(401)
          .json({ success: false, message: "Invalid webhook signature" });
      }
    }

    const body = req.body || {};
    logger.info("Composio webhook verified and accepted", {
      type: body.type || body.event,
    });

    // Handle payload from Composio
    const data = body.data || body;
    const eventType = String(body.type || body.event || "");

    // Validate subscription ID if configured and present
    const incomingSubId =
      data.subscription_id ||
      data.subscriptionId ||
      body.subscription_id ||
      body.subscriptionId ||
      (req.headers["webhook-subscription-id"] as string) ||
      (req.headers["x-composio-subscription-id"] as string);

    if (
      env.COMPOSIO_WEBHOOK_SUBSCRIPTION_ID &&
      incomingSubId &&
      incomingSubId !== env.COMPOSIO_WEBHOOK_SUBSCRIPTION_ID
    ) {
      logger.warn("Composio webhook subscription ID mismatch", {
        expected: env.COMPOSIO_WEBHOOK_SUBSCRIPTION_ID,
        received: incomingSubId,
      });
      return res
        .status(403)
        .json({ success: false, message: "Subscription ID mismatch" });
    }

    // Extract user ID
    const userId =
      data.user_uuid ||
      data.userUuid ||
      data.userId ||
      data.user_id ||
      data.entity_id ||
      data.entityId ||
      body.user_uuid ||
      body.userId ||
      (req.query.userId as string);

    // Extract toolkit slug
    const toolkitSlug = String(
      data.appName ||
        data.app_name ||
        data.toolkitSlug ||
        data.toolkit_slug ||
        data.toolkit?.slug ||
        body.appName ||
        body.toolkitSlug ||
        "",
    ).toLowerCase();

    // Extract status
    const status = String(data.status || body.status || "ACTIVE").toUpperCase();

    const isConnected =
      status === "ACTIVE" ||
      status === "CONNECTED" ||
      status === "SUCCESS" ||
      eventType.includes("active") ||
      eventType.includes("connected") ||
      eventType.includes("success");

    const isDenied =
      status === "FAILED" ||
      status === "DENIED" ||
      status === "CANCELLED" ||
      eventType.includes("failed") ||
      eventType.includes("denied");

    if (userId) {
      // Invalidate 24-hour user connections cache
      await redis
        .del(`redis:composio:user_connections:${userId}`)
        .catch(() => {});

      // Check if an agent is waiting for this user's connection
      const waitingKey = `redis:agent:waiting_connection:${userId}`;
      const waitingData = await redis.get(waitingKey).catch(() => null);

      let waitingConversationId: string | null = null;
      if (waitingData) {
        try {
          const parsed = JSON.parse(waitingData);
          waitingConversationId = parsed.conversationId || null;
        } catch {}
      }

      if (isConnected) {
        // Publish real-time connection success to WebSocket clients
        await publisher.publish(
          "redis:agent:status",
          JSON.stringify({
            jobId: waitingConversationId || "global",
            topic: "connection_success",
            payload: {
              userId,
              toolkit: toolkitSlug,
              status: "connected",
              message: `Successfully connected ${toolkitSlug || "toolkit"}!`,
            },
          }),
        );

        // If an agent was waiting, resume it via Inngest
        if (waitingConversationId) {
          logger.info(
            `Resuming agent execution for conversation ${waitingConversationId} after toolkit connection`,
          );
          await inngest.send({
            name: "resume-chat-agent",
            data: {
              userId,
              conversationId: waitingConversationId,
              resumeValue: {
                status: "connected",
                toolkit: toolkitSlug,
              },
            },
          });
        }
      } else if (isDenied && waitingConversationId) {
        // If connection was denied or failed, resume agent with denied status
        await inngest.send({
          name: "resume-chat-agent",
          data: {
            userId,
            conversationId: waitingConversationId,
            resumeValue: {
              status: "denied",
              toolkit: toolkitSlug,
            },
          },
        });
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Webhook processed" });
  } catch (error) {
    logger.error("Error processing Composio webhook", { error });
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

export default composioWebhookRouter;
