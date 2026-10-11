
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  HardDrive,
  Menu,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Paperclip,
  Pin,
  Plug,
  Plus,
  RotateCw,
  Sparkles,
  Sun,
  Moon,
  Target,
  X,
  Zap,
} from "lucide-react";


type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: string;
};

type ChatGroup = {
  group: string;
  items: string[];
};

type Connector = {
  name: string;
  enabled: boolean;
  icon: typeof HardDrive;
};

type PinnedMessage = {
  id: number;
  title: string;
};

type User = {
  name: string;
  email: string;
};


const initialChatGroups: ChatGroup[] = [
  {
    group: "TODAY",
    items: ["Debounce in TypeScript", "Trip ideas: Berlin"],
  },
  {
    group: "YESTERDAY",
    items: ["RAG pipeline notes"],
  },
  {
    group: "LAST 7 DAYS",
    items: ["Kubernetes basics"],
  },
];

const initialConnectors: Connector[] = [
  { name: "Google Drive", enabled: false, icon: HardDrive },
  { name: "Notion", enabled: false, icon: BookOpen },
];

const demoMessages: ChatMessage[] = [
  {
    id: "demo-user",
    role: "user",
    content: "How do I debounce a search input in TypeScript?",
  },
  {
    id: "demo-assistant",
    role: "assistant",
    content:
      "Debouncing delays a function until the user stops triggering it for a specified time. Here's a simple implementation:",
    code: `export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms = 300
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}`,
  },
];


function getInitials(name: string): string {
  return (name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function addChatToGroups(
  groups: ChatGroup[],
  title: string
): ChatGroup[] {
  const remaining = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item !== title),
    }))
    .filter((group) => group.items.length > 0);

  const today = remaining.find(
    (group) => group.group === "TODAY"
  );

  if (today) {
    return remaining.map((group) =>
      group.group === "TODAY"
        ? { ...group, items: [title, ...group.items] }
        : group
    );
  }

  return [{ group: "TODAY", items: [title] }, ...remaining];
}

function useDashboardTheme(darkMode: boolean) {
  return {
    muted: darkMode ? "text-zinc-400" : "text-zinc-600",
    heading: darkMode ? "text-zinc-100" : "text-zinc-950",
    divider: darkMode ? "border-zinc-800" : "border-zinc-200",
    hover: darkMode
      ? "hover:bg-white/[0.05]"
      : "hover:bg-zinc-100",
  };
}

const primaryButton =
  "bg-lime-400 text-zinc-950 hover:bg-lime-300";



