import { useMemo, useState } from 'react'
import { ArrowLeft, Crown, Medal, RotateCcw } from 'lucide-react'
import { useRoom } from '@/hooks/useRoom'
import { Toast } from '@/components'
import { fmtAmount, fmtDiff, settle } from '@/utils/settlement'
import styles from '@/views/SettlementView/index.module.less'

const rankMedal = [
  { icon: Crown, cls: 'gold' },
  { icon: Medal, cls: 'silver' },
  { icon: Medal, cls: 'bronze' },
]

export default function SettlementView({ roomId, onBack, onRematch, onShare }) {
  const { loading, room, players, rows, toast, showToast } = useRoom(roomId)
  const [rematching, setRematching] = useState(false)

  const totalsArr = useMemo(
    () =>
      players.map((p) => ({
        playerId: p.id,
        name: p.name,
        total: rows.reduce((s, r) => s + (r.scores[p.id] ?? 0), 0),
      })),
    [players, rows],
  )

  const { rows: settledRows, transfers } = useMemo(() => settle(totalsArr), [totalsArr])
  const ranked = useMemo(() => [...settledRows].sort((a, b) => b.total - a.total), [settledRows])

  const handleRematch = async () => {
    setRematching(true)
    await onRematch(
      room?.name,
      players.map((p) => p.name),
    )
    setRematching(false)
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('链接已复制')
    } catch {
      showToast('复制失败')
    }
  }

  if (loading || !room) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>加载中…</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.iconBtn} onClick={onBack} aria-label="返回">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <div className={styles.headerTitle}>结算</div>
        <button className={styles.iconBtn} onClick={handleCopyUrl} aria-label="复制链接">
          <span className={styles.copyLabel}>复制链接</span>
        </button>
      </header>

      <div className={styles.scroll}>
        {/* 最终排名 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>最终排名</h2>
          <div className={styles.rankList}>
            {ranked.map((r, idx) => {
              const medal = rankMedal[idx]
              const MedalIcon = medal?.icon
              return (
                <div key={r.playerId} className={styles.rankRow}>
                  <div className={styles.rankLeft}>
                    {MedalIcon ? (
                      <MedalIcon size={20} strokeWidth={1.8} className={styles[medal.cls]} />
                    ) : (
                      <span className={styles.rankNo}>{idx + 1}</span>
                    )}
                    <span className={styles.rankName}>{r.name}</span>
                  </div>
                  <div className={styles.rankRight}>
                    <span className={`${styles.rankScore} num`}>{fmtAmount(r.total)} 分</span>
                    <span
                      className={`${styles.rankDiff} num ${
                        r.diff > 0 ? styles.up : r.diff < 0 ? styles.down : styles.flat
                      }`}
                    >
                      {r.diff === 0 ? '平' : `${fmtDiff(r.diff)} ${r.diff > 0 ? '水上' : '水下'}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 结算清单 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>结算清单</h2>
          {transfers.length === 0 ? (
            <div className={styles.noDebt}>本局无欠款</div>
          ) : (
            <div className={styles.transferList}>
              {transfers.map((t, i) => (
                <div key={i} className={styles.transferRow}>
                  <span className={styles.from}>{t.from}</span>
                  <span className={styles.transferArrow}>→</span>
                  <span className={styles.to}>{t.to}</span>
                  <span className={`${styles.amount} num`}>{fmtAmount(t.amount)} 分</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 操作区 */}
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={onShare}>
            生成排行榜
          </button>
          <button className={styles.rematchBtn} onClick={handleRematch} disabled={rematching}>
            <RotateCcw size={18} strokeWidth={1.8} />
            <span>{rematching ? '创建中…' : '再来一局'}</span>
          </button>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  )
}
