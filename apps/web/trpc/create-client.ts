import { httpBatchLink } from "@repo/trpc/client";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL?.replace("/trpc", "") || "";
}

export const createTRPCLink = () =>
  httpBatchLink({
    url: `${getBaseUrl()}/trpc`,
    fetch(url, options) {
      return fetch(url, { ...options, credentials: "include" });
    },
  });
