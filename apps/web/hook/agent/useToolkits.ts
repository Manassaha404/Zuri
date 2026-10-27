"use client";

import { useMemo } from "react";
import { trpc } from "@/trpc/client";

export interface AvailableToolkit {
  name: string;
  slug: string;
  description: string;
  logo: string;
  categories: string[];
  toolsCount: number;
  authSchemes: string[];
  noAuth: boolean;
}

interface UseToolkitsOptions {
  category?: string;
  search?: string;
  enabled?: boolean;
}

export function useToolkits(options: UseToolkitsOptions = {}) {
  const { category, search, enabled = true } = options;

  // Fetch available categories with Redis caching
  const categoriesQuery = trpc.agent.getToolkitCategories.useQuery(undefined, {
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24-hour cache
    refetchOnWindowFocus: false,
  });

  // Infinite query for toolkits with pagination (100 per page)
  const query = trpc.agent.getAvailableToolkits.useInfiniteQuery(
    {
      category: category && category !== "all" ? category : undefined,
      search: search && search.trim() ? search.trim() : undefined,
      limit: 100,
    },
    {
      enabled,
      getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
      initialCursor: null,
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  );

  // Flatten paginated pages into a single toolkits list
  const toolkits: AvailableToolkit[] = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) =>
      Array.isArray(page?.items) ? page.items : [],
    );
  }, [query.data]);

  // Overall total items reported by server/Composio
  const totalItems = query.data?.pages?.[0]?.totalItems ?? toolkits.length;

  return {
    toolkits,
    categories: categoriesQuery.data || [],
    totalItems,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  };
}
