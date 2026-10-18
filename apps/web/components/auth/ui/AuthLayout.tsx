"use client";

import React from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUIStore, useInitUIStore } from "@/store/uiStore";

interface AuthLayoutProps {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  theme?: "light" | "dark";
}

export function AuthLayout({ children }: AuthLayoutProps) {
  useInitUIStore();
  const { darkMode, toggleTheme } = useUIStore();

  const themeClass = darkMode ? "D dark" : "L";

  return (
    <main
      className={`${themeClass} w relative flex flex-col justify-center items-center min-h-screen px-4 py-16`}
    >
      {/* Top right theme toggle */}
      <div className="absolute top-0 right-0 p-4 sm:p-6 z-20">
        <ThemeToggle
          darkMode={darkMode}
          onToggle={toggleTheme}
          size={18}
          className="w-9 h-9"
        />
      </div>

      {/* Main card/content container */}
      <div className="w-full flex justify-center items-center relative z-10 pt-4">
        {children}
      </div>
    </main>
  );
}
