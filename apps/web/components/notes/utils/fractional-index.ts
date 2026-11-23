// Fractional index utility for custom ordering without shifting rows

// Generates an intermediate position string between prev and next
export function generatePositionBetween(
  prev?: string | null,
  next?: string | null,
): string {
  // If neither exists, start at base "a0"
  if (!prev && !next) return "a0";

  // If appending after prev
  if (prev && !next) {
    const lastChar = prev.charAt(prev.length - 1);
    if (lastChar && lastChar < "z") {
      return (
        prev.slice(0, -1) + String.fromCharCode(lastChar.charCodeAt(0) + 1)
      );
    }
    return prev + "0";
  }

  // If prepending before next
  if (!prev && next) {
    const firstChar = next.charAt(0);
    if (firstChar && firstChar > "a") {
      return String.fromCharCode(firstChar.charCodeAt(0) - 1) + next.slice(1);
    }
    return "0" + next;
  }

  // If inserting between prev and next
  if (prev && next) {
    if (prev >= next) {
      return prev + "V";
    }
    // Find midpoint character
    let commonPrefix = "";
    const minLen = Math.min(prev.length, next.length);
    let diffIndex = -1;

    for (let i = 0; i < minLen; i++) {
      const charP = prev.charAt(i);
      const charN = next.charAt(i);
      if (charP === charN) {
        commonPrefix += charP;
      } else {
        diffIndex = i;
        break;
      }
    }

    if (diffIndex !== -1) {
      const codeP = prev.charCodeAt(diffIndex);
      const codeN = next.charCodeAt(diffIndex);
      if (codeN - codeP > 1) {
        const midCode = Math.floor((codeP + codeN) / 2);
        return commonPrefix + String.fromCharCode(midCode);
      }
    }

    return prev + "V";
  }

  return "a0";
}

// Sort items by fractional position string with natural alphanumeric ordering and creation time tie-breaking
export function sortByPosition<
  T extends { position: string; createdAt?: string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // 1. Natural alphanumeric ordering (ensures "a2" comes before "a10", "a11", etc.)
    const cmp = a.position.localeCompare(b.position, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    if (cmp !== 0) return cmp;

    // 2. Creation time tie-breaker for duplicate positions (e.g. multiple "a0" blocks)
    if (a.createdAt && b.createdAt) {
      return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
    }
    return 0;
  });
}
