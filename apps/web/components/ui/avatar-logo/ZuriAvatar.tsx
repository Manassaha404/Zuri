"use client";

/**
 * ZuriAvatar — animated avatar using @bible-strong/avatar-react.
 *
 * Uses next/dynamic with ssr:false so the library (which calls window /
 * useLayoutEffect / requestAnimationFrame at module load) never runs on the
 * server. ajv is marked as serverExternalPackages in next.config.js so Next.js
 * does not attempt to bundle it server-side.
 *
 * Animation keys (from zuri.avatar.json animationOrder):
 *   "sleeping" | "waking" | "idle" | "listening" | "thinking" | "searching" |
 *   "working" | "excited" | "bored" | "suspicious" | "angry" | "drowsy" |
 *   "happy" | "curious" | "confused" | "surprised" | "proud" | "shy" |
 *   "sad" | "laughing" | "scared" | "playful" | "celebrate" | "greet"
 */

import dynamic from "next/dynamic";
import type { ZuriAvatarInnerProps } from "./ZuriAvatarInner";
import definition from "./zuri.avatar.json";

function Skeleton({ size = 32 }: Pick<ZuriAvatarInnerProps, "size">) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: px,
        height: px,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${definition.colors?.body || "#5b7fe5"}, #3a5fd6)`,
        flexShrink: 0,
      }}
    />
  );
}

const ZuriAvatarDynamic = dynamic(
  () =>
    import("./ZuriAvatarInner").then((m) => ({ default: m.ZuriAvatarInner })),
  { ssr: false, loading: () => <Skeleton /> },
);

export function ZuriAvatar(props: ZuriAvatarInnerProps) {
  return <ZuriAvatarDynamic {...props} />;
}

export type { ZuriAvatarInnerProps as ZuriAvatarProps };
