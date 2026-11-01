import { z } from "zod/v4";
import {
  DynamicStructuredTool,
  StructuredToolInterface,
} from "@langchain/core/tools";
import redis from "../../redis";
import { cleanPayload } from "../utils";
export const inspectArtifactTool = new DynamicStructuredTool({
  name: "INSPECT_TOOL_ARTIFACT",
  description:
    "Inspect, filter, or page through detailed items from a previously saved large tool output artifact using its artifactId.",
  schema: z.object({
    artifactId: z
      .string()
      .describe(
        "The artifact ID (e.g. 'art_1730000000_abcd') returned by a previous tool call",
      ),
    query: z
      .string()
      .optional()
      .describe("Optional keyword search to filter items inside the artifact"),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Number of items to retrieve (default 5, max 10)"),
    offset: z
      .number()
      .optional()
      .default(0)
      .describe("Zero-based index offset for pagination"),
  }),
  func: async ({ artifactId, query, limit = 5, offset = 0 }) => {
    try {
      const raw = await redis.get(`redis:agent:artifact:${artifactId}`);
      if (!raw) {
        return JSON.stringify({
          error: "Artifact not found or expired from cache.",
        });
      }
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        return raw.slice(offset, offset + limit * 500);
      }

      if (Array.isArray(data)) {
        let items = data;
        if (query) {
          const q = query.toLowerCase();
          items = items.filter((item) =>
            JSON.stringify(item).toLowerCase().includes(q),
          );
        }
        const safeLimit = Math.min(Math.max(1, limit), 10);
        const sliced = items.slice(offset, offset + safeLimit);
        return JSON.stringify({
          artifactId,
          totalItems: items.length,
          offset,
          limit: safeLimit,
          items: sliced.map((i) => cleanPayload(i)),
        });
      }

      return JSON.stringify(cleanPayload(data));
    } catch (err: any) {
      return JSON.stringify({
        error: err.message || "Failed to inspect artifact",
      });
    }
  },
}) as unknown as StructuredToolInterface;
