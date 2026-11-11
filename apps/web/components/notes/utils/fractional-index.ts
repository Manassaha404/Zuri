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

// Sort items by fractional position string
export function sortByPosition<T extends { position: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) =>
    a.position < b.position ? -1 : a.position > b.position ? 1 : 0,
  );
}
