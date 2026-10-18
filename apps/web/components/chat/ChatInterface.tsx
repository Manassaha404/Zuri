"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./types";
import { demoMessages, getLocalResponse } from "./utils";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { ChatComposer } from "./ChatComposer";
import { ZuriAvatar } from "@/components/ui/avatar-logo/ZuriAvatar";

interface ChatInterfaceProps {
  selectedChat: string;
  darkMode: boolean;
  onPinMessage: (title: string) => void;
  userName?: string;
}

export function ChatInterface({
  selectedChat,
  darkMode,
  onPinMessage,
  userName = "alex",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("Zuri Fast");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [attachmentName, setAttachmentName] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const responseTimerRef = useRef<number | null>(null);

  function clearResponseTimer() {
    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (selectedChat === "Debounce in TypeScript") {
      setMessages(demoMessages);
    } else {
      setMessages([]);
    }
    setInput("");
    setAttachmentName("");
    setModelMenuOpen(false);
    setLoading(false);
    clearResponseTimer();

    return () => {
      clearResponseTimer();
    };
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function copyMessage(message: ChatMessage) {
    try {
      const content = message.code
        ? `${message.content}\n\n${message.code}`
        : message.content;

      await navigator.clipboard.writeText(content);
      setCopiedId(message.id);

      window.setTimeout(() => {
        setCopiedId((current) => (current === message.id ? "" : current));
      }, 1500);
    } catch {
      setCopiedId("");
    }
  }

  function sendMessage(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const text = input.trim();
    if ((!text && !attachmentName) || loading) return;

    const userContent = attachmentName
      ? `${text || "Please review this attachment."}\n\nAttachment: ${attachmentName}`
      : text;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
    };

    const prompt = text || userContent;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachmentName("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    clearResponseTimer();

    responseTimerRef.current = window.setTimeout(() => {
      const answer = getLocalResponse(prompt);

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: answer },
      ]);

      setLoading(false);
      responseTimerRef.current = null;
      textareaRef.current?.focus();
    }, 600);
  }

  function handleTextareaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function retryLastMessage() {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUserMessage || loading) return;

    const content = lastUserMessage.content;
    const attachmentMatch = content.match(/\n\nAttachment: (.+)$/);

    const cleanContent = content
      .replace(/\n\nAttachment: .+$/, "")
      .replace(/^Please review this attachment\.$/, "")
      .trim();

    setAttachmentName(attachmentMatch?.[1] ?? "");
    setInput(cleanContent);
    textareaRef.current?.focus();
  }

  return (
    <main className="mn">
      {messages.length === 0 ? (
        <EmptyState
          onSetInput={setInput}
          onFocusTextarea={() => textareaRef.current?.focus()}
          onLoadDemo={setMessages}
          userName={userName}
        />
      ) : (
        <div className="ms flex-1 [scrollbar-width:thin]">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              darkMode={darkMode}
              copiedId={copiedId}
              onCopy={(msg) => void copyMessage(msg)}
              onPin={(msg) => onPinMessage(msg.content.slice(0, 70))}
              onRetry={retryLastMessage}
            />
          ))}

          {loading && (
            <div className="ai">
              <div className="ai-logo shrink-0">
                <ZuriAvatar
                  size={32}
                  defaultAnimation="thinking"
                  ariaLabel="Zuri is thinking"
                />
              </div>
              <div className="ai-body flex-row items-center gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:-0.1s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:-0.2s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatComposer
        darkMode={darkMode}
        input={input}
        attachmentName={attachmentName}
        model={model}
        modelMenuOpen={modelMenuOpen}
        loading={loading}
        textareaRef={textareaRef}
        fileInputRef={fileInputRef}
        onInputChange={handleTextareaChange}
        onKeyDown={handleComposerKeyDown}
        onSubmit={sendMessage}
        onAttachFile={setAttachmentName}
        onRemoveAttachment={() => setAttachmentName("")}
        onModelSelect={(m) => {
          setModel(m);
          setModelMenuOpen(false);
        }}
        onModelMenuToggle={() => setModelMenuOpen((open) => !open)}
      />
    </main>
  );
}
