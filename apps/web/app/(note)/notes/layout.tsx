import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes & Documentation Workspace",
  description:
    "Hierarchical block editor with hand-crafted diagrams, attachments, and fractional reordering.",
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full">{children}</div>;
}
