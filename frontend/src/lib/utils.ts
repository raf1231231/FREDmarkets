import BN from "bn.js";

/** Decode a padded [u8; N] byte array to a trimmed UTF-8 string */
export function bytesToString(bytes: number[]): string {
  const end = bytes.indexOf(0);
  const slice = end === -1 ? bytes : bytes.slice(0, end);
  return new TextDecoder().decode(new Uint8Array(slice));
}

/** Convert basis points (0-10000) to a percentage string like "50.00%" */
export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(2) + "%";
}

/** Convert basis points to a USDC price string like "$0.50" */
export function bpsToPrice(bps: number): string {
  return "$" + (bps / 10000).toFixed(4);
}

/** Format USDC base units (6 decimals) to display string */
export function formatUsdc(baseUnits: number | BN): string {
  const val = typeof baseUnits === "number" ? baseUnits : baseUnits.toNumber();
  return "$" + (val / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format a unix timestamp (seconds) to a human-readable date */
export function formatTimestamp(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Shorten a base58 address: "Gak7...MBo" */
export function shortenAddress(address: string, chars = 4): string {
  return address.slice(0, chars) + "..." + address.slice(-chars);
}

/**
 * Extract the status key from an Anchor-serialized enum variant.
 * Anchor 0.30 serializes enums as { pending: {} } or { active: {} }.
 */
export function getMarketStatusKey(
  status: Record<string, unknown>
): string {
  return Object.keys(status)[0];
}

/** Capitalize the first letter of a status key */
export function getMarketStatusLabel(
  status: Record<string, unknown>
): string {
  const key = getMarketStatusKey(status);
  return key.charAt(0).toUpperCase() + key.slice(1);
}
