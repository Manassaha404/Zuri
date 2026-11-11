"use client";

// Primary workspace shell uniting Sidebar, Header, Editor, Diagrams, Search & Chapter File Dock
import { useNotesStore } from "@/store/notesStore";
import { useInitUIStore } from "@/store/uiStore";
import { NotesSidebar } from "./sidebar/NotesSidebar";
import { NotesHeader } from "./header/NotesHeader";
import { BlockEditor } from "./editor/BlockEditor";
import { AllPagesView } from "./views/AllPagesView";
import { DiagramModal } from "./diagrams/DiagramModal";
import { ChapterFileDock } from "./attachments/ChapterFileDock";
import { SearchModal } from "./search/SearchModal";

export function NotesWorkspace() {
  useInitUIStore();
  const { activeView } = useNotesStore();

  return (
    <div className="notes-app flex h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--b)] font-sans antialiased">
      {/* Sidebar Navigation */}
      <NotesSidebar />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <NotesHeader />

        {/* Dynamic View: Block Editor Canvas or Flat All-Pages Query */}
        {activeView === "all-pages" ? <AllPagesView /> : <BlockEditor />}
      </main>

      {/* Global Modals & Overlays */}
      <DiagramModal />
      <ChapterFileDock />
      <SearchModal />
    </div>
  );
}
