"use client";

import { Check, Copy, Pin, RotateCw } from "lucide-react";
import { ZuriAvatar } from "@/components/ui/avatar-logo/ZuriAvatar";
import { MessageAttachments } from "./MessageAttachments";
import type { ChatMessage } from "./types";

interface MessageBubbleProps {
  message: ChatMessage;
  darkMode: boolean;
  copiedId: string;
  showAvatar?: boolean;
  isStreaming?: boolean;
  onCopy: (message: ChatMessage) => void;
  onPin: (message: ChatMessage) => void;
  onRetry: () => void;
}

export function MessageBubble({
  message,
  copiedId,
  showAvatar = true,
  isStreaming = false,
  onCopy,
  onPin,
  onRetry,
}: MessageBubbleProps) {
  const isCopied = copiedId === message.id;

  if (message.role === "user") {
    const hasAttachments =
      (message.attachments && message.attachments.length > 0) ||
      (message.fileUrls && message.fileUrls.length > 0);

    return (
      <div className="u flex flex-col gap-2">
        {hasAttachments && (
          <MessageAttachments
            attachments={message.attachments}
            fileUrls={message.fileUrls}
          />
        )}
        {message.content && (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
      </div>
    );
  }

  return (
    <div className={`ai ${isStreaming ? "ai-streaming" : ""}`}>
      <div className="ai-logo shrink-0 flex items-center justify-center">
        {showAvatar ? (
          <ZuriAvatar
            size={32}
            defaultAnimation={isStreaming ? "working" : "idle"}
            ariaLabel="Zuri"
          />
        ) : (
          <div className="w-8 h-8 shrink-0" aria-hidden="true" />
        )}
      </div>

      <div className="ai-body">
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
          {isStreaming && (
            <span
              className="inline-block w-1.5 h-4 ml-1 bg-[var(--accent)] animate-pulse rounded-full align-middle"
              aria-hidden="true"
            />
          )}
        </div>

        {message.code && (
          <pre>
            <code>{message.code}</code>
          </pre>
        )}

        {!isStreaming && (
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
        )}
      </div>
    </div>
  );
}
