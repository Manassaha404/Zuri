import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ZuriLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function ZuriLogo({
  size = 32,
  className = "",
  priority = false,
}: ZuriLogoProps) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden bg-[#101010] border border-[var(--h)] shadow-xs select-none",
        className,
      )}
    >
      <Image
        src="/logo.jpeg"
        alt="Zuri"
        width={size}
        height={size}
        priority={priority}
        className="w-full h-full object-cover"
      />
    </span>
  );
}

