
export function uuidToNumber(uuid: string): string {
  const hexStr = uuid.replace(/-/g, "");
  return BigInt("0x" + hexStr).toString(10);
}

export function numberToUuid(num: string | bigint): string {
  if (typeof num === "string" && num.includes("-")) {
    return num;
  }
  let hexStr = BigInt(num).toString(16);
  hexStr = hexStr.padStart(32, "0");
  return [
    hexStr.substring(0, 8),
    hexStr.substring(8, 12),
    hexStr.substring(12, 16),
    hexStr.substring(16, 20),
    hexStr.substring(20, 32),
  ].join("-");
}
