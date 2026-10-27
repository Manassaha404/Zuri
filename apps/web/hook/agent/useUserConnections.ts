"use client";

import { useMemo, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export interface UserConnection {
  id: string;
  toolkitSlug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  displayName?: string;
}

export function useUserConnections(enabled: boolean = true) {
  const utils = trpc.useUtils();

  // Query cached user connections with 24-hr stale time matching Redis cache
  const connectionsQuery = trpc.agent.getUserConnectedAccounts.useQuery(
    undefined,
    {
      enabled,
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: true, // Auto-sync when user returns from OAuth popup
    },
  );

  const initiateMutation = trpc.agent.initiateToolkitConnection.useMutation({
    onError: (err) => {
      toast.error(err.message || "Failed to initiate connection");
    },
  });

  const disconnectMutation = trpc.agent.disconnectToolkit.useMutation({
    onSuccess: () => {
      toast.success("Disconnected successfully");
      void utils.agent.getUserConnectedAccounts.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to disconnect");
    },
  });

  const checkStatusMutation =
    trpc.agent.checkToolkitConnectionStatus.useMutation({
      onSuccess: (data) => {
        if (data?.isConnected) {
          toast.success("Connection established successfully!");
          void utils.agent.getUserConnectedAccounts.invalidate();
        }
      },
    });

  const refreshMutation = trpc.agent.refreshUserConnectedAccounts.useMutation({
    onSuccess: (data) => {
      utils.agent.getUserConnectedAccounts.setData(undefined, data);
      toast.success("Connections refreshed");
    },
  });

  // Map of toolkitSlug -> active connection
  const connectionsMap = useMemo(() => {
    const map = new Map<string, UserConnection>();
    const items = connectionsQuery.data || [];
    for (const item of items) {
      if (item.status === "ACTIVE") {
        map.set(item.toolkitSlug.toLowerCase(), item);
      }
    }
    return map;
  }, [connectionsQuery.data]);

  // Connect toolkit and handle redirect popup/window
  const connectToolkit = useCallback(
    async (toolkitSlug: string) => {
      const res = await initiateMutation.mutateAsync({
        toolkit: toolkitSlug,
      });

      if (res?.redirectUrl) {
        // Open OAuth authentication in a popup window
        const popup = window.open(
          res.redirectUrl,
          `composio_auth_${toolkitSlug}`,
          "width=650,height=750,toolbar=no,menubar=no,scrollbars=yes,status=no",
        );

        if (!popup) {
          toast.error("Popup blocked! Please allow popups to connect.");
          return res;
        }

        // Poll for connection completion while popup is open
        const interval = setInterval(async () => {
          if (popup.closed) {
            clearInterval(interval);
            // Verify final status once popup is closed
            if (res.connectionId) {
              await checkStatusMutation.mutateAsync({
                connectionId: res.connectionId,
              });
            }
          }
        }, 1500);
      } else {
        // Direct connection without redirect
        toast.success(`Connected to ${toolkitSlug}`);
        void utils.agent.getUserConnectedAccounts.invalidate();
      }

      return res;
    },
    [initiateMutation, checkStatusMutation, utils],
  );

  const disconnectToolkit = useCallback(
    async (connectionId: string) => {
      return await disconnectMutation.mutateAsync({
        connectionId,
      });
    },
    [disconnectMutation],
  );

  return {
    connections: connectionsQuery.data || [],
    connectionsMap,
    isLoading: connectionsQuery.isLoading,
    isConnecting: initiateMutation.isPending || checkStatusMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    connectToolkit,
    disconnectToolkit,
    refreshConnections: () => refreshMutation.mutateAsync(),
    refetchConnections: () => connectionsQuery.refetch(),
  };
}
