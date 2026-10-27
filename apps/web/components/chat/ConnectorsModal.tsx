"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plug,
  Search,
  X,
  RotateCw,
  Wrench,
  Layers,
  Loader2,
  Unplug,
  Link2,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useToolkits,
  useUserConnections,
  type AvailableToolkit,
  type UserConnection,
} from "@/hook/agent";

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectorsModal({ isOpen, onClose }: ConnectorsModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Debounce search input for server & Redis query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Use infinite toolkits hook with Redis caching and pagination
  const {
    toolkits,
    categories,
    totalItems,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useToolkits({
    category: selectedCategory === "connected" ? undefined : selectedCategory,
    search: debouncedSearch,
    enabled: isOpen,
  });

  // User connections hook with 24-hr Redis cache
  const {
    connections,
    connectionsMap,
    isLoading: isLoadingConnections,
    connectToolkit,
    disconnectToolkit,
    refetchConnections,
  } = useUserConnections(isOpen);

  const [activeActionSlug, setActiveActionSlug] = useState<string | null>(null);

  // Connect toolkit and trigger OAuth popup
  const handleConnect = async (slug: string) => {
    try {
      setActiveActionSlug(slug);
      await connectToolkit(slug);
    } catch {
      // Handled in useUserConnections
    } finally {
      setActiveActionSlug(null);
    }
  };

  // Disconnect toolkit and invalidate Redis cache
  const handleDisconnect = async (connectionId: string, slug: string) => {
    try {
      setActiveActionSlug(slug);
      await disconnectToolkit(connectionId);
    } catch {
      // Handled in useUserConnections
    } finally {
      setActiveActionSlug(null);
    }
  };

  // Filter toolkits by "connected" if that tab is selected
  const displayedToolkits = useMemo(() => {
    if (selectedCategory === "connected") {
      return toolkits.filter((t) => connectionsMap.has(t.slug.toLowerCase()));
    }
    return toolkits;
  }, [toolkits, selectedCategory, connectionsMap]);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSearchInput("");
      setDebouncedSearch("");
      setSelectedCategory("all");
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const parentScrollRef = useRef<HTMLDivElement | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(3);

  // Measure container width to dynamically adjust grid columns
  useEffect(() => {
    const el = parentScrollRef.current;
    if (!el) return;

    const updateColumns = () => {
      const width = el.clientWidth;
      if (width < 600) {
        setColumns(1);
      } else if (width < 880) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };

    updateColumns();
    const observer = new ResizeObserver(updateColumns);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  // Virtualize rows to prevent DOM bloat when 1000+ connectors are loaded
  const rowCount = Math.ceil(displayedToolkits.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentScrollRef.current,
    estimateSize: () => 185,
    overscan: 3,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Reset scroll position on filter changes
  useEffect(() => {
    if (parentScrollRef.current) {
      parentScrollRef.current.scrollTop = 0;
    }
  }, [debouncedSearch, selectedCategory]);

  // Trigger next page when scrolling near the bottom of virtual rows
  useEffect(() => {
    const lastItem = virtualRows[virtualRows.length - 1];
    if (!lastItem) return;

    if (lastItem.index >= rowCount - 2 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [virtualRows, rowCount, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Allow horizontal scrolling via mouse wheel over categories
  const handleCategoryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && categoryScrollRef.current) {
      categoryScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connectors-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-[var(--h)] bg-[var(--bg)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--h)] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0 border border-[var(--accent)]/20">
              <Plug size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="connectors-modal-title"
                  className="text-base sm:text-lg font-semibold text-[var(--i)] tracking-tight truncate"
                >
                  Toolkit Connectors
                </h2>
                {!isLoading && (
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--s)] text-[var(--m)] border border-[var(--h)]">
                      {totalItems > 0 ? `${totalItems} available` : "Ready"}
                    </span>
                    {connectionsMap.size > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {connectionsMap.size} connected
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--m)] truncate mt-0.5">
                Explore external apps and services ready to connect with your
                agent.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                void refetch();
                void refetchConnections();
              }}
              disabled={isFetching || isLoadingConnections}
              title="Refresh connectors and user connections"
              aria-label="Refresh connectors and user connections"
              className="ib flex items-center justify-center text-[var(--m)] hover:text-[var(--i)] disabled:opacity-50"
            >
              <RotateCw
                size={16}
                className={
                  (isFetching && !isFetchingNextPage) || isLoadingConnections
                    ? "animate-spin text-[var(--accent)]"
                    : ""
                }
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="ib flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="p-4 sm:px-6 border-b border-[var(--h)] bg-[var(--s)]/40 flex flex-col gap-3.5 shrink-0 min-w-0 max-w-full overflow-hidden">
          {/* Search bar */}
          <div className="relative w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m)] pointer-events-none"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search connectors (e.g. Gmail, GitHub, Notion, Slack)..."
              className="w-full pl-9 pr-9 h-10 text-xs sm:text-sm rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] placeholder:text-[var(--m)] focus:outline-hidden focus:border-[var(--i)] focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/10 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--m)] hover:text-[var(--i)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Cal.com Segmented Category Filter Pills */}
          <div className="w-full min-w-0 max-w-full overflow-hidden">
            <div
              ref={categoryScrollRef}
              onWheel={handleCategoryWheel}
              className="flex items-center gap-1 overflow-x-auto w-full min-w-0 styled-scrollbar p-1 rounded-full bg-[var(--s)] border border-[var(--h)] scroll-smooth overscroll-x-contain touch-pan-x"
            >
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                All Categories
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("connected")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === "connected"
                    ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                    : "text-[var(--m)] hover:text-[var(--i)]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Connected ({connectionsMap.size})</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 capitalize transition-all cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? "bg-[var(--p)] text-[var(--pt)] shadow-2xs"
                      : "text-[var(--m)] hover:text-[var(--i)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area with infinite scroll and DOM virtualization */}
        <div
          ref={parentScrollRef}
          className="flex-1 min-h-0 overflow-y-auto styled-scrollbar p-4 sm:p-6"
        >
          {/* Initial Loading Skeletons */}
          {isLoading && toolkits.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[var(--h)] bg-[var(--s)]/30 p-4 flex flex-col gap-3 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[var(--h)]" />
                    <div className="w-16 h-5 rounded-md bg-[var(--h)]" />
                  </div>
                  <div className="w-28 h-4 rounded bg-[var(--h)] mt-1" />
                  <div className="w-full h-8 rounded bg-[var(--h)]/60" />
                  <div className="w-20 h-4 rounded bg-[var(--h)]/40 mt-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {!isLoading && error && toolkits.length === 0 && (
            <div className="p-6 text-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex flex-col items-center gap-2">
              <p className="text-sm font-medium">
                Unable to load toolkit connectors.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="bt mt-2 text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty search or filter results */}
          {!isLoading && !error && displayedToolkits.length === 0 && (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-[var(--m)]">
              <Layers size={36} className="opacity-40 stroke-1" />
              <p className="text-sm font-medium text-[var(--i)]">
                {selectedCategory === "connected"
                  ? "No connected toolkits found"
                  : "No toolkit connectors found"}
              </p>
              <p className="text-xs max-w-sm">
                {selectedCategory === "connected"
                  ? "You have not connected any toolkits yet. Select 'All Categories' to connect third-party integrations with your agent."
                  : "No integrations matched your current filter criteria. Try broadening your search or selecting 'All Categories'."}
              </p>
              {(searchInput || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSelectedCategory("all");
                  }}
                  className="bt mt-3 text-xs"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}

          {/* Virtualized Grid of Toolkits */}
          {displayedToolkits.length > 0 && (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualRows.map((virtualRow) => {
                const startIndex = virtualRow.index * columns;
                const rowToolkits = displayedToolkits.slice(
                  startIndex,
                  startIndex + columns,
                );

                return (
                  <div
                    key={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="pb-3.5"
                  >
                    <div
                      className={`grid gap-3.5 ${
                        columns === 1
                          ? "grid-cols-1"
                          : columns === 2
                            ? "grid-cols-2"
                            : "grid-cols-3"
                      }`}
                    >
                      {rowToolkits.map((toolkit) => (
                        <ToolkitCard
                          key={toolkit.slug}
                          toolkit={toolkit}
                          connection={connectionsMap.get(
                            toolkit.slug.toLowerCase(),
                          )}
                          isActionPending={activeActionSlug === toolkit.slug}
                          onConnect={() => void handleConnect(toolkit.slug)}
                          onDisconnect={() => {
                            const conn = connectionsMap.get(
                              toolkit.slug.toLowerCase(),
                            );
                            if (conn) {
                              void handleDisconnect(conn.id, toolkit.slug);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite scroll loading indicator */}
          {isFetchingNextPage && selectedCategory !== "connected" && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-[var(--m)] font-medium">
              <Loader2
                size={16}
                className="animate-spin text-[var(--accent)]"
              />
              <span>Loading next 100 connectors from Redis...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--h)] bg-[var(--s)]/40 flex items-center justify-between text-xs text-[var(--m)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>
              Showing {displayedToolkits.length} of{" "}
              {selectedCategory === "connected"
                ? connectionsMap.size
                : totalItems || displayedToolkits.length}{" "}
              connectors
            </span>
          </div>
          <button type="button" onClick={onClose} className="bt p text-xs">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Individual Toolkit Card with Connect/Disconnect actions
interface ToolkitCardProps {
  toolkit: AvailableToolkit;
  connection?: UserConnection;
  isActionPending: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function ToolkitCard({
  toolkit,
  connection,
  isActionPending,
  onConnect,
  onDisconnect,
}: ToolkitCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const isConnected = Boolean(connection && connection.status === "ACTIVE");

  return (
    <div
      className={`group rounded-2xl border bg-[var(--bg)] p-4.5 flex flex-col justify-between transition-all duration-150 card-content-visibility ${
        isConnected
          ? "border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-xs"
          : "border-[var(--h)] hover:border-[var(--m)]/40 hover:shadow-xs"
      }`}
    >
      <div>
        {/* Top bar: Logo + Badges */}
        <div className="flex items-start justify-between gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--s)] border border-[var(--h)] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {toolkit.logo && !imgFailed ? (
              <img
                src={toolkit.logo}
                alt={toolkit.name}
                loading="lazy"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <span className="text-xs font-semibold text-[var(--i)] uppercase">
                {toolkit.name.slice(0, 2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isConnected && (
              <span className="badge-pill badge-pill-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            )}
            {/* Tools count badge */}
            {toolkit.toolsCount > 0 && (
              <span
                title={`${toolkit.toolsCount} available tools`}
                className="badge-pill font-mono"
              >
                <Wrench size={10} className="text-[var(--m)]" />
                {toolkit.toolsCount}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-[var(--i)] tracking-[-0.015em] truncate">
          {toolkit.name}
        </h3>

        {/* Category tags */}
        {toolkit.categories.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {toolkit.categories.slice(0, 2).map((cat, i) => (
              <span
                key={i}
                className="badge-pill uppercase text-[9px] tracking-wider font-semibold py-0.5"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-[var(--m)] mt-2 line-clamp-2 leading-relaxed">
          {toolkit.description ||
            "Integration toolkit available for agent actions."}
        </p>
      </div>

      {/* Bottom status and connection trigger button */}
      <div className="mt-4 pt-3 border-t border-[var(--h)] flex items-center justify-between gap-2 text-xs">
        {isConnected ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate text-xs">
              {connection?.displayName || "Connected"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0 text-[var(--m)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--m)]/40 shrink-0" />
            <span className="truncate text-xs">Ready to connect</span>
          </div>
        )}

        {isConnected ? (
          <button
            type="button"
            disabled={isActionPending}
            onClick={onDisconnect}
            title={`Disconnect ${toolkit.name}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 active:scale-[0.99] disabled:opacity-50 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            {isActionPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Unplug size={12} />
            )}
            <span>Disconnect</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isActionPending}
            onClick={onConnect}
            title={`Connect ${toolkit.name}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--p)] text-[var(--pt)] hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isActionPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Link2 size={12} />
            )}
            <span>Connect</span>
          </button>
        )}
      </div>
    </div>
  );
}
