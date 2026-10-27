import { composio } from "./composio";
import redis from "@repo/redis";
import { AppError } from "@repo/error";
import { store } from "./pg-for-agent";

export interface UserConnectedAccount {
  id: string;
  toolkitSlug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  displayName?: string;
}

export interface AvailableToolkitsOptions {
  category?: string;
  search?: string;
  cursor?: string | null;
  limit?: number;
}

export interface AvailableToolkitItem {
  name: string;
  slug: string;
  description: string;
  logo: string;
  categories: string[];
  toolsCount: number;
  authSchemes: string[];
  noAuth: boolean;
}

export interface AvailableToolkitsResult {
  items: AvailableToolkitItem[];
  nextCursor: string | null;
  totalItems: number;
}

export class ToolService {
  // Fetch available toolkits with Redis caching and pagination
  static async getAvailableToolkits(
    options?: AvailableToolkitsOptions,
  ): Promise<AvailableToolkitsResult> {
    const limit = options?.limit ?? 100;
    const category = options?.category?.trim();
    const search = options?.search?.trim();
    const cursor = options?.cursor?.trim();

    // Cache key for paginated / filtered list
    const cacheKey = [
      "redis:composio:toolkits:list",
      category || "all",
      search ? search.toLowerCase() : "all",
      cursor || "first",
      limit,
    ].join(":");

    // Try reading cached list from Redis
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as AvailableToolkitsResult;
      }
    } catch (err) {
      console.error("Redis read error in getAvailableToolkits:", err);
    }

    try {
      const listParams: any = { limit };
      if (cursor) listParams.cursor = cursor;
      if (category && category.toLowerCase() !== "all") {
        listParams.category = category;
      }
      if (search) {
        listParams.search = search;
      }

      const response = await composio.getClient().toolkits.list(listParams);

      const items: AvailableToolkitItem[] = (response.items || []).map(
        (t: any) => ({
          name: String(t?.name || ""),
          slug: String(t?.slug || ""),
          description: String(t?.meta?.description || ""),
          logo: String(t?.meta?.logo || ""),
          categories: (t?.meta?.categories || []).map((c: any) =>
            typeof c === "string"
              ? c
              : String(c?.name ?? c?.id ?? c?.slug ?? ""),
          ),
          toolsCount: Number(t?.meta?.tools_count ?? t?.meta?.toolsCount ?? 0),
          authSchemes: Array.isArray(t?.auth_schemes ?? t?.authSchemes)
            ? (t?.auth_schemes ?? t?.authSchemes)
            : [],
          noAuth: Boolean(t?.no_auth ?? t?.noAuth),
        }),
      );

      const result: AvailableToolkitsResult = {
        items,
        nextCursor: (response.next_cursor as string | null) || null,
        totalItems: Number(response.total_items || items.length),
      };

      // Save page list to Redis (24-hour expiration)
      try {
        await redis.set(cacheKey, JSON.stringify(result), "EX", 86400);

        // Store each individual toolkit in Redis pipeline for fast single-toolkit operations
        if (items.length > 0) {
          const pipeline = redis.pipeline();
          for (const item of items) {
            pipeline.set(
              `redis:composio:toolkit:${item.slug}`,
              JSON.stringify(item),
              "EX",
              86400 * 7,
            );
          }
          await pipeline.exec();
        }
      } catch (cacheErr) {
        console.error("Redis write error in getAvailableToolkits:", cacheErr);
      }

      return result;
    } catch (error) {
      console.error("Failed to fetch available toolkits from Composio:", error);
      return {
        items: [],
        nextCursor: null,
        totalItems: 0,
      };
    }
  }

  public async getAvailableToolkits(options?: AvailableToolkitsOptions) {
    return ToolService.getAvailableToolkits(options);
  }

  // Fetch unique toolkit categories sorted by frequency
  static async getToolkitCategories(): Promise<string[]> {
    const cacheKey = "redis:composio:toolkits:categories";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as string[];
      }
    } catch (err) {
      console.error("Redis read error in getToolkitCategories:", err);
    }

    try {
      const cats = await composio.toolkits.listCategories();
      const raw = (cats as any).items || cats || [];
      const counts: Record<string, number> = {};
      for (const c of raw) {
        const name = String(c?.name || c?.id || "").trim();
        if (
          name &&
          name.toLowerCase() !== "other-/-miscellaneous" &&
          name.toLowerCase() !== "other / miscellaneous"
        ) {
          counts[name] = (counts[name] || 0) + 1;
        }
      }
      // Sort categories by frequency of toolkits
      const categories = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map((e) => e[0]);

      try {
        await redis.set(cacheKey, JSON.stringify(categories), "EX", 86400 * 7);
      } catch (cacheErr) {
        console.error("Redis write error in getToolkitCategories:", cacheErr);
      }

      return categories;
    } catch (error) {
      console.error("Failed to fetch categories from Composio:", error);
      return [];
    }
  }

  public async getToolkitCategories() {
    return ToolService.getToolkitCategories();
  }

  // Fetch connected accounts for a specific user with 24-hour Redis caching
  static async getUserConnectedAccounts(
    userId: string,
  ): Promise<UserConnectedAccount[]> {
    const cacheKey = `redis:composio:user_connections:${userId}`;
    // Check Redis cache for 24-hour cached connections
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as UserConnectedAccount[];
      }
    } catch (err) {
      console.error("Redis read error in getUserConnectedAccounts:", err);
    }

    try {
      const response = await composio.connectedAccounts.list({
        userIds: [userId],
      });

      const accounts: UserConnectedAccount[] = (response.items || []).map(
        (item) => ({
          id: item.id,
          toolkitSlug: item.toolkit.slug,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          displayName: (item.data as any)?.displayName || undefined,
        }),
      );

      // Cache user connections in Redis for 24 hours (86400 seconds)
      try {
        await redis.set(cacheKey, JSON.stringify(accounts), "EX", 86400);
      } catch (cacheErr) {
        console.error(
          "Redis write error in getUserConnectedAccounts:",
          cacheErr,
        );
      }

      return accounts;
    } catch (error) {
      console.error(
        "Failed to fetch user connected accounts from Composio:",
        error,
      );
      return [];
    }
  }

  public async getUserConnectedAccounts(userId: string) {
    return ToolService.getUserConnectedAccounts(userId);
  }

  // Initiate OAuth or API connection link for a toolkit
  static async initiateToolkitConnection(
    userId: string,
    toolkitSlug: string,
    callbackUrl?: string,
  ): Promise<{
    connectionId: string;
    status: string;
    redirectUrl: string | null;
  }> {
    try {
      // Find or create auth config for the requested toolkit
      const authConfigs = await composio.authConfigs.list({
        toolkit: toolkitSlug,
      });
      let authConfigId = authConfigs.items[0]?.id;

      if (!authConfigId) {
        const newConfig = await composio.authConfigs.create(toolkitSlug, {
          type: "use_composio_managed_auth",
          name: `${toolkitSlug} Auth Config`,
        });
        authConfigId = newConfig.id;
      }

      // Create a Composio connect link for the user
      const linkRes = await composio.connectedAccounts.link(
        userId,
        authConfigId,
        {
          callbackUrl,
        },
      );

      // Invalidate Redis user connections cache so fresh status is fetched
      await redis.del(`redis:composio:user_connections:${userId}`);

      return {
        connectionId: linkRes.id,
        status: linkRes.status || "INITIATED",
        redirectUrl: linkRes.redirectUrl || null,
      };
    } catch (error) {
      console.error(
        `Failed to initiate toolkit connection for ${toolkitSlug}:`,
        error,
      );
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        `Failed to initiate connection for ${toolkitSlug}`,
      );
    }
  }

  public async initiateToolkitConnection(
    userId: string,
    toolkitSlug: string,
    callbackUrl?: string,
  ) {
    return ToolService.initiateToolkitConnection(
      userId,
      toolkitSlug,
      callbackUrl,
    );
  }

  // Disconnect third-party toolkit account and clear cache
  static async disconnectToolkit(
    userId: string,
    connectionId: string,
  ): Promise<{ success: boolean }> {
    try {
      await composio.connectedAccounts.delete(connectionId);

      // Invalidate Redis cache for this user
      await redis.del(`redis:composio:user_connections:${userId}`);

      return { success: true };
    } catch (error) {
      console.error(
        `Failed to disconnect toolkit account ${connectionId}:`,
        error,
      );
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        `Failed to disconnect toolkit account`,
      );
    }
  }

  public async disconnectToolkit(userId: string, connectionId: string) {
    return ToolService.disconnectToolkit(userId, connectionId);
  }

  // Check status of a connection and update cache on active state
  static async checkToolkitConnectionStatus(
    userId: string,
    connectionId: string,
  ): Promise<{ connectionId: string; status: string; isConnected: boolean }> {
    try {
      const account = await composio.connectedAccounts.get(connectionId);
      const isConnected = account.status === "ACTIVE";

      // If active, invalidate Redis cache so user connections reflect latest status
      if (isConnected) {
        await redis.del(`redis:composio:user_connections:${userId}`);
      }

      return {
        connectionId: account.id,
        status: account.status,
        isConnected,
      };
    } catch (error) {
      console.error(
        `Failed to check connection status for ${connectionId}:`,
        error,
      );
      return {
        connectionId,
        status: "FAILED",
        isConnected: false,
      };
    }
  }

  public async checkToolkitConnectionStatus(
    userId: string,
    connectionId: string,
  ) {
    return ToolService.checkToolkitConnectionStatus(userId, connectionId);
  }

  // Invalidate Redis cache and fetch fresh connected accounts
  static async refreshUserConnectedAccounts(
    userId: string,
  ): Promise<UserConnectedAccount[]> {
    // Invalidate Redis cache
    await redis.del(`redis:composio:user_connections:${userId}`);
    // Fetch fresh and re-cache for 24 hours
    return ToolService.getUserConnectedAccounts(userId);
  }

  public async refreshUserConnectedAccounts(userId: string) {
    return ToolService.refreshUserConnectedAccounts(userId);
  }

  // Sync tool catalog into PostgreSQL memory store for semantic search
  static async syncCatalog(toolkit: string): Promise<void> {
    const raw = await composio.tools.getRawComposioTools({
      toolkits: [toolkit],
      limit: 1000,
    });
    const CHUNK = 20; // don't fire hundreds of embedding calls at once
    for (let i = 0; i < raw.length; i += CHUNK) {
      await Promise.all(
        raw.slice(i, i + CHUNK).map((t: any) =>
          store.put(["tool-catalog"], t.slug, {
            text: `${t.name}: ${t.description}`, // embedded
            toolkit,
          }),
        ),
      );
    }
  }

  public async syncCatalog(toolkit: string) {
    return ToolService.syncCatalog(toolkit);
  }

  // Ensure toolkit catalog is synced, using Redis for fast lookup
  static async ensureCatalog(toolkit: string): Promise<void> {
    const cacheKey = `redis:composio:catalog_synced:${toolkit}`;
    try {
      const isCached = await redis.get(cacheKey);
      if (isCached) return;
    } catch (err) {
      console.error(`Redis read error in ensureCatalog for ${toolkit}:`, err);
    }

    const done = await store.get(["toolkit-registry"], toolkit);
    if (!done) {
      await ToolService.syncCatalog(toolkit);
      await store.put(["toolkit-registry"], toolkit, { synced: true }, false);
    }

    try {
      await redis.set(cacheKey, "1", "EX", 86400 * 7);
    } catch (err) {
      console.error(`Redis write error in ensureCatalog for ${toolkit}:`, err);
    }
  }

  public async ensureCatalog(toolkit: string) {
    return ToolService.ensureCatalog(toolkit);
  }
}

export default ToolService;
