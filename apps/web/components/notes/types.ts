// Types for Notes system matching Drizzle models in packages/database/models/notes/

export type RichTextMark = "bold" | "italic" | "underline" | "strike" | "code";

export type RichTextSpan = {
  text: string;
  marks?: RichTextMark[];
  href?: string; // external link
  pageId?: string; // internal @mention / page link
};

export type RichText = RichTextSpan[];

export type BlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list"
  | "numbered_list"
  | "todo"
  | "toggle"
  | "quote"
  | "callout"
  | "code"
  | "divider"
  | "image"
  | "file"
  | "bookmark"
  | "diagram"
  | "table"
  | "page_link";

export type BlockContent =
  | {
      type:
        | "paragraph"
        | "heading_1"
        | "heading_2"
        | "heading_3"
        | "quote"
        | "bulleted_list"
        | "numbered_list"
        | "toggle";
      richText: RichText;
    }
  | { type: "todo"; richText: RichText; checked: boolean }
  | { type: "callout"; richText: RichText; icon?: string; color?: string }
  | { type: "code"; language: string; code: string; caption?: string }
  | { type: "divider" }
  | {
      type: "image";
      cloudinaryUrl?: string;
      cloudinaryPublicId?: string;
      attachmentId?: string;
      caption?: string;
      width?: number;
      height?: number;
    }
  | {
      type: "file";
      attachmentId?: string;
      cloudinaryPublicId?: string;
      cloudinaryUrl?: string;
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
      caption?: string;
    }
  | {
      type: "bookmark";
      url: string;
      title?: string;
      description?: string;
      favicon?: string;
    }
  | { type: "diagram"; diagramId: string }
  | { type: "page_link"; pageId: string; title?: string; caption?: string }
  | { type: "table"; rows: RichText[][] };

export interface Block {
  blockId: string;
  pageId: string;
  parentBlockId?: string | null; // nesting for toggle children and sub-bullets
  type: BlockType;
  content: BlockContent;
  position: string; // fractional index (e.g. "a0", "a1", "a0V")
  plainText: string; // flattened text for search
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  pageId?: string;
  chapterId?: string; // Files stored in chapter file dock
  blockId?: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string; // S3/MinIO key
  checksum?: string; // SHA-256 for deduplication
  width?: number; // for images to avoid layout shift
  height?: number;
  url?: string; // preview/download URL
  createdAt: string;
}

export type DiagramKind = "canvas";

export type AnchorPosition = "top" | "bottom" | "left" | "right" | "center";

export type CanvasElementType =
  | "rectangle"
  | "circle"
  | "diamond"
  | "database"
  | "server"
  | "cloud"
  | "group"
  | "text"
  | "arrow"
  | "line";

export interface CanvasSceneElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  description?: string;
  fill?: string;
  stroke?: string;
  fontSize?: number;

  // Connection metadata for normal lines & arrow lines with magnetic snapping
  fromNodeId?: string | null;
  fromAnchor?: AnchorPosition | null;
  toNodeId?: string | null;
  toAnchor?: AnchorPosition | null;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  hasArrowEnd?: boolean;
}

export interface DiagramScene {
  elements: CanvasSceneElement[];
  zoom: number;
  panX: number;
  panY: number;
}

export interface Diagram {
  diagramId: string;
  pageId: string;
  title?: string; // Optional - diagrams belong directly to page without requiring a name
  kind: DiagramKind;
  source?: string; // mermaid / DSL text
  scene?: DiagramScene; // canvas JSON scene
  thumbnailAttachmentId?: string | null;
  updatedAt: string;
}

export interface Notebook {
  notebookId: string;
  userId: string;
  title: string;
  icon?: string;
  color?: string;
  coverUrl?: string;
  position: string;
  isArchived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  chapterId: string;
  notebookId: string;
  fileDockId?: string | null;
  title: string;
  icon?: string;
  color?: string;
  position: string;
  summary?: string;
  isArchived: boolean;
  isFavorite: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  pageId: string;
  chapterId: string;
  notebookId: string; // denormalized for fast "all pages in notebook"
  title: string;
  summary?: string; // Page summary / overview
  position: string;
  isPinned: boolean;
  isArchived: boolean;
  archivedAt?: string | null;
  searchVector?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageLink {
  sourcePageId: string;
  sourceBlockId: string;
  targetPageId: string;
}

export interface SearchResult {
  page: Page;
  chapterTitle?: string;
  notebookTitle?: string;
  matchedText: string;
  rankingScore: number;
  matchType: "title" | "content";
}
