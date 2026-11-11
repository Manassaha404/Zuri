import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ZuriLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function ZuriLogo({
  size = 36,
  className = "",
  priority = false,
}: ZuriLogoProps) {
  return (
    <Image
      src="/logo.jpeg"
      alt="Zuri"
      width={size}
      height={size}
      priority={priority}
      className="w-full h-full object-fill "
    />
  );
}
