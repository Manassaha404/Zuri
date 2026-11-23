import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { resolveMcpClient } from "../mcp";

// List available prompt templates from remote MCP server
export const listPrompts = tool(
  async ({ cursor, serverName = "zuriMcp" }, config) => {
    try {
      const resolvedConvId = (config as any)?.configurable?.thread_id;
      const userId = (config as any)?.configurable?.user_id;
      const client = await resolveMcpClient(
        serverName,
        resolvedConvId,
        undefined,
        userId,
      );
      const res = await client.listPrompts(cursor ? { cursor } : undefined);
      return JSON.stringify(res.prompts ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({ error: message || "Failed to list MCP prompts" });
    }
  },
  {
    name: "list_mcp_prompts",
    description: "List available prompt templates from the remote MCP server",
    schema: z.object({
      cursor: z.string().optional().describe("Optional pagination cursor"),
      serverName: z
        .string()
        .optional()
        .default("zuriMcp")
        .describe("Target MCP server name"),
    }),
  },
);

// Fetch a prompt template by name from remote MCP server
export const getPrompt = tool(
  async ({ name, args, serverName = "zuriMcp" }, config) => {
    try {
      const resolvedConvId = (config as any)?.configurable?.thread_id;
      const userId = (config as any)?.configurable?.user_id;
      const client = await resolveMcpClient(
        serverName,
        resolvedConvId,
        undefined,
        userId,
      );
      const res = await client.getPrompt({ name, arguments: args });
      return JSON.stringify(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        error: message || `Failed to fetch MCP prompt "${name}"`,
      });
    }
  },
  {
    name: "get_mcp_prompt",
    description:
      "Fetch a prompt template by name with arguments from the remote MCP server (e.g. 'notes_read_guidelines', 'notes_write_guidelines', 'notes_page_structure')",
    schema: z.object({
      name: z
        .string()
        .describe(
          "Name of the prompt template to retrieve (e.g. 'notes_read_guidelines', 'notes_write_guidelines', 'notes_page_structure')",
        ),
      args: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          "Optional arguments for the prompt template (e.g. { topic: 'Sprint Architecture' } for 'notes_page_structure')",
        ),
      serverName: z
        .string()
        .optional()
        .default("zuriMcp")
        .describe("Target MCP server name (default: 'zuriMcp')"),
    }),
  },
);

// LLM-facing MCP tools: only prompt access tools
// notes_* tools are bound directly to the LLM via getLiveMCPTools() in llmCall
// and executed by ToolNode via DynamicStructuredTool → MCP client → FastMCP server
export const mcpTools = [listPrompts, getPrompt];
