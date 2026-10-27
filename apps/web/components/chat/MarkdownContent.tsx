"use client";

import React, { useState, memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

interface MarkdownContentProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

interface CodeBlockProps {
  language?: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const displayLang = language?.replace(/^language-/, "") || "text";

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--h)] bg-[#0f0f11] dark:bg-[#141416] text-zinc-100 my-3 shadow-2xs">
      {/* Code header bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-black/40 border-b border-white/10 text-xs text-zinc-400 select-none">
        <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-300">
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 p-1 rounded-md transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">
                Copied
              </span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <pre className="p-3.5 m-0 overflow-x-auto text-[13px] leading-relaxed font-mono bg-transparent border-0 scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export const MarkdownContent = memo(function MarkdownContent({
  content,
  isStreaming = false,
  className = "",
}: MarkdownContentProps) {
  if (!content && !isStreaming) return null;

  return (
    <div className={`markdown-content ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const isCodeBlock =
              Boolean(match) ||
              (typeof children === "string" && children.includes("\n"));

            if (isCodeBlock) {
              const codeString = String(children).replace(/\n$/, "");
              return <CodeBlock language={match?.[1]} code={codeString} />;
            }

            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </Markdown>

      {isStreaming && (
        <span
          className="inline-block w-1.5 h-4 ml-1 bg-[var(--accent)] animate-pulse rounded-full align-middle"
          aria-hidden="true"
        />
      )}
    </div>
  );
});
