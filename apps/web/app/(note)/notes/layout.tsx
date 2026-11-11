import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes & Documentation Workspace",
  description:
    "Notion-like hierarchical block editor with Eraser diagrams, S3 attachments, and fractional reordering.",
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full">{children}</div>;
}
