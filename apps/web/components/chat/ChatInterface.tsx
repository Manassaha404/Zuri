"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./types";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { ChatComposer } from "./ChatComposer";
import { Sparkles } from "lucide-react";
import { ZuriAvatar } from "@/components/ui/avatar-logo/ZuriAvatar";
import { useAgent } from "@/hook/agent/useAgent";
import { useAgentUpload } from "@/hook/agent/useAgentUpload";

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
  const agent = useAgent();
  const {
    uploadFile,
    attachedFiles,
    removeAttachedFile,
    clearAttachedFiles,
    isUploading,
  } = useAgentUpload();

  const [input, setInput] = useState("");
  const [model, setModel] = useState("Zuri Fast");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  const messages: ChatMessage[] = agent.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    fileUrls: m.fileUrls,
    attachments: m.attachments,
  }));

  // Identify the latest assistant message and streaming state
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const isStreaming =
    agent.isRunning &&
    Boolean(
      lastAssistantMessage && lastAssistantMessage.content.trim().length > 0,
    );

  const streamingMessageId = isStreaming ? lastAssistantMessage?.id : null;

  // The thinking animation pill should only show while waiting for initial response chunks
  const isThinking = agent.isRunning && !isStreaming;

  // Last assistant message always gets the avatar (both during streaming and when done)
  const lastAssistantMessageId = lastAssistantMessage?.id;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset local composer input when selecting a new chat
  const prevSelectedChatRef = useRef(selectedChat);
  useEffect(() => {
    if (prevSelectedChatRef.current !== selectedChat) {
      prevSelectedChatRef.current = selectedChat;
      setInput("");
      clearAttachedFiles();
      setModelMenuOpen(false);
    }
  }, [selectedChat, clearAttachedFiles]);

  // Auto-scroll to the bottom on new messages / loading state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, agent.isRunning, isStreaming]);

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

  async function sendMessage(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const text = input.trim();
    if (
      (!text && attachedFiles.length === 0) ||
      agent.isRunning ||
      isUploading
    ) {
      return;
    }

    const attachments = attachedFiles
      .filter((f): f is typeof f & { url: string } => Boolean(f.url))
      .map((f) => ({
        name: f.name,
        url: f.url,
        size: f.size,
      }));

    const fileUrls = attachments.map((a) => a.url);

    setInput("");
    clearAttachedFiles();
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    await agent.send(text, fileUrls, attachments);
    textareaRef.current?.focus();
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
      void sendMessage();
    }
  }

  return (
    <main className="mn">
      {agent.isLoadingMessages && messages.length === 0 ? (
        <div className="flex-1 flex flex-col gap-4 p-6 max-w-2xl mx-auto w-full animate-in fade-in-0 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--h)] animate-pulse" />
            <div className="h-4 w-32 bg-[var(--h)] rounded animate-pulse" />
          </div>
          <div className="h-16 w-full bg-[var(--h)]/50 rounded-xl animate-pulse" />
          <div className="h-12 w-2/3 ml-auto bg-[var(--h)]/40 rounded-xl animate-pulse" />
          <div className="h-20 w-4/5 bg-[var(--h)]/50 rounded-xl animate-pulse" />
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          onSetInput={setInput}
          onFocusTextarea={() => textareaRef.current?.focus()}
          userName={userName}
        />
      ) : (
        <div className="ms flex-1 no-scrollbar">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              darkMode={darkMode}
              copiedId={copiedId}
              showAvatar={message.id === lastAssistantMessageId}
              isStreaming={message.id === streamingMessageId}
              onCopy={(msg) => void copyMessage(msg)}
              onPin={(msg) => onPinMessage(msg.content.slice(0, 70))}
              onRetry={() => void sendMessage()}
            />
          ))}

          {isThinking && (
            <div className="flex items-center gap-2.5 py-1 animate-in fade-in duration-300">
              <div className="ai-logo shrink-0 flex items-center justify-center">
                <ZuriAvatar
                  size={32}
                  defaultAnimation="thinking"
                  ariaLabel="Zuri is thinking"
                />
              </div>

              {/* Compact thinking pill directly beside ZuriAvatar */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--h)] bg-[var(--s)]/80 text-xs shadow-xs">
                {/* Fluid soundwave / audio visualizer bars */}
                <div className="flex items-center gap-0.5 h-3.5 w-3 justify-center">
                  <span className="thinking-wave-bar [animation-delay:0ms]" />
                  <span className="thinking-wave-bar [animation-delay:200ms]" />
                  <span className="thinking-wave-bar [animation-delay:400ms]" />
                </div>

                {/* Shimmering animated status text + sparkles */}
                <Sparkles
                  size={12}
                  className="text-[var(--accent)] animate-spin [animation-duration:5s]"
                />
                <span className="font-medium tracking-tight thinking-shimmer select-none">
                  Thinking…
                </span>
              </div>
            </div>
          )}

          {agent.error && (
            <div className="ai">
              <div className="ai-logo shrink-0">
                <ZuriAvatar
                  size={32}
                  defaultAnimation="idle"
                  ariaLabel="Zuri"
                />
              </div>
              <div className="ai-body">
                <p className="text-red-500 text-sm">{agent.error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatComposer
        darkMode={darkMode}
        input={input}
        attachedFiles={attachedFiles}
        model={model}
        modelMenuOpen={modelMenuOpen}
        loading={agent.isRunning}
        isUploading={isUploading}
        textareaRef={textareaRef}
        fileInputRef={fileInputRef}
        onInputChange={handleTextareaChange}
        onKeyDown={handleComposerKeyDown}
        onSubmit={(e) => void sendMessage(e)}
        onAttachFile={(file) => void uploadFile(file)}
        onRemoveAttachment={(id) => removeAttachedFile(id)}
        onModelSelect={(m) => {
          setModel(m);
          setModelMenuOpen(false);
        }}
        onModelMenuToggle={() => setModelMenuOpen((open) => !open)}
      />
    </main>
  );
}
