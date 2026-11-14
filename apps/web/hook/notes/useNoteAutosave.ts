"use client";

// Hook handling page blocks loading, diagram loading, and hybrid Idle Debounce + Max-Wait Throttle autosave
import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useNotesStore } from "@/store/notesStore";
import type { Block, Diagram } from "@/components/notes/types";

export interface UseNoteAutosaveOptions {
  // Idle Debounce: 1 to 2 seconds (default 1500ms) - waits for a brief pause in typing
  idleDebounceMs?: number;
  // Max-Wait Throttle: 5 to 10 seconds (default 6000ms) - forces a save during continuous typing
  maxWaitThrottleMs?: number;
}

export function useNoteAutosave(options: UseNoteAutosaveOptions = {}) {
  const { idleDebounceMs = 1500, maxWaitThrottleMs = 6000 } = options;

  const activePageId = useNotesStore((s) => s.activePageId);
  const pages = useNotesStore((s) => s.pages);
  const blocks = useNotesStore((s) => s.blocks);
  const diagrams = useNotesStore((s) => s.diagrams);
  const saveStatus = useNotesStore((s) => s.saveStatus);
  const lastSavedAt = useNotesStore((s) => s.lastSavedAt);
  const hasUnsavedChanges = useNotesStore((s) => s.hasUnsavedChanges);
  const setSaveStatus = useNotesStore((s) => s.setSaveStatus);
  const setHasUnsavedChanges = useNotesStore((s) => s.setHasUnsavedChanges);
  const setPageBlocks = useNotesStore((s) => s.setPageBlocks);
  const setPageDiagram = useNotesStore((s) => s.setPageDiagram);

  const activePage = pages.find((p) => p.pageId === activePageId);

  // Timer references for dual-stage autosave: Idle Debounce + Max-Wait Throttle
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firstUnsavedAtRef = useRef<number | null>(null);
  const prevPageIdRef = useRef<string | null>(null);

  // Clear timers helper
  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    firstUnsavedAtRef.current = null;
  }, []);

  // Track pages and diagrams that have already been initialized into client memory
  const loadedPagesRef = useRef<Set<string>>(new Set());
  const loadedDiagramsRef = useRef<Set<string>>(new Set());

  // Query blocks for current active page
  const blocksQuery = trpc.notes.getBlocks.useQuery(
    { pageId: activePageId! },
    {
      enabled: Boolean(activePageId),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  );

  // Sync server blocks to store ONLY on initial page load (never overwrite active client editing state)
  useEffect(() => {
    if (
      activePageId &&
      blocksQuery.data &&
      !loadedPagesRef.current.has(activePageId)
    ) {
      loadedPagesRef.current.add(activePageId);
      const currentBlocks = useNotesStore.getState().blocks;
      const alreadyHasBlocks = currentBlocks.some(
        (b) => b.pageId === activePageId,
      );
      if (!alreadyHasBlocks) {
        setPageBlocks(activePageId, blocksQuery.data as unknown as Block[]);
      }
    }
  }, [activePageId, blocksQuery.data, setPageBlocks]);

  // Query diagram for current active page
  const diagramQuery = trpc.notes.getDiagram.useQuery(
    { pageId: activePageId! },
    {
      enabled: Boolean(activePageId),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  );

  // Sync server diagram to store ONLY on initial page load
  useEffect(() => {
    if (
      activePageId &&
      diagramQuery.data &&
      !loadedDiagramsRef.current.has(activePageId)
    ) {
      loadedDiagramsRef.current.add(activePageId);
      const currentDiagrams = useNotesStore.getState().diagrams;
      const alreadyHasDiagram = currentDiagrams.some(
        (d) => d.pageId === activePageId,
      );
      if (!alreadyHasDiagram) {
        setPageDiagram(diagramQuery.data as unknown as Diagram);
      }
    }
  }, [activePageId, diagramQuery.data, setPageDiagram]);

  // Autosave Mutation: NEVER reload or overwrite client-side blocks/state on autosave
  const autosaveMutation = trpc.notes.autosavePage.useMutation({
    onSuccess: () => {
      setSaveStatus("saved", new Date().toLocaleTimeString());
      setHasUnsavedChanges(false);
    },
    onError: () => {
      setSaveStatus("error");
    },
  });

  // Diagram Save Mutation
  const saveDiagramMutation = trpc.notes.saveDiagram.useMutation({
    onSuccess: (data) => {
      if (data) {
        setPageDiagram(data as unknown as Diagram);
      }
    },
  });

  // Flush pending changes immediately
  const flushAutosave = useCallback(async () => {
    clearTimers();

    if (!activePageId || !activePage || activePage.isArchived) return;

    const pageBlocks = blocks.filter((b) => b.pageId === activePageId);

    setSaveStatus("saving");
    try {
      await autosaveMutation.mutateAsync({
        pageId: activePageId,
        title: activePage.title,
        summary: activePage.summary || "",
        blocks: pageBlocks.map((b) => ({
          blockId: b.blockId,
          parentBlockId: b.parentBlockId ?? null,
          type: b.type,
          content: b.content,
          position: b.position,
          plainText: b.plainText,
        })),
      });
    } catch {
      setSaveStatus("error");
    }
  }, [
    clearTimers,
    activePageId,
    activePage,
    blocks,
    autosaveMutation,
    setSaveStatus,
  ]);

  // Hybrid Autosave Effect: Idle Debounce + Max-Wait Throttle
  useEffect(() => {
    // If active page changed, flush previous page if it had unsaved changes
    if (prevPageIdRef.current && prevPageIdRef.current !== activePageId) {
      if (hasUnsavedChanges) {
        flushAutosave();
      } else {
        clearTimers();
      }
    }
    prevPageIdRef.current = activePageId;

    if (!hasUnsavedChanges || !activePageId || activePage?.isArchived) return;

    // 1. Max-Wait Throttle: forces save during continuous, non-stop typing
    if (firstUnsavedAtRef.current === null) {
      firstUnsavedAtRef.current = Date.now();
      maxWaitTimerRef.current = setTimeout(() => {
        flushAutosave();
      }, maxWaitThrottleMs);
    }

    // 2. Idle Debounce: resets on each keystroke/change, waits for a brief pause
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      flushAutosave();
    }, idleDebounceMs);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [
    hasUnsavedChanges,
    activePageId,
    idleDebounceMs,
    maxWaitThrottleMs,
    flushAutosave,
    clearTimers,
  ]);

  // Flush pending changes on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) {
        flushAutosave();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, flushAutosave]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Autosave diagram helper
  const saveDiagram = useCallback(
    async (data: {
      title?: string;
      kind?: "canvas" | "mermaid" | "diagram_as_code";
      source?: string;
      scene?: any;
    }) => {
      if (!activePageId) return;
      return await saveDiagramMutation.mutateAsync({
        pageId: activePageId,
        ...data,
      });
    },
    [activePageId, saveDiagramMutation],
  );

  return {
    saveStatus,
    lastSavedAt,
    hasUnsavedChanges,
    isLoadingBlocks: blocksQuery.isLoading,
    isSaving: autosaveMutation.isPending,
    flushAutosave,
    saveDiagram,
  };
}
