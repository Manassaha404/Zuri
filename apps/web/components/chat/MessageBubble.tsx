"use client";

import { Check, Copy, Pin, RotateCw } from "lucide-react";
import { ZuriAvatar } from "@/components/ui/avatar-logo/ZuriAvatar";
import type { ChatMessage } from "./types";

interface MessageBubbleProps {
  message: ChatMessage;
  darkMode: boolean;
  copiedId: string;
  onCopy: (message: ChatMessage) => void;
  onPin: (message: ChatMessage) => void;
  onRetry: () => void;
}

export function MessageBubble({
  message,
  copiedId,
  onCopy,
  onPin,
  onRetry,
}: MessageBubbleProps) {
  const isCopied = copiedId === message.id;

  if (message.role === "user") {
    return <div className="u">{message.content}</div>;
  }

  return (
    <div className="ai">
      <div className="ai-logo shrink-0">
        <ZuriAvatar size={32} defaultAnimation="idle" ariaLabel="Zuri" />
      </div>

      <div className="ai-body">
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {message.code && (
          <pre>
            <code>{message.code}</code>
          </pre>
        )}

        <div className="flex items-center gap-1 text-[var(--m)] mt-1">
          <button
            type="button"
            onClick={() => onCopy(message)}
            title="Copy response"
            aria-label="Copy response"
            className="ib border-0 bg-transparent hover:bg-[var(--h)] text-[var(--m)] hover:text-[var(--i)] w-8 h-8"
          >
            {isCopied ? (
              <Check size={16} className="text-[#10b981]" />
            ) : (
              <Copy size={16} />
            )}
          </button>

          <button
            type="button"
            onClick={() => onPin(message)}
            title="Pin response"
            aria-label="Pin response"
            className="ib border-0 bg-transparent hover:bg-[var(--h)] text-[var(--m)] hover:text-[var(--i)] w-8 h-8"
          >
            <Pin size={16} />
          </button>

          <button
            type="button"
            onClick={onRetry}
            title="Regenerate"
            aria-label="Regenerate"
            className="ib border-0 bg-transparent hover:bg-[var(--h)] text-[var(--m)] hover:text-[var(--i)] w-8 h-8"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
