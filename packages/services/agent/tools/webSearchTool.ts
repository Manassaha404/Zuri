import { z } from "zod/v4";
import {
  DynamicStructuredTool,
  StructuredToolInterface,
} from "@langchain/core/tools";
import { tvly } from "../model";

// Built-in Tavily web search tool bound directly to the main LLM
export const webSearchTool = new DynamicStructuredTool({
  name: "web_search",
  description:
    "Search the live web using Tavily for up-to-date information, news, facts, documentation, or current events. Returns a concise answer (when available) and relevant search results with titles, URLs, and content snippets.",
  schema: z.object({
    query: z
      .string()
      .trim()
      .min(1)
      .describe("The search query to look up on the web."),
    topic: z
      .enum(["general", "news", "finance"])
      .optional()
      .default("general")
      .describe(
        "Search topic category: 'general' for broad web search, 'news' for recent news/current events, 'finance' for financial data/markets.",
      ),
    searchDepth: z
      .enum(["basic", "advanced"])
      .optional()
      .default("basic")
      .describe(
        "Search depth: 'basic' for fast results, 'advanced' for deeper, more comprehensive content.",
      ),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe("Maximum number of search results to return (1-10, default 5)."),
    timeRange: z
      .enum(["day", "week", "month", "year"])
      .optional()
      .describe("Optional recency filter for results."),
    includeDomains: z
      .array(z.string())
      .optional()
      .describe("Optional list of domains to restrict search results to."),
    excludeDomains: z
      .array(z.string())
      .optional()
      .describe("Optional list of domains to exclude from search results."),
  }),
  func: async ({
    query,
    topic = "general",
    searchDepth = "basic",
    maxResults = 5,
    timeRange,
    includeDomains,
    excludeDomains,
  }) => {
    try {
      const res = await tvly.search(query, {
        topic,
        searchDepth,
        maxResults,
        includeAnswer: true,
        ...(timeRange ? { timeRange } : {}),
        ...(includeDomains?.length ? { includeDomains } : {}),
        ...(excludeDomains?.length ? { excludeDomains } : {}),
      });

      return JSON.stringify({
        query: res.query,
        answer: res.answer ?? null,
        results: (res.results ?? []).map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          ...(r.publishedDate ? { publishedDate: r.publishedDate } : {}),
          score: r.score,
        })),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        error: message || "Web search failed",
      });
    }
  },
}) as unknown as StructuredToolInterface;
