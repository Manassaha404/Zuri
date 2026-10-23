"use client";

import { useState, useMemo } from "react";
import {
  Brain,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  User as UserIcon,
  Clock,
  FileText,
  SlidersHorizontal,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  useUserMemories,
  type ZuriMemoryType,
  type ZuriUserMemory,
} from "@/hook/agent";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ZuriMemoryTab = "all" | ZuriMemoryType;

const BRANCH_CONFIG: Record<
  ZuriMemoryType,
  {
    label: string;
    fullLabel: string;
    description: string;
    badgeClass: string;
    icon: typeof UserIcon;
  }
> = {
  profile: {
    label: "Identity",
    fullLabel: "Identity & Profile",
    description:
      "Core identity, biographical & personal details (e.g. name, father's/mother's name, address, job role).",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: UserIcon,
  },
  episodic: {
    label: "Timeline",
    fullLabel: "Episodes & Timeline",
    description:
      "Past personal events, interactions, sessions & milestones (e.g. 'last week we debugged X', college events).",
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  semantic: {
    label: "Knowledge",
    fullLabel: "Knowledge & Facts",
    description:
      "General facts, concepts, and user or world preferences (e.g. 'prefers TypeScript', 'Berlin is in Germany').",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: FileText,
  },
  procedural: {
    label: "Directives",
    fullLabel: "Directives & Rules",
    description:
      "Rules, workflows, learned behaviors, habits & coding guidelines (e.g. 'format dates as YYYY-MM-DD', 'concise answers').",
    badgeClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: SlidersHorizontal,
  },
};

const ALL_BRANCHES: ZuriMemoryType[] = [
  "profile",
  "episodic",
  "semantic",
  "procedural",
];

export function MemoryModal({ isOpen, onClose }: MemoryModalProps) {
  const {
    memories,
    profileMemories,
    episodicMemories,
    semanticMemories,
    proceduralMemories,
    isLoading,
    createMemory,
    updateMemory,
    deleteMemory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useUserMemories();

  const [activeTab, setActiveTab] = useState<ZuriMemoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<ZuriMemoryType>("semantic");

  // Inline editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editType, setEditType] = useState<ZuriMemoryType>("semantic");
  const [editNamespace, setEditNamespace] = useState<string[] | undefined>(
    undefined,
  );

  // Delete confirmation target key
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  // Filter memories according to active tab and search query
  const filteredMemories = useMemo(() => {
    let list: ZuriUserMemory[] = [];
    if (activeTab === "all") {
      list = memories;
    } else if (activeTab === "profile") {
      list = profileMemories;
    } else if (activeTab === "episodic") {
      list = episodicMemories;
    } else if (activeTab === "semantic") {
      list = semanticMemories;
    } else if (activeTab === "procedural") {
      list = proceduralMemories;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter(
      (m) =>
        m.text.toLowerCase().includes(query) ||
        m.type.toLowerCase().includes(query),
    );
  }, [
    activeTab,
    memories,
    profileMemories,
    episodicMemories,
    semanticMemories,
    proceduralMemories,
    searchQuery,
  ]);

  if (!isOpen) return null;

  const handleStartEdit = (memory: ZuriUserMemory) => {
    setEditingKey(memory.key);
    setEditText(memory.text);
    setEditType(memory.type);
    setEditNamespace(memory.namespace);
    setConfirmDeleteKey(null);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditText("");
  };

  const handleSaveEdit = async () => {
    if (!editingKey || !editText.trim()) return;
    try {
      await updateMemory(editingKey, editText.trim(), editType, editNamespace);
      setEditingKey(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to update memory:", err);
    }
  };

  const handleCreateNew = async () => {
    if (!newText.trim()) return;
    try {
      await createMemory(newText.trim(), newType);
      setNewText("");
      setIsAddingNew(false);
    } catch (err) {
      console.error("Failed to create memory:", err);
    }
  };

  const handleDelete = async (memory: ZuriUserMemory) => {
    try {
      await deleteMemory(memory.key, memory.type, memory.namespace);
      setConfirmDeleteKey(null);
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const getBranchCount = (tab: ZuriMemoryTab): number => {
    switch (tab) {
      case "all":
        return memories.length;
      case "profile":
        return profileMemories.length;
      case "episodic":
        return episodicMemories.length;
      case "semantic":
        return semanticMemories.length;
      case "procedural":
        return proceduralMemories.length;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[88vh] rounded-2xl border border-[var(--h)] bg-[var(--bg)] shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--h)] bg-[var(--s)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <Brain size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--i)] leading-none">
                  Zuri Memory
                </h2>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--h)]/50 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 sm:px-5 sm:pt-4 sm:pb-3 border-b border-[var(--h)] flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--m)] hover:text-[var(--i)]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAddingNew((prev) => !prev)}
            className="bt p w-auto px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-3 sm:px-5 pt-3 pb-2 border-b border-[var(--h)] grid grid-cols-5 gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-1.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
              activeTab === "all"
                ? "bg-[var(--i)] text-[var(--bg)]"
                : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
            }`}
          >
            <span className="truncate">All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
                activeTab === "all"
                  ? "bg-[var(--bg)]/20 text-[var(--bg)]"
                  : "bg-[var(--h)]/50 text-[var(--m)]"
              }`}
            >
              {getBranchCount("all")}
            </span>
          </button>

          {ALL_BRANCHES.map((branch) => {
            const config = BRANCH_CONFIG[branch];
            const count = getBranchCount(branch);
            const Icon = config.icon;
            const isActive = activeTab === branch;
            return (
              <button
                key={branch}
                type="button"
                onClick={() => setActiveTab(branch)}
                title={config.fullLabel}
                className={`px-1.5 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
                  isActive
                    ? "bg-[var(--i)] text-[var(--bg)]"
                    : "text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]"
                }`}
              >
                <Icon
                  size={12}
                  className="shrink-0 hidden xs:inline-block sm:inline-block"
                />
                <span className="truncate">{config.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
                    isActive
                      ? "bg-[var(--bg)]/20 text-[var(--bg)]"
                      : "bg-[var(--h)]/50 text-[var(--m)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Description Sub-banner */}
        {activeTab !== "all" && (
          <div className="px-4 sm:px-5 py-2 bg-[var(--s)] text-[11px] text-[var(--m)] border-b border-[var(--h)] flex items-center gap-2">
            <Sparkles size={12} className="text-[var(--accent)] shrink-0" />
            <span className="font-semibold text-[var(--i)] shrink-0">
              {BRANCH_CONFIG[activeTab].fullLabel}:
            </span>
            <span className="truncate sm:whitespace-normal">
              {BRANCH_CONFIG[activeTab].description}
            </span>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-3 [scrollbar-width:thin]">
          {/* Add New Memory Card */}
          {isAddingNew && (
            <div className="p-4 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 flex flex-col gap-3 animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--i)] flex items-center gap-1.5">
                  <Plus size={13} className="text-[var(--accent)]" />
                  New Memory
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-[var(--m)] hover:text-[var(--i)]"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Branch selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {ALL_BRANCHES.map((b) => {
                  const isSelected = newType === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setNewType(b)}
                      title={BRANCH_CONFIG[b].fullLabel}
                      className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors flex items-center justify-center gap-1.5 min-w-0 ${
                        isSelected
                          ? "bg-[var(--i)] text-[var(--bg)] border-[var(--i)]"
                          : "border-[var(--h)] text-[var(--m)] bg-[var(--bg)] hover:text-[var(--i)]"
                      }`}
                    >
                      <span className="truncate">{BRANCH_CONFIG[b].label}</span>
                    </button>
                  );
                })}
              </div>

              <textarea
                rows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={`Enter ${BRANCH_CONFIG[newType].label.toLowerCase()} details (e.g. ${
                  newType === "profile"
                    ? "Full name is John Doe, father's name is Robert."
                    : newType === "episodic"
                      ? "Discussed deployment architecture last Tuesday."
                      : newType === "semantic"
                        ? "Prefers Tailwind CSS and TypeScript."
                        : "Always explain code changes with step-by-step reasoning."
                })`}
                className="w-full p-2.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="bt w-auto px-3 py-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={!newText.trim() || isCreating}
                  className="bt p w-auto px-3.5 py-1 text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  <span>Save Memory</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col gap-2.5 py-6 items-center justify-center text-[var(--m)]">
              <Loader2
                size={22}
                className="animate-spin text-[var(--accent)]"
              />
              <p className="text-xs">Loading memories...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredMemories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-[var(--h)] rounded-xl bg-[var(--s)]/50">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--h)]/40 text-[var(--m)] mb-3">
                <Brain size={18} />
              </div>
              <h3 className="text-xs font-semibold text-[var(--i)]">
                {searchQuery
                  ? "No matching memories found"
                  : `No ${activeTab === "all" ? "" : BRANCH_CONFIG[activeTab].label + " "}memories yet`}
              </h3>
              <p className="text-[11px] text-[var(--m)] mt-1 max-w-sm">
                {searchQuery
                  ? "Try searching with a different term or clear the filter."
                  : "Zuri automatically learns durable facts during your chats, or you can add one manually."}
              </p>
              {!searchQuery && !isAddingNew && (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="bt w-auto px-3 py-1.5 text-xs mt-3.5 flex items-center gap-1.5"
                >
                  <Plus size={12} />
                  <span>Add First Memory</span>
                </button>
              )}
            </div>
          )}

          {/* Memory List Cards */}
          {!isLoading &&
            filteredMemories.map((mem) => {
              const isEditing = editingKey === mem.key;
              const isConfirmingDelete = confirmDeleteKey === mem.key;
              const config = BRANCH_CONFIG[mem.type] ?? BRANCH_CONFIG.semantic;
              const Icon = config.icon;

              if (isEditing) {
                return (
                  <div
                    key={mem.key}
                    className="p-3.5 rounded-xl border border-[var(--accent)] bg-[var(--s)] flex flex-col gap-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--i)] flex items-center gap-1.5">
                        <Pencil size={12} className="text-[var(--accent)]" />
                        Edit Memory
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-[var(--m)] hover:text-[var(--i)]"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Branch selector for edit */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {ALL_BRANCHES.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setEditType(b)}
                          title={BRANCH_CONFIG[b].fullLabel}
                          className={`text-[11px] px-2 py-1 rounded-md border font-medium transition-colors flex items-center justify-center gap-1.5 min-w-0 ${
                            editType === b
                              ? "bg-[var(--i)] text-[var(--bg)] border-[var(--i)]"
                              : "border-[var(--h)] text-[var(--m)] bg-[var(--bg)] hover:text-[var(--i)]"
                          }`}
                        >
                          <span className="truncate">
                            {BRANCH_CONFIG[b].label}
                          </span>
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] resize-none focus:outline-none focus:border-[var(--accent)]"
                      autoFocus
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bt w-auto px-3 py-1 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={!editText.trim() || isUpdating}
                        className="bt p w-auto px-3.5 py-1 text-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        <span>Update</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={mem.key}
                  className="group p-3.5 rounded-xl border border-[var(--h)] bg-[var(--bg)] hover:border-[var(--m)]/40 transition-colors flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium shrink-0 ${config.badgeClass}`}
                    >
                      <Icon size={11} className="shrink-0" />
                      <span>{config.label}</span>
                    </span>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in-0 duration-150">
                          <span className="text-[11px] text-red-500 font-medium">
                            Delete?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(mem)}
                            disabled={isDeleting}
                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(null)}
                            className="px-2 py-0.5 rounded text-[11px] text-[var(--m)] hover:text-[var(--i)]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(mem)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
                            title="Edit memory"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(mem.key)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--m)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete memory"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--i)] leading-relaxed whitespace-pre-wrap select-text">
                    {mem.text}
                  </p>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 border-t border-[var(--h)] bg-[var(--s)] flex items-center justify-between text-[11px] text-[var(--m)]">
          <span>
            {memories.length} total memor{memories.length === 1 ? "y" : "ies"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bt w-auto px-3.5 py-1 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
