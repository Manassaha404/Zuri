"use client";

// Dynamic page entry syncing activePageId with URL param
import { useEffect, use } from "react";
import { NotesWorkspace } from "@/components/notes/NotesWorkspace";
import { useNotesStore } from "@/store/notesStore";

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default function NoteDetailPage({ params }: PageProps) {
  const { pageId } = use(params);
  const setActivePage = useNotesStore((s) => s.setActivePage);

  useEffect(() => {
    if (pageId) {
      setActivePage(pageId);
    }
  }, [pageId, setActivePage]);

  return <NotesWorkspace />;
}
