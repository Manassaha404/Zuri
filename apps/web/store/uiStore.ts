import { create } from "zustand";
import { useEffect } from "react";
import { toggleThemeWithAnimation } from "@/components/ui/ThemeToggle";

export type ThemeMode = "dark" | "light";

export interface UIState {
  // Theme state: dark / light
  theme: ThemeMode;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: (event?: React.MouseEvent<HTMLElement>) => void;

  // Device / viewport state ("onMobileOrNot")
  isMobile: boolean;
  setIsMobile: (val: boolean) => void;

  // Mobile sidebar open state
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // Desktop sidebar collapsed state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebarCollapsed: () => void;
}

const getInitialDarkMode = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("zuri-theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
};

const getInitialIsMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 1024;
};

export const useUIStore = create<UIState>((set, get) => ({
  darkMode: getInitialDarkMode(),
  theme: getInitialDarkMode() ? "dark" : "light",
  isMobile: getInitialIsMobile(),
  sidebarOpen: false,
  sidebarCollapsed: false,

  setDarkMode: (val) => {
    const next = typeof val === "function" ? val(get().darkMode) : val;
    set({ darkMode: next, theme: next ? "dark" : "light" });
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("zuri-theme", next ? "dark" : "light");
      }
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next);
        document.documentElement.setAttribute(
          "data-theme",
          next ? "dark" : "light",
        );
      }
    } catch {
      // Ignore in restricted environments
    }
  },

  setTheme: (newTheme) => {
    get().setDarkMode(newTheme === "dark");
  },

  toggleTheme: (event) => {
    const current = get().darkMode;
    toggleThemeWithAnimation(
      current,
      (val) => {
        const next = typeof val === "function" ? val(current) : val;
        get().setDarkMode(next);
      },
      event,
    );
  },

  setIsMobile: (isMobile) => set({ isMobile }),

  setSidebarOpen: (val) => {
    const next = typeof val === "function" ? val(get().sidebarOpen) : val;
    set({ sidebarOpen: next });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),

  setSidebarCollapsed: (val) => {
    const next = typeof val === "function" ? val(get().sidebarCollapsed) : val;
    set({ sidebarCollapsed: next });
  },

  toggleSidebarCollapsed: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
}));

/**
 * Hook to automatically synchronize device detection (isMobile) and saved theme on mount
 */
export function useInitUIStore() {
  const setIsMobile = useUIStore((s) => s.setIsMobile);
  const setDarkMode = useUIStore((s) => s.setDarkMode);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initial responsive check
    const mql = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mql.matches);

    const handleResize = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mql.addEventListener("change", handleResize);

    // 2. Initial theme synchronization
    try {
      const stored = localStorage.getItem("zuri-theme");
      if (stored === "dark") {
        setDarkMode(true);
      } else if (stored === "light") {
        setDarkMode(false);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDarkMode(true);
      }
    } catch {
      // Ignore in restricted environments
    }

    return () => {
      mql.removeEventListener("change", handleResize);
    };
  }, [setIsMobile, setDarkMode]);
}