function getLocalResponse(prompt: string): string {
  const text = prompt.toLowerCase().trim();

  if (
    /^(hi|hello|hey|hii|hiii|good morning|good evening)[!. ]*$/.test(
      text
    )
  ) {
    return "Hey! 👋 Welcome to FRIDAY.\n\nI'm running in local demo mode right now. You can explore the interface, test the chat layout, and try the available controls.";
  }

  if (
    text.includes("who are you") ||
    text.includes("what are you")
  ) {
    return "I'm FRIDAY, your personal productivity workspace. 🚀\n\nThis version is a frontend-only demo. It can show predefined responses, but it isn't connected to a real AI model.";
  }

  if (
    text.includes("javascript") ||
    text.includes("typescript") ||
    text.includes("programming") ||
    text.includes("coding")
  ) {
    return "Let's work on programming! 💻\n\nHere is a useful approach:\n\n1. Understand the problem.\n2. Break it into smaller steps.\n3. Write a simple solution.\n4. Test different inputs.\n5. Improve the code when it works.\n\nThis is a predefined demo response. No live AI is being used.";
  }

  if (
    text.includes("debounce") ||
    text.includes("search input")
  ) {
    return "Debouncing delays a function until a certain amount of time has passed since the last call.\n\nIt is useful for search inputs because it prevents a function from running on every keystroke.\n\nFor example, you can wait 300 milliseconds after the user stops typing before filtering results.\n\nThis demo can explain the concept, but it does not execute code or generate live AI answers.";
  }

  if (
    text.includes("project") ||
    text.includes("build") ||
    text.includes("website") ||
    text.includes("startup")
  ) {
    return "Let's plan your project! 🚀\n\n1. Define the problem you want to solve.\n2. Identify your target users.\n3. List the essential features.\n4. Choose a suitable tech stack.\n5. Build a small MVP.\n6. Test it with real users.\n7. Improve it using feedback.\n\nWhat are you planning to build?";
  }

  if (
    text.includes("study") ||
    text.includes("learn") ||
    text.includes("roadmap") ||
    text.includes("career")
  ) {
    return "Here's a simple learning strategy:\n\n1. Choose one clear goal.\n2. Divide it into smaller topics.\n3. Learn the fundamentals.\n4. Practice by building projects.\n5. Review your mistakes.\n6. Track your progress every week.\n\nThis is a local demo response, not a personalized AI-generated roadmap.";
  }

  if (
    text.includes("error") ||
    text.includes("debug") ||
    text.includes("bug") ||
    text.includes("not working")
  ) {
    return "Let's troubleshoot the problem. 🔧\n\n1. Read the complete error message.\n2. Identify the file and line involved.\n3. Check variables and function arguments.\n4. Reproduce the issue with a small example.\n5. Test one fix at a time.\n\nYou can paste your code into the chat UI, but this frontend-only demo cannot analyze it with a real AI model.";
  }

  if (
    text.includes("thank") ||
    text.includes("thanks")
  ) {
    return "You're welcome! 😊\n\nFeel free to continue exploring FRIDAY.";
  }

  return `I received your message:\n\n"${prompt}"\n\nFRIDAY is currently running in local demo mode. This response comes from predefined frontend logic, not a live AI model.`;
}

/* -------------------------------------------------------------------------- */
/*                               CHAT INTERFACE                               */
/* -------------------------------------------------------------------------- */

