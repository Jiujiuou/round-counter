/**
 * 结算算法（PRD 第 6 节）
 * 计算在 ×n 整数空间进行（Dᵢ = Tᵢ×n − ΣT），避免浮点误差；展示时 ÷n，支持 0.5 精度。
 */

/** totals: [{ playerId, name, total }] → 每人差值与转账清单 */
export function settle(totals) {
  const n = totals.length
  if (n === 0) return { rows: [], transfers: [], avg: 0 }

  const sum = totals.reduce((s, t) => s + t.total, 0)
  const avg = sum / n

  // D = T×n − ΣT（整数），正负即水上水下
  const rows = totals.map((t) => ({
    ...t,
    diff: t.total - avg, // 展示用
    D: t.total * n - sum, // 整数空间
  }))

  const debtors = rows
    .filter((r) => r.D < 0)
    .map((r) => ({ ...r, left: -r.D }))
    .sort((a, b) => b.left - a.left)
  const creditors = rows
    .filter((r) => r.D > 0)
    .map((r) => ({ ...r, left: r.D }))
    .sort((a, b) => b.left - a.left)

  const transfers = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]
    const c = creditors[j]
    const amount = Math.min(d.left, c.left)
    transfers.push({ from: d.name, to: c.name, amount: amount / n })
    d.left -= amount
    c.left -= amount
    if (d.left === 0) i += 1
    if (c.left === 0) j += 1
  }

  return { rows, transfers, avg }
}

/** 展示金额：整数显示整数，否则保留一位小数（0.5 精度） */
export function fmtAmount(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

/** 带符号展示差值 */
export function fmtDiff(v) {
  const s = fmtAmount(Math.abs(v))
  if (v > 0) return `+${s}`
  if (v < 0) return `-${s}`
  return '0'
}
