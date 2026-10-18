"use client";

import { ZuriAvatar } from "@/components/ui/avatar-logo/ZuriAvatar";
import type { ChatMessage } from "./types";
import { demoMessages } from "./utils";

interface EmptyStateProps {
  onSetInput: (value: string) => void;
  onFocusTextarea: () => void;
  onLoadDemo: (messages: ChatMessage[]) => void;
  userName?: string;
}

export function EmptyState({
  onSetInput,
  onFocusTextarea,
  onLoadDemo,
  userName = "alex",
}: EmptyStateProps) {
  const chips = [
    "Summarize a PDF",
    "Debug my TypeScript",
    "Plan a study week",
    "Explain RAG simply",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center w-full min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
        <ZuriAvatar size={120} defaultAnimation="idle" ariaLabel="Zuri AI" />

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-[var(--i)]">
          Good evening, {userName}.
          <br />
          What shall we explore?
        </h1>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap justify-center shrink-0">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              onSetInput(chip);
              onFocusTextarea();
            }}
            className="ch"
          >
            {chip}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onLoadDemo(demoMessages)}
        className="mb-2 text-xs text-[var(--m)] hover:text-[var(--i)] transition-colors underline shrink-0"
      >
        Preview conversation example
      </button>
    </div>
  );
}
