"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export function toggleThemeWithAnimation(
  currentDarkMode: boolean,
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>,
  event?: React.MouseEvent<HTMLElement>,
) {
  const nextMode = !currentDarkMode;

  // Persist to storage and DOM elements
  const applyTheme = (isDark: boolean) => {
    setDarkMode(isDark);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("zuri-theme", isDark ? "dark" : "light");
      }
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", isDark);
        document.documentElement.setAttribute(
          "data-theme",
          isDark ? "dark" : "light",
        );
      }
    } catch {
      // Ignore in restricted storage environments
    }
  };

  // Check if View Transition API is supported and user hasn't requested reduced motion
  const hasViewTransition =
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (hasViewTransition) {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const docWithVT = document as unknown as {
      startViewTransition: (cb: () => void) => { ready: Promise<void> };
    };

    const transition = docWithVT.startViewTransition(() => {
      applyTheme(nextMode);
    });

    transition.ready.then(() => {
      // Expanding circular wave effect from the toggle point
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  } else {
    applyTheme(nextMode);
  }
}

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: (e?: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  size?: number;
  title?: string;
}

export function ThemeToggle({
  darkMode,
  onToggle,
  className = "",
  size = 18,
  title,
}: ThemeToggleProps) {
  const label = darkMode ? "Switch to white mode" : "Switch to black mode";

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      title={title || label}
      className={`relative inline-flex items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] p-2 transition-colors duration-200 cursor-pointer overflow-hidden ${className}`}
    >
      {/* Ambient background glow */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300 opacity-0 hover:opacity-100 ${
          darkMode ? "bg-sky-500/10" : "bg-amber-500/10"
        }`}
      />

      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.div
            key="moon"
            initial={{ rotate: -70, scale: 0.2, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 70, scale: 0.2, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 24,
            }}
            className="relative flex items-center justify-center text-sky-400"
          >
            <Moon
              size={size}
              className="drop-shadow-[0_0_6px_rgba(56,189,248,0.5)] transition-transform duration-200"
            />
            {/* Subtle twinkling night star */}
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 0.85],
              }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="absolute -top-1 -right-0.5 h-1.5 w-1.5 rounded-full bg-sky-200 shadow-[0_0_4px_rgba(186,230,253,0.8)]"
            />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 70, scale: 0.2, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -70, scale: 0.2, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 24,
            }}
            className="relative flex items-center justify-center text-amber-500"
          >
            <Sun
              size={size}
              className="drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] transition-transform duration-200"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
