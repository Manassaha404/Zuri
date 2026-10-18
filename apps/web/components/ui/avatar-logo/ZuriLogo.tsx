import React from "react";
import definition from "./zuri.avatar.json";

interface ZuriLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function ZuriLogo({
  size = 32,
  className = "",
  ...props
}: ZuriLogoProps) {
  const bodyColor = definition.colors?.body || "#3b82f6";
  const eyeColor = definition.colors?.eyes || "#0b1220";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={definition.name || "Zuri"}
      className={className}
      {...props}
    >
      <path
        d="M32 5c15 0 27 10 27 27 0 15-11 27-27 27S5 47 5 32C5 15 17 5 32 5z"
        fill={bodyColor}
      />
      <circle cx="23" cy="30" r="3.2" fill={eyeColor} />
      <circle cx="41" cy="30" r="3.2" fill={eyeColor} />
      <path
        d="M27 40q5 5 10 0"
        stroke={eyeColor}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
