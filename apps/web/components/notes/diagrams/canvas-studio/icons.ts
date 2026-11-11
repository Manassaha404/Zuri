"use client";

// Searchable icon catalogue combining Lucide React and Simple Icons
import React from "react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import * as SimpleIcons from "simple-icons";

export type IconSource = "lucide" | "simple-icons";

export interface IconItem {
  id: string;
  name: string;
  source: IconSource;
  category: string;
  slug?: string;
  hex?: string;
  path?: string;
  icon?: React.ComponentType<LucideProps>;
}

// Build Lucide icons array
const lucideItems: IconItem[] = Object.keys(LucideIcons)
  .filter((key) => {
    // Keep PascalCase names, exclude duplicates ending with "Icon" and internal utility exports
    return (
      key[0] === key[0]?.toUpperCase() &&
      !key.endsWith("Icon") &&
      key !== "LucideIcon" &&
      key !== "createLucideIcon" &&
      key !== "default" &&
      typeof (LucideIcons as Record<string, unknown>)[key] === "object"
    );
  })
  .map((key) => {
    const IconComp = (LucideIcons as Record<string, unknown>)[
      key
    ] as React.ComponentType<LucideProps>;

    // Categorize common Lucide icons
    let category = "UI & System";
    const lk = key.toLowerCase();
    if (
      lk.includes("server") ||
      lk.includes("database") ||
      lk.includes("harddrive") ||
      lk.includes("cpu") ||
      lk.includes("memory")
    ) {
      category = "Servers & Data";
    } else if (
      lk.includes("cloud") ||
      lk.includes("wifi") ||
      lk.includes("globe") ||
      lk.includes("network") ||
      lk.includes("radio")
    ) {
      category = "Cloud & Network";
    } else if (
      lk.includes("phone") ||
      lk.includes("laptop") ||
      lk.includes("monitor") ||
      lk.includes("tablet") ||
      lk.includes("tv")
    ) {
      category = "Devices";
    } else if (
      lk.includes("user") ||
      lk.includes("users") ||
      lk.includes("person") ||
      lk.includes("contact")
    ) {
      category = "People";
    } else if (
      lk.includes("lock") ||
      lk.includes("shield") ||
      lk.includes("key") ||
      lk.includes("security") ||
      lk.includes("eye")
    ) {
      category = "Security";
    } else if (
      lk.includes("chart") ||
      lk.includes("trending") ||
      lk.includes("dollar") ||
      lk.includes("credit") ||
      lk.includes("cart") ||
      lk.includes("briefcase")
    ) {
      category = "Business";
    } else if (
      lk.includes("code") ||
      lk.includes("terminal") ||
      lk.includes("git") ||
      lk.includes("bug") ||
      lk.includes("braces")
    ) {
      category = "Development";
    } else if (
      lk.includes("arrow") ||
      lk.includes("chevron") ||
      lk.includes("navigation") ||
      lk.includes("refresh") ||
      lk.includes("repeat")
    ) {
      category = "Arrows & UI";
    }

    return {
      id: `lucide:${key}`,
      name: key,
      source: "lucide",
      category,
      slug: lk,
      icon: IconComp,
    };
  });

// Build Simple Icons array (Brands, Tech, Architecture)
const simpleItems: IconItem[] = Object.keys(SimpleIcons)
  .filter(
    (key) =>
      key.startsWith("si") &&
      typeof (SimpleIcons as Record<string, unknown>)[key] === "object",
  )
  .map((key) => {
    const raw = (SimpleIcons as Record<string, unknown>)[key] as {
      title: string;
      slug: string;
      hex: string;
      path: string;
    };

    return {
      id: `si:${key}`,
      name: raw.title || key.replace(/^si/, ""),
      source: "simple-icons",
      category: "Tech & Brands",
      slug: raw.slug || key.toLowerCase(),
      hex: raw.hex,
      path: raw.path,
    };
  });

// Full combined catalogue (Simple Icons + Lucide React)
export const ICON_CATALOG: IconItem[] = [...simpleItems, ...lucideItems];

// Lookup index maps for fast O(1) icon retrieval
const ID_INDEX = new Map<string, IconItem>();
const NAME_INDEX = new Map<string, IconItem>();

ICON_CATALOG.forEach((item) => {
  ID_INDEX.set(item.id, item);
  if (!NAME_INDEX.has(item.name.toLowerCase())) {
    NAME_INDEX.set(item.name.toLowerCase(), item);
  }
  if (item.slug && !NAME_INDEX.has(item.slug.toLowerCase())) {
    NAME_INDEX.set(item.slug.toLowerCase(), item);
  }
  // Also register raw key (e.g. "Server", "siReact")
  const rawKey = item.id.replace(/^(lucide|si):/, "");
  if (!NAME_INDEX.has(rawKey.toLowerCase())) {
    NAME_INDEX.set(rawKey.toLowerCase(), item);
  }
});

// Resolve icon by id or name
export function getIconItem(idOrName?: string): IconItem | undefined {
  if (!idOrName) return undefined;
  return ID_INDEX.get(idOrName) || NAME_INDEX.get(idOrName.toLowerCase());
}
