"use client";

// Code block with language selector, caption, copy button, and clear readable font sizing
import { useState, useEffect, useRef } from "react";
import { Block } from "../../types";
import { useNotesStore } from "@/store/notesStore";
import { Check, Copy, Code2 } from "lucide-react";

interface CodeBlockProps {
  block: Block;
}

const LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "sql",
  "rust",
  "go",
  "bash",
  "json",
  "html",
  "css",
];

export function CodeBlock({ block }: CodeBlockProps) {
  const { updateBlockContent } = useNotesStore();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const content = block.content;
  if (content.type !== "code") return null;

  // Local buffered code — flush to store only on blur
  const [localCode, setLocalCode] = useState(content.code);
  useEffect(() => {
    setLocalCode(content.code);
  }, [content.code]);

  // Auto-resize without changing rows — prevents shake
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [localCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (lang: string) => {
    updateBlockContent(block.blockId, {
      ...content,
      language: lang,
    });
  };

  const handleCodeBlur = () => {
    setIsEditing(false);
    updateBlockContent(block.blockId, {
      ...content,
      code: localCode,
    });
  };

  return (
    <div className="my-5 rounded-2xl border border-[var(--h)] bg-[var(--surface-card)] overflow-hidden shadow-xs font-mono text-[15px] sm:text-[16px]">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-[var(--h)] bg-[var(--s)]/70 px-5 py-3">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-[var(--m)]" />
          <select
            value={content.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-[var(--i)] outline-none uppercase tracking-wider cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option
                key={lang}
                value={lang}
                className="bg-[var(--bg)] text-[var(--i)]"
              >
                {lang}
              </option>
            ))}
          </select>
          {content.caption && (
            <span className="text-xs sm:text-sm text-[var(--m)] italic font-sans truncate max-w-xs">
              — {content.caption}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-sans font-medium text-[var(--m)] hover:bg-[var(--bg)] hover:text-[var(--i)] transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-5 overflow-x-auto notes-scrollbar">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            autoFocus
            value={localCode}
            onChange={(e) => setLocalCode(e.target.value)}
            onBlur={handleCodeBlur}
            rows={1}
            className="w-full bg-transparent text-[var(--i)] outline-none resize-none overflow-hidden font-mono text-[15px] sm:text-[16px] leading-[1.7] min-h-[5em]"
          />
        ) : (
          <pre
            onClick={() => setIsEditing(true)}
            className="text-[var(--i)] whitespace-pre leading-[1.7] cursor-text min-h-[5em]"
          >
            <code>
              {content.code || (
                <span className="text-[var(--m)]/50">
                  Click to write code...
                </span>
              )}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
}