function ChatInterface({
  selectedChat,
  darkMode,
  onPinMessage,
}: {
  selectedChat: string;
  darkMode: boolean;
  onPinMessage: (title: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("Friday Fast");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [attachmentName, setAttachmentName] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Browser setTimeout returns a number, not NodeJS.Timeout.
  const responseTimerRef = useRef<number | null>(null);

  const theme = useDashboardTheme(darkMode);

  function clearResponseTimer() {
    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }

  useEffect(() => {
    setMessages([]);
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
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function copyMessage(message: ChatMessage) {
    try {
      const content = message.code
        ? `${message.content}\n\n${message.code}`
        : message.content;

      await navigator.clipboard.writeText(content);
      setCopiedId(message.id);

      window.setTimeout(() => {
        setCopiedId((current) =>
          current === message.id ? "" : current
        );
      }, 1500);
    } catch {
      setCopiedId("");
    }
  }

  function sendMessage(
    event?: React.FormEvent<HTMLFormElement>
  ) {
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

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setAttachmentName("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    clearResponseTimer();

    // Frontend-only demo response.
    responseTimerRef.current = window.setTimeout(() => {
      const answer = getLocalResponse(prompt);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
        },
      ]);

      setLoading(false);
      responseTimerRef.current = null;
      textareaRef.current?.focus();
    }, 600);
  }

  function handleTextareaChange(
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height =
      `${Math.min(event.target.scrollHeight, 180)}px`;
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
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

    const attachmentMatch = content.match(
      /\n\nAttachment: (.+)$/
    );

    const cleanContent = content
      .replace(/\n\nAttachment: .+$/, "")
      .replace(/^Please review this attachment\.$/, "")
      .trim();

    setAttachmentName(attachmentMatch?.[1] ?? "");
    setInput(cleanContent);
    textareaRef.current?.focus();
  }

  const assistantAvatar = (
    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-lime-400/20 bg-lime-400/10 text-lime-400">
      <Zap size={19} fill="currentColor" />
    </div>
  );

  return (
    <section
      className={`flex h-full min-h-0 flex-col ${
        darkMode ? "bg-[#09090b]" : "bg-zinc-50"
      }`}
    >
      {/* Chat header */}

      <header
        className={`flex h-[60px] shrink-0 items-center justify-between border-b px-4 sm:px-8 ${
          darkMode
            ? "border-zinc-800/80 bg-[#09090b]"
            : "border-zinc-200 bg-white"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-zinc-950 sm:flex">
            <Zap size={17} fill="currentColor" />
          </div>

          <div className="min-w-0">
            <p
              className={`truncate text-sm font-semibold ${theme.heading}`}
            >
              {selectedChat || "New chat"}
            </p>

            <p className="mt-0.5 text-[11px] text-zinc-500">
              Your personal AI workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] sm:inline-flex ${
              darkMode
                ? "border-zinc-800 text-zinc-400"
                : "border-zinc-200 text-zinc-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                loading
                  ? "animate-pulse bg-yellow-400"
                  : "bg-emerald-400"
              }`}
            />
            {loading ? "Thinking..." : "Ready"}
          </span>

          <button
            type="button"
            onClick={() => {
              clearResponseTimer();
              setMessages([]);
              setInput("");
              setAttachmentName("");
              setLoading(false);

              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
              }
            }}
            title="Clear conversation"
            aria-label="Clear conversation"
            className={`rounded-lg p-2 transition ${theme.muted} ${theme.hover}`}
          >
            <RotateCw size={16} />
          </button>
        </div>
      </header>

      {/* Conversation */}

      <div
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#3f3f46 transparent",
          overscrollBehavior: "contain",
        }}
      >
        <div className="mx-auto w-full max-w-[920px] px-4 pb-8 pt-8 sm:px-8 sm:pt-10">
          {messages.length === 0 ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/[0.07] text-lime-400 shadow-[0_0_50px_rgba(163,230,53,0.06)]">
                <Sparkles size={29} />
              </div>

              <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] text-lime-400">
                YOUR PERSONAL AI
              </p>

              <h1
                className={`text-3xl font-semibold tracking-tight sm:text-4xl ${theme.heading}`}
              >
                What&apos;s on your mind?
              </h1>

              <p
                className={`mt-3 max-w-md text-sm leading-6 ${theme.muted}`}
              >
                Ask questions, explore ideas, debug code, or make
                progress on something that matters.
              </p>

              <div className="mt-8 grid w-full max-w-[620px] gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Learn something",
                    description: "Explain a programming concept",
                    icon: BookOpen,
                  },
                  {
                    title: "Solve a problem",
                    description: "Help me debug my code",
                    icon: Zap,
                  },
                  {
                    title: "Build something",
                    description: "Plan my next project",
                    icon: Target,
                  },
                ].map(
                  ({ title, description, icon: Icon }) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        setInput(description);
                        textareaRef.current?.focus();
                      }}
                      className={`group rounded-2xl border p-4 text-left transition ${
                        darkMode
                          ? "border-zinc-800 bg-zinc-900/40 hover:border-lime-400/30 hover:bg-lime-400/[0.04]"
                          : "border-zinc-200 bg-white hover:border-lime-500/50 hover:bg-lime-50/50"
                      }`}
                    >
                      <Icon
                        size={19}
                        className="mb-4 text-lime-400 transition group-hover:scale-110"
                      />

                      <p
                        className={`text-sm font-semibold ${theme.heading}`}
                      >
                        {title}
                      </p>

                      <p
                        className={`mt-1 text-xs leading-5 ${theme.muted}`}
                      >
                        {description}
                      </p>

                      <ArrowUpRight
                        size={15}
                        className="mt-3 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-lime-400"
                      />
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setMessages(demoMessages)}
                className="mt-6 text-xs text-zinc-500 transition hover:text-lime-400"
              >
                Preview example conversation
              </button>

              <p className="mt-3 text-[10px] text-zinc-600">
                Local demo mode · No AI connection
              </p>
            </div>
          ) : (
            <div className="space-y-9">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "flex justify-end"
                      : "flex items-start gap-3 sm:gap-4"
                  }
                >
                  {message.role === "assistant" && assistantAvatar}

                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[90%] sm:max-w-[78%]"
                        : "min-w-0 flex-1"
                    }
                  >
                    {message.role === "user" ? (
                      <div
                        className={`whitespace-pre-wrap break-words rounded-2xl border px-4 py-3.5 text-sm leading-6 ${
                          darkMode
                            ? "border-zinc-800 bg-zinc-900 text-zinc-100"
                            : "border-zinc-200 bg-white text-zinc-900"
                        }`}
                      >
                        {message.content}
                      </div>
                    ) : (
                      <>
                        <div
                          className={`whitespace-pre-wrap break-words text-sm leading-7 sm:text-[15px] ${
                            darkMode
                              ? "text-zinc-200"
                              : "text-zinc-800"
                          }`}
                        >
                          {message.content}
                        </div>

                        {message.code && (
                          <div
                            className={`mt-4 overflow-hidden rounded-2xl border ${
                              darkMode
                                ? "border-zinc-800 bg-[#0c0c0e]"
                                : "border-zinc-200 bg-white"
                            }`}
                          >
                            <div
                              className={`flex items-center justify-between border-b px-4 py-3 ${
                                darkMode
                                  ? "border-zinc-800"
                                  : "border-zinc-200"
                              }`}
                            >
                              <span className="text-xs font-medium text-zinc-400">
                                Code
                              </span>

                              <button
                                type="button"
                                onClick={() => void copyMessage(message)}
                                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-lime-400/10 hover:text-lime-400"
                              >
                                {copiedId === message.id ? (
                                  <Check size={13} />
                                ) : (
                                  <Copy size={13} />
                                )}

                                {copiedId === message.id
                                  ? "Copied"
                                  : "Copy"}
                              </button>
                            </div>

                            <pre className="overflow-x-auto p-4 text-[12px] leading-7 text-lime-100 sm:p-5 sm:text-[13px]">
                              <code>{message.code}</code>
                            </pre>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void copyMessage(message)}
                            title="Copy response"
                            aria-label="Copy response"
                            className={`rounded-lg p-2 transition ${theme.muted} ${theme.hover}`}
                          >
                            {copiedId === message.id ? (
                              <Check
                                size={16}
                                className="text-lime-400"
                              />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onPinMessage(
                                message.content.slice(0, 70)
                              )
                            }
                            title="Pin response"
                            aria-label="Pin response"
                            className={`rounded-lg p-2 transition ${theme.muted} ${theme.hover}`}
                          >
                            <Pin size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={retryLastMessage}
                            title="Retry last message"
                            aria-label="Retry last message"
                            className={`rounded-lg p-2 transition ${theme.muted} ${theme.hover}`}
                          >
                            <RotateCw size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  {assistantAvatar}

                  <div className="flex items-center gap-1.5 pt-4">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-lime-400/60 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-lime-400/60 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-lime-400/60" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Composer */}

      <div
        className={`shrink-0 px-3 pb-3 pt-3 sm:px-6 sm:pb-5 ${
          darkMode ? "bg-[#09090b]" : "bg-zinc-50"
        }`}
      >
        <div className="mx-auto w-full max-w-[900px]">
          {attachmentName && (
            <div
              className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                darkMode
                  ? "border-zinc-800 bg-zinc-900 text-zinc-300"
                  : "border-zinc-200 bg-white text-zinc-600"
              }`}
            >
              <Paperclip size={14} />

              <span className="min-w-0 flex-1 truncate">
                {attachmentName}
              </span>

              <button
                type="button"
                onClick={() => setAttachmentName("")}
                aria-label="Remove attachment"
                className="rounded p-1 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className={`rounded-2xl border p-3 transition focus-within:border-lime-400/50 focus-within:ring-1 focus-within:ring-lime-400/10 sm:p-4 ${
              darkMode
                ? "border-zinc-800 bg-zinc-900/80"
                : "border-zinc-200 bg-white shadow-sm"
            }`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message Friday..."
              aria-label="Message Friday"
              className={`block max-h-[180px] min-h-[32px] w-full resize-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-zinc-500 sm:text-[15px] ${theme.heading}`}
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    setAttachmentName(file.name);
                  }

                  event.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                aria-label="Attach file"
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                  darkMode
                    ? "border-zinc-800 text-zinc-400 hover:border-lime-400/30 hover:text-lime-400"
                    : "border-zinc-200 text-zinc-600 hover:border-lime-500 hover:text-lime-700"
                }`}
              >
                <Plus size={20} />
              </button>

              <button
                type="button"
                title="Connect tools"
                aria-label="Connect tools"
                onClick={() =>
                  window.alert(
                    "Connectors are frontend-only demo settings. No accounts are connected."
                  )
                }
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                  darkMode
                    ? "border-zinc-800 text-zinc-400 hover:border-lime-400/30 hover:text-lime-400"
                    : "border-zinc-200 text-zinc-600 hover:border-lime-500 hover:text-lime-700"
                }`}
              >
                <Plug size={17} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setModelMenuOpen((open) => !open)
                  }
                  className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${
                    darkMode
                      ? "border-zinc-800 text-zinc-300 hover:bg-white/[0.04]"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <Sparkles
                    size={14}
                    className="text-lime-400"
                  />

                  {model}

                  <ChevronDown size={14} />
                </button>

                {modelMenuOpen && (
                  <div
                    className={`absolute bottom-12 left-0 z-30 w-48 overflow-hidden rounded-xl border p-1 shadow-2xl ${
                      darkMode
                        ? "border-zinc-700 bg-zinc-900"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    {[
                      "Friday Fast",
                      "Friday Thinking",
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setModel(item);
                          setModelMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          darkMode
                            ? "text-zinc-200 hover:bg-white/[0.05]"
                            : "text-zinc-800 hover:bg-zinc-100"
                        }`}
                      >
                        {item}

                        {model === item && (
                          <Check
                            size={14}
                            className="text-lime-400"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  (!input.trim() && !attachmentName)
                }
                aria-label="Send message"
                title="Send message"
                className={`ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-30 ${primaryButton}`}
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-950" />
                ) : (
                  <ArrowUp size={21} />
                )}
              </button>
            </div>
          </form>

          <p className="mt-3 text-center text-[10px] text-zinc-500">
            FRIDAY demo mode · Responses are predefined, not AI-generated.
          </p>
        </div>
      </div>
    </section>
  );
}


function Sidebar({
  mobileOpen,
  setMobileOpen,
  darkMode,
  setDarkMode,
  user,
  onNewChat,
  onSelectChat,
  selectedChat,
  chatGroups,
  setChatGroups,
  connectors,
  setConnectors,
  pinnedMessages,
  setPinnedMessages,
  memory,
  setMemory,
}: {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  user: User;
  onNewChat: () => void;
  onSelectChat: (title: string) => void;
  selectedChat: string;
  chatGroups: ChatGroup[];
  setChatGroups: React.Dispatch<React.SetStateAction<ChatGroup[]>>;
  connectors: Connector[];
  setConnectors: React.Dispatch<React.SetStateAction<Connector[]>>;
  pinnedMessages: PinnedMessage[];
  setPinnedMessages: React.Dispatch<React.SetStateAction<PinnedMessage[]>>;
  memory: string;
  setMemory: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [connectorsOpen, setConnectorsOpen] = useState(true);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);

  const theme = useDashboardTheme(darkMode);

  const sidebarClasses = darkMode
    ? "border-zinc-800 bg-[#09090b] text-zinc-100"
    : "border-zinc-200 bg-white text-zinc-900";

  function closeMobile() {
    setMobileOpen(false);
  }

  function addChat() {
    const title = window.prompt("Enter a chat title");

    if (!title?.trim()) return;

    const cleanTitle = title.trim();

    setChatGroups((previous) =>
      addChatToGroups(previous, cleanTitle)
    );

    onSelectChat(cleanTitle);
    closeMobile();
  }

  function toggleConnector(name: string) {
    setConnectors((previous) =>
      previous.map((item) =>
        item.name === name
          ? { ...item, enabled: !item.enabled }
          : item
      )
    );
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 lg:sticky lg:top-0 lg:h-screen ${
          collapsed ? "w-[76px]" : "w-[300px] xl:w-[320px]"
        } ${sidebarClasses} ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}

        <div
          className={`flex h-[68px] shrink-0 items-center ${
            collapsed
              ? "justify-center px-3"
              : "justify-between px-5"
          }`}
        >
          {!collapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
              onClick={closeMobile}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400 text-zinc-950">
                <Zap size={21} fill="currentColor" />
              </div>

              <span className="text-xl font-bold tracking-tight">
                FRIDAY<span className="text-lime-400">.</span>
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={() =>
              setCollapsed((previous) => !previous)
            }
            aria-label={
              collapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
              darkMode
                ? "border-zinc-800 text-zinc-400 hover:bg-white/[0.05]"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {collapsed ? (
              <PanelLeft size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        {!collapsed ? (
          <>
            {/* New chat */}

            <div className="shrink-0 px-4">
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  closeMobile();
                }}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${primaryButton}`}
              >
                <Plus size={18} strokeWidth={2.5} />
                New chat
              </button>
            </div>

            {/* Sidebar content */}

            <div
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-5 pt-5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700"
              style={{
                scrollbarColor: "#3f3f46 transparent",
              }}
            >
              {/* Previous chats */}

              <section>
                <button
                  type="button"
                  onClick={() =>
                    setChatsOpen((value) => !value)
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${theme.hover}`}
                >
                  <span>Previous chats</span>

                  {chatsOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {chatsOpen && (
                  <div className="mt-2 space-y-3">
                    {chatGroups.map((group) => (
                      <div key={group.group}>
                        <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-wider text-zinc-500">
                          {group.group}
                        </p>

                        {group.items.map((chat) => (
                          <button
                            key={chat}
                            type="button"
                            title={chat}
                            onClick={() => {
                              onSelectChat(chat);
                              closeMobile();
                            }}
                            className={`block w-full truncate rounded-lg px-3 py-2 text-left text-[13px] transition ${
                              selectedChat === chat
                                ? "bg-lime-400/10 font-medium text-lime-400"
                                : `${theme.muted} ${theme.hover}`
                            }`}
                          >
                            {chat}
                          </button>
                        ))}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addChat}
                      className={`flex items-center gap-2 px-3 py-1 text-xs transition hover:text-lime-400 ${theme.muted}`}
                    >
                      <Plus size={14} />
                      Add chat
                    </button>
                  </div>
                )}
              </section>

              {/* Connectors */}

              <section>
                <button
                  type="button"
                  onClick={() =>
                    setConnectorsOpen((value) => !value)
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${theme.hover}`}
                >
                  <span>Connectors</span>

                  {connectorsOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {connectorsOpen && (
                  <div className="mt-2 space-y-1">
                    {connectors.map(
                      ({ name, enabled, icon: Icon }) => (
                        <div
                          key={name}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 ${theme.hover}`}
                        >
                          <span className="flex items-center gap-2.5 text-[13px]">
                            <Icon
                              size={16}
                              className={theme.muted}
                            />
                            {name}
                          </span>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`${enabled ? "Disable" : "Enable"} ${name}`}
                            onClick={() => toggleConnector(name)}
                            className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${
                              enabled
                                ? "bg-lime-400"
                                : "bg-zinc-700"
                            }`}
                          >
                            <span
                              className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all ${
                                enabled
                                  ? "left-[21px]"
                                  : "left-[3px]"
                              }`}
                            />
                          </button>
                        </div>
                      )
                    )}

                    <p className="px-3 pt-1 text-[10px] leading-4 text-zinc-500">
                      Demo settings only. No accounts are connected.
                    </p>
                  </div>
                )}
              </section>

              {/* Memory */}

              <section>
                <button
                  type="button"
                  onClick={() =>
                    setMemoryOpen((value) => !value)
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${theme.hover}`}
                >
                  <span>Memory</span>

                  {memoryOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {memoryOpen && (
                  <div className="mt-2 px-3">
                    <p
                      className={`whitespace-pre-wrap break-words text-xs leading-5 ${theme.muted}`}
                    >
                      {memory || "No saved memory yet."}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        const value = window.prompt(
                          "Edit your saved memory",
                          memory
                        );

                        if (value !== null) {
                          setMemory(value);
                        }
                      }}
                      className="mt-3 text-xs text-lime-400 transition hover:text-lime-300"
                    >
                      {memory ? "Edit memory" : "Add memory"}
                    </button>
                  </div>
                )}
              </section>

              {/* Pinned messages */}

              <section>
                <button
                  type="button"
                  onClick={() =>
                    setPinnedOpen((value) => !value)
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${theme.hover}`}
                >
                  <span>Pinned messages</span>

                  {pinnedOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {pinnedOpen && (
                  <div className="mt-2 space-y-1">
                    {pinnedMessages.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-zinc-500">
                        No pinned messages yet.
                      </p>
                    ) : (
                      pinnedMessages.map((item) => (
                        <div
                          key={item.id}
                          className={`group flex items-center gap-2 rounded-lg px-3 py-2 ${theme.hover}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onSelectChat(item.title)
                            }
                            className={`flex min-w-0 flex-1 items-center gap-2 text-left text-xs ${theme.muted}`}
                          >
                            <Pin
                              size={13}
                              className="shrink-0 text-lime-400"
                            />

                            <span className="truncate">
                              {item.title}
                            </span>
                          </button>

                          <button
                            type="button"
                            aria-label={`Unpin ${item.title}`}
                            onClick={() =>
                              setPinnedMessages((previous) =>
                                previous.filter(
                                  (message) =>
                                    message.id !== item.id
                                )
                              )
                            }
                            className="rounded p-1 text-zinc-500 transition hover:text-red-400"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const title = window.prompt(
                      "Enter a pinned item title"
                    );

                    if (title?.trim()) {
                      setPinnedMessages((previous) => [
                        ...previous,
                        {
                          id: Date.now(),
                          title: title.trim(),
                        },
                      ]);
                    }
                  }}
                  className={`mt-2 flex items-center gap-2 px-3 py-1 text-xs transition hover:text-lime-400 ${theme.muted}`}
                >
                  <Plus size={14} />
                  Pin an item
                </button>
              </section>
            </div>

            {/* User profile */}

            <div className="shrink-0 px-4 pb-4 pt-3">
              <div
                className={`flex items-center gap-3 border-t pt-4 ${theme.divider}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 text-xs font-semibold text-lime-400">
                  {getInitials(user.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {user.name}
                  </p>

                  <p
                    className={`mt-0.5 truncate text-[11px] ${theme.muted}`}
                  >
                    {user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDarkMode((value) => !value)
                  }
                  aria-label={
                    darkMode
                      ? "Switch to light theme"
                      : "Switch to dark theme"
                  }
                  className={`rounded-lg p-2 transition ${theme.hover}`}
                >
                  {darkMode ? (
                    <Sun
                      size={17}
                      className="text-lime-400"
                    />
                  ) : (
                    <Moon size={17} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Collapsed sidebar */

          <div className="flex flex-1 flex-col items-center gap-3 py-5">
            <button
              type="button"
              onClick={() => {
                onNewChat();
                closeMobile();
              }}
              title="New chat"
              className={`rounded-xl p-3 transition ${theme.hover}`}
            >
              <Plus size={21} />
            </button>

            <button
              type="button"
              onClick={() => setCollapsed(false)}
              title="Previous chats"
              className={`rounded-xl p-3 transition ${theme.hover}`}
            >
              <MessageSquare size={20} />
            </button>

            <button
              type="button"
              onClick={() => setCollapsed(false)}
              title="Connectors"
              className={`rounded-xl p-3 transition ${theme.hover}`}
            >
              <HardDrive size={20} />
            </button>

            <div className="mt-auto flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setDarkMode((value) => !value)
                }
                title="Toggle theme"
                className={`rounded-xl p-3 transition ${theme.hover}`}
              >
                {darkMode ? (
                  <Sun
                    size={19}
                    className="text-lime-400"
                  />
                ) : (
                  <Moon size={19} />
                )}
              </button>

              <div
                title={user.name}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10 text-xs font-semibold text-lime-400"
              >
                {getInitials(user.name)}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}


export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const [selectedChat, setSelectedChat] = useState(
    "Debounce in TypeScript"
  );

  const [chatGroups, setChatGroups] =
    useState<ChatGroup[]>(initialChatGroups);

  const [connectors, setConnectors] =
    useState<Connector[]>(initialConnectors);

  const [pinnedMessages, setPinnedMessages] =
    useState<PinnedMessage[]>([]);

  const [memory, setMemory] = useState("");

  // Local demo profile. No authentication request.
  const user: User = {
    name: "FRIDAY User",
    email: "Local workspace",
  };

  function newChat() {
    const title = `New chat ${new Date().toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    )}`;

    setSelectedChat(title);

    setChatGroups((previous) =>
      addChatToGroups(previous, title)
    );
  }

  function selectChat(title: string) {
    setSelectedChat(title);
  }

  function pinMessage(title: string) {
    const cleanTitle = title.trim();

    if (!cleanTitle) return;

    setPinnedMessages((previous) => [
      { id: Date.now(), title: cleanTitle },
      ...previous.filter(
        (item) => item.title !== cleanTitle
      ),
    ]);
  }

  const themeClasses = darkMode
    ? "bg-[#09090b] text-zinc-100"
    : "bg-zinc-50 text-zinc-900";

  return (
    <main
      className={`h-screen overflow-hidden selection:bg-lime-400 selection:text-zinc-950 lg:flex ${themeClasses}`}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onNewChat={newChat}
        onSelectChat={selectChat}
        selectedChat={selectedChat}
        chatGroups={chatGroups}
        setChatGroups={setChatGroups}
        connectors={connectors}
        setConnectors={setConnectors}
        pinnedMessages={pinnedMessages}
        setPinnedMessages={setPinnedMessages}
        memory={memory}
        setMemory={setMemory}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile menu bar */}

        <div
          className={`flex h-12 shrink-0 items-center gap-3 border-b px-3 lg:hidden ${
            darkMode
              ? "border-zinc-800 bg-[#09090b]"
              : "border-zinc-200 bg-white"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"
          >
            <Menu size={19} />
          </button>

          <span className="text-sm font-bold tracking-tight">
            FRIDAY<span className="text-lime-400">.</span>
          </span>

          <span className="min-w-0 flex-1 truncate text-right text-xs text-zinc-500">
            {selectedChat}
          </span>
        </div>

        {/* Chat interface */}

        <div className="min-h-0 flex-1">
          <ChatInterface
            key={selectedChat}
            selectedChat={selectedChat}
            darkMode={darkMode}
            onPinMessage={pinMessage}
          />
        </div>
      </div>
    </main>
  );
}
