"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  Paperclip,
  Plug,
  Plus,
  X,
} from "lucide-react";
import { type RefObject } from "react";

interface ChatComposerProps {
  darkMode: boolean;
  input: string;
  attachmentName: string;
  model: string;
  modelMenuOpen: boolean;
  loading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  onAttachFile: (name: string) => void;
  onRemoveAttachment: () => void;
  onModelSelect: (model: string) => void;
  onModelMenuToggle: () => void;
}

export function ChatComposer({
  input,
  attachmentName,
  model,
  modelMenuOpen,
  loading,
  textareaRef,
  fileInputRef,
  onInputChange,
  onKeyDown,
  onSubmit,
  onAttachFile,
  onRemoveAttachment,
  onModelSelect,
  onModelMenuToggle,
}: ChatComposerProps) {
  return (
    <div className="w-full max-w-[760px] shrink-0 mt-auto flex flex-col gap-2">
      {attachmentName && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--h)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--b)]">
          <Paperclip size={14} />
          <span className="min-w-0 flex-1 truncate">{attachmentName}</span>
          <button
            type="button"
            onClick={onRemoveAttachment}
            aria-label="Remove attachment"
            className="rounded p-1 hover:text-red-500"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="bx">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Message Zuri…"
          aria-label="Message Zuri"
          className="w-full resize-none bg-transparent outline-none text-[15px] text-[var(--i)] placeholder:text-[var(--m)] max-h-[140px] leading-relaxed no-scrollbar"
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAttachFile(file.name);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            aria-label="Attach file"
            className="ib"
          >
            <Plus size={18} />
          </button>

          <button
            type="button"
            title="Connectors"
            aria-label="Connectors"
            onClick={() =>
              window.alert("Connectors: Google Drive and GitHub are active.")
            }
            className="ib"
          >
            <Plug size={18} />
          </button>

          <div className="relative">
            <button type="button" onClick={onModelMenuToggle} className="md">
              <span>{model}</span>
              <ChevronDown size={14} />
            </button>

            {modelMenuOpen && (
              <div className="absolute bottom-11 left-0 z-30 w-44 rounded-xl border border-[var(--h)] bg-[var(--bg)] p-1 shadow-lg">
                {["Zuri Fast", "Zuri Thinking"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onModelSelect(item)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--i)] hover:bg-[var(--s)]"
                  >
                    <span>{item}</span>
                    {model === item && (
                      <Check size={14} className="text-[#3b82f6]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="flex-1" />

          <button
            type="submit"
            disabled={loading || (!input.trim() && !attachmentName)}
            aria-label="Send"
            className="ib bg-[var(--p)] text-[var(--pt)] border-0 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--pt)] border-t-transparent" />
            ) : (
              <ArrowUp size={18} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
