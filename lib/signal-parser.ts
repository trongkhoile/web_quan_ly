export type TradeSignal =
  | { action: "BUY" | "SELL"; symbol: string; entry?: number; sl?: number; tp?: number; lot: number }
  | { action: "CLOSE"; symbol: string };

/**
 * Format tín hiệu hỗ trợ:
 *
 * BUY XAUUSD         (hoặc SELL)
 * Entry: 2300.00     (tuỳ chọn)
 * SL: 2280.00        (tuỳ chọn)
 * TP: 2350.00        (tuỳ chọn)
 * Lot: 0.01
 *
 * CLOSE XAUUSD
 */
export function parseSignal(text: string): TradeSignal | null {
  const clean = text.trim().replace(/[🟢🔴❌📍🛑🎯📦]/g, "").trim();
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) return null;

  const firstLine = lines[0].toUpperCase();

  // CLOSE signal
  const closeMatch = firstLine.match(/^CLOSE\s+([A-Z0-9]+)$/);
  if (closeMatch) {
    return { action: "CLOSE", symbol: closeMatch[1] };
  }

  // BUY / SELL signal
  const orderMatch = firstLine.match(/^(BUY|SELL)\s+([A-Z0-9]+)$/);
  if (!orderMatch) return null;

  const action = orderMatch[1] as "BUY" | "SELL";
  const symbol = orderMatch[2];

  const getValue = (key: string): number | undefined => {
    const line = lines.find((l) => l.toUpperCase().startsWith(key + ":"));
    if (!line) return undefined;
    const val = parseFloat(line.split(":")[1].trim());
    return isNaN(val) ? undefined : val;
  };

  const lot = getValue("LOT") ?? 0.01;

  return {
    action,
    symbol,
    entry: getValue("ENTRY"),
    sl: getValue("SL"),
    tp: getValue("TP"),
    lot,
  };
}
