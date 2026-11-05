export const MAX_QTY = 99

export function clampQty(value: number) {
  const qty = Math.round(Number(value))
  if (!Number.isFinite(qty)) return 1
  return Math.min(MAX_QTY, Math.max(1, qty))
}
