"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  LogOut,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Plug,
  Plus,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import {
  ThemeToggle,
  toggleThemeWithAnimation,
} from "@/components/ui/ThemeToggle";
import { useUIStore } from "@/store/uiStore";
import type { ChatGroup, Connector, PinnedMessage, User } from "./types";
import { getInitials } from "./utils";
import { useLogout } from "@/hook/auth/useLogout";

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (value: boolean) => void;
  darkMode?: boolean;
  setDarkMode?: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleTheme?: (e?: React.MouseEvent<HTMLElement>) => void;
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
}

export function Sidebar({
  mobileOpen,
  setMobileOpen,
  darkMode,
  setDarkMode,
  onToggleTheme,
  user,
  onNewChat,
  onSelectChat,
  selectedChat,
  chatGroups,
  connectors,
  setConnectors,
  pinnedMessages,
  setPinnedMessages,
  memory,
  setMemory,
}: SidebarProps) {
  const {
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    darkMode: storeDarkMode,
    toggleTheme: storeToggleTheme,
  } = useUIStore();

  const isDark = darkMode !== undefined ? darkMode : storeDarkMode;
  const isSidebarOpen = mobileOpen !== undefined ? mobileOpen : sidebarOpen;
  const collapsed = sidebarCollapsed;
  const setCollapsed = setSidebarCollapsed;

  const handleToggleTheme = (e?: React.MouseEvent<HTMLElement>) => {
    if (onToggleTheme) {
      onToggleTheme(e);
    } else if (setDarkMode) {
      toggleThemeWithAnimation(isDark, setDarkMode, e);
    } else {
      storeToggleTheme(e);
    }
  };

  const [connectorsModalOpen, setConnectorsModalOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tempMemory, setTempMemory] = useState(memory);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  function toggleGroup(groupName: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  }

  function handleUnpin(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setPinnedMessages((prev) => prev.filter((item) => item.id !== id));
  }

  const { handleLogout, isLoggingOut } = useLogout();
  const dropdownRef = useRef<HTMLDivElement>(null);

  function closeMobile() {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
    setSidebarOpen(false);
  }

  function toggleConnector(name: string) {
    setConnectors((prev) =>
      prev.map((item) =>
        item.name === name ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  }

  function saveMemory() {
    setMemory(tempMemory);
    setMemoryModalOpen(false);
  }

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }

    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  return (
    <>
      {isSidebarOpen && isMobile && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Connectors Dialog */}
      {connectorsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Plug size={18} className="text-[#3b82f6]" />
              <h2 className="text-base font-semibold text-[var(--i)]">
                Connectors
              </h2>
            </div>
            <p className="text-xs text-[var(--m)]">
              Manage your connected services and integrations.
            </p>
            <div className="flex flex-col gap-2.5">
              {connectors.map(({ name, enabled, icon: Icon }) => (
                <div
                  key={name}
                  onClick={() => toggleConnector(name)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--h)] hover:bg-[var(--s)] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className="text-[var(--m)]" />
                    <span className="text-sm font-medium text-[var(--i)]">
                      {name}
                    </span>
                  </div>
                  <span className={`tg ${enabled ? "on" : ""}`} />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setConnectorsModalOpen(false)}
              className="bt p mt-2 text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Memory Dialog */}
      {memoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-[var(--h)] bg-[var(--bg)] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-[#3b82f6]" />
              <h2 className="text-base font-semibold text-[var(--i)]">
                Zuri Memory
              </h2>
            </div>
            <p className="text-xs text-[var(--m)]">
              Zuri remembers context and preferences across chats to provide
              better answers.
            </p>
            <textarea
              rows={4}
              value={tempMemory}
              onChange={(e) => setTempMemory(e.target.value)}
              placeholder="e.g. Prefers concise answers, writes code in TypeScript, focuses on clean architectures."
              className="in h-auto py-2.5 text-xs resize-none"
            />
            <div className="flex gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => setMemoryModalOpen(false)}
                className="bt w-auto px-4 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMemory}
                className="bt p w-auto px-4 text-xs"
              >
                Save memory
              </button>
            </div>
          </div>
        </div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--h)] bg-[var(--s)] text-[var(--b)] transition-all duration-300 lg:sticky lg:top-0 lg:h-screen ${
          collapsed ? "w-[72px]" : "w-[280px]"
        } ${
          isMobile
            ? isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
        } p-4`}
      >
        {/* Top brand header */}
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 mb-2">
            <Link
              href="/"
              className="lg flex items-center gap-2.5 text-[var(--i)] font-semibold text-xl tracking-tight no-underline"
              onClick={closeMobile}
            >
              <span>Zuri</span>
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="ib hidden lg:grid"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 mb-3">
            <Link
              href="/"
              onClick={closeMobile}
              className="flex items-center justify-center no-underline"
              title="Zuri"
            ></Link>

            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              className="ib hidden lg:grid"
              title="Expand sidebar"
            >
              <PanelLeft size={18} />
            </button>
          </div>
        )}

        {!collapsed ? (
          <>
            {/* Top Action Buttons: New chat, Connectors, Memory */}
            <div className="flex flex-col gap-2 my-2">
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  closeMobile();
                }}
                className="bt p btn-new-chat text-sm font-semibold transition-colors"
              >
                <Plus size={16} />
                <span>New chat</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConnectorsModalOpen(true)}
                  className="bt text-xs font-medium justify-center gap-1.5"
                  title="Connectors"
                >
                  <Plug size={14} className="text-[#3b82f6]" />
                  <span>Connectors</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTempMemory(memory);
                    setMemoryModalOpen(true);
                  }}
                  className="bt text-xs font-medium justify-center gap-1.5"
                  title="Memory"
                >
                  <Brain size={14} className="text-[#8b5cf6]" />
                  <span>Memory</span>
                </button>
              </div>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 -mx-2 px-2 pt-2 [scrollbar-width:thin]">
              {/* PINNED CONVERSATIONS (Top of the sidebar, no partition line, no emojis) */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup("pinned")}
                  className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold text-[var(--m)] uppercase tracking-wider hover:text-[var(--i)] transition-colors select-none text-left group"
                  title="Toggle pinned conversations"
                >
                  <span>Pinned</span>
                  <ChevronDown
                    size={13}
                    className={`text-[var(--m)] group-hover:text-[var(--i)] transition-transform duration-200 ${
                      collapsedGroups["pinned"] ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </button>

                {!collapsedGroups["pinned"] && (
                  <div className="flex flex-col gap-0.5 animate-in fade-in-0 duration-150">
                    {pinnedMessages.length === 0 ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--m)] italic">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--m)]/40 shrink-0" />
                        <span className="truncate">
                          No pinned conversations
                        </span>
                      </div>
                    ) : (
                      pinnedMessages.map((item) => {
                        const isSelected = selectedChat === item.title;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              onSelectChat(item.title);
                              closeMobile();
                            }}
                            className={`group flex items-center justify-between gap-2 text-left px-3 py-1.5 rounded-lg text-[13.5px] leading-snug transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[var(--h)] text-[var(--i)] font-medium"
                                : "text-[var(--b)] hover:bg-[var(--h)]/60 hover:text-[var(--i)]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-[#3b82f6]"
                                    : "bg-[var(--m)]/60 group-hover:bg-[#3b82f6]"
                                }`}
                              />
                              <span className="truncate">{item.title}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleUnpin(item.id, e)}
                              title="Unpin"
                              className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* CHAT GROUPS (Dropdown bullet points under headings, no 'Previous Chats' header, no partition line) */}
              {chatGroups.map((group) => {
                const isCollapsed = Boolean(collapsedGroups[group.group]);
                return (
                  <div key={group.group} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.group)}
                      className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold text-[var(--m)] uppercase tracking-wider hover:text-[var(--i)] transition-colors select-none text-left group"
                      title={`Toggle ${group.group}`}
                    >
                      <span>{group.group}</span>
                      <ChevronDown
                        size={13}
                        className={`text-[var(--m)] group-hover:text-[var(--i)] transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                      />
                    </button>

                    {!isCollapsed && (
                      <div className="flex flex-col gap-0.5 animate-in fade-in-0 duration-150">
                        {group.items.map((chat) => {
                          const isSelected = selectedChat === chat;
                          return (
                            <button
                              key={chat}
                              type="button"
                              onClick={() => {
                                onSelectChat(chat);
                                closeMobile();
                              }}
                              className={`group flex items-center gap-2.5 text-left px-3 py-1.5 rounded-lg text-[13.5px] leading-snug transition-colors truncate ${
                                isSelected
                                  ? "bg-[var(--h)] text-[var(--i)] font-medium"
                                  : "text-[var(--b)] hover:bg-[var(--h)]/60 hover:text-[var(--i)]"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-[#3b82f6]"
                                    : "bg-[var(--m)]/60 group-hover:bg-[#3b82f6]"
                                }`}
                              />
                              <span className="truncate">{chat}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom user profile & dropdown menu */}
            <div
              ref={dropdownRef}
              className="relative mt-auto pt-3 border-t border-[var(--h)]"
            >
              {/* Dropdown Menu Popup (opens upward) */}
              {userDropdownOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[var(--h)] bg-[var(--bg)] p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-[var(--h)]/60 mb-1">
                    <p className="text-xs font-semibold text-[var(--i)] truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[var(--m)] truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors no-underline"
                  >
                    <Settings size={15} className="text-[var(--m)]" />
                    <span>Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      window.alert("Need help? Reach out at support@zuri.chat");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors text-left"
                  >
                    <HelpCircle size={15} className="text-[var(--m)]" />
                    <span>Get Help</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      window.alert(
                        "Zuri Pro: Unlimited access and fastest models coming soon!",
                      );
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[var(--i)] hover:bg-[var(--s)] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles size={15} className="text-[#3b82f6]" />
                      <span>Upgrade Plan</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6]">
                      Pro
                    </span>
                  </button>

                  <div className="h-px bg-[var(--h)] my-1" />

                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => {
                      setUserDropdownOpen(false);
                      void handleLogout();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                  </button>
                </div>
              )}

              {/* User row trigger */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex-1 flex items-center gap-2.5 p-1 -m-1 rounded-lg hover:bg-[var(--h)]/60 transition-colors text-left"
                  title="Account menu"
                >
                  <span className="w-8 h-8 rounded-full bg-[#8b5cf6] text-[#111] grid place-items-center font-semibold text-[13px] shrink-0">
                    {getInitials(user.name)}
                  </span>
                  <span className="flex-1 font-medium text-sm text-[var(--i)] truncate">
                    {user.name.toLowerCase().replace(/\s+/g, "") || "alex"}
                  </span>
                  <ChevronUp
                    size={15}
                    className={`text-[var(--m)] transition-transform duration-200 ${
                      userDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <ThemeToggle
                  darkMode={isDark}
                  onToggle={handleToggleTheme}
                  className="w-8 h-8 border-0 bg-transparent text-[var(--m)] hover:text-[var(--i)]"
                  size={17}
                />
              </div>
            </div>
          </>
        ) : (
          /* Collapsed state */
          <div className="flex-1 flex flex-col items-center justify-between py-4">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  closeMobile();
                }}
                title="New chat"
                className="ib btn-new-chat-collapsed transition-colors"
              >
                <Plus size={18} />
              </button>

              <button
                type="button"
                onClick={() => setConnectorsModalOpen(true)}
                title="Connectors"
                className="ib"
              >
                <Plug size={16} className="text-[#3b82f6]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setTempMemory(memory);
                  setMemoryModalOpen(true);
                }}
                title="Memory"
                className="ib"
              >
                <Brain size={16} className="text-[#8b5cf6]" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <ThemeToggle
                darkMode={isDark}
                onToggle={handleToggleTheme}
                className="w-9 h-9 border-0 bg-transparent text-[var(--m)] hover:text-[var(--i)]"
                size={17}
              />

              <button
                type="button"
                onClick={() => setCollapsed(false)}
                title={user.name}
                className="w-9 h-9 rounded-full bg-[#8b5cf6] text-[#111] grid place-items-center font-semibold text-[13px]"
              >
                {getInitials(user.name)}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
