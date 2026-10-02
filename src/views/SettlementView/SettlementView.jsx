import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useRoom } from '@/hooks/useRoom'
import { Toast } from '@/components'
import { fmtAmount, fmtDiff, settle } from '@/utils/settlement'
import { touchRoom } from '@/utils/roomStorage'
import styles from '@/views/SettlementView/index.module.less'

/** 展示一位小数（平均/最低/最高分） */
function fmt1(v) {
  return v.toFixed(1)
}

export default function SettlementView({ roomId, onRematch, onShare }) {
  const { loading, room, players, rows, toast } = useRoom(roomId)
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

  const { rows: settledRows, transfers, avg } = useMemo(() => settle(totalsArr), [totalsArr])
  const ranked = useMemo(() => [...settledRows].sort((a, b) => b.total - a.total), [settledRows])

  const minTotal = ranked.length > 0 ? ranked[ranked.length - 1].total : 0
  const maxTotal = ranked.length > 0 ? ranked[0].total : 0
  // 基准线在最低~最高区间内的位置（百分比）
  const avgPct = maxTotal > minTotal ? ((avg - minTotal) / (maxTotal - minTotal)) * 100 : 50

  // 已结束房间直达本页（不经过房间页），在此同步本地列表快照
  useEffect(() => {
    if (room && players.length > 0) {
      touchRoom({
        id: room.id,
        name: room.name,
        status: room.status,
        playerCount: players.length,
        playersSnapshot: totalsArr.map((t) => ({ name: t.name, total: t.total })),
        roundCount: rows.length,
        createdAt: room.created_at,
        endedAt: room.ended_at,
      })
    }
  }, [room, players, rows, totalsArr])

  const handleRematch = async () => {
    setRematching(true)
    await onRematch(
      room?.name,
      players.map((p) => p.name),
    )
    setRematching(false)
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
      <div className={styles.scroll}>
        {/* 人均分水岭 */}
        <section className={styles.avgCard}>
          <span className={styles.avgLabel}>全场平均基准分</span>
          <div className={styles.avgRow}>
            <span className={styles.avgValue}>{fmt1(avg)}</span>
            <span className={styles.avgUnit}>分/人</span>
          </div>
          <div className={styles.scale}>
            <div className={styles.scaleTrack}>
              <div className={styles.scaleFill} style={{ width: `${avgPct}%` }} />
            </div>
            <div
              className={styles.scaleMarker}
              style={{ left: `clamp(28px, ${avgPct}%, calc(100% - 28px))` }}
            >
              <span className={styles.scaleTag}>基准 {fmt1(avg)}</span>
              <span className={styles.scaleTick} />
            </div>
          </div>
          <div className={styles.scaleRange}>
            <span>最低 {fmt1(minTotal)}</span>
            <span>最高 {fmt1(maxTotal)}</span>
          </div>
        </section>

        {/* 计分与差值 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>计分与差值</span>
            <span className={styles.sectionMeta}>按总分排序</span>
          </div>
          <div className={styles.playerList}>
            {ranked.map((r, idx) => (
              <div key={r.playerId} className={styles.playerCard}>
                <div className={styles.playerLeft}>
                  <span className={`${styles.rankNo} ${idx === 0 ? styles.rankNoFirst : ''}`}>
                    {idx + 1}
                  </span>
                  <div className={styles.playerInfo}>
                    <span
                      className={`${styles.playerName} ${idx === 0 ? styles.playerNameFirst : ''}`}
                    >
                      {r.name}
                    </span>
                    <span className={styles.playerTotal}>总计 {fmtAmount(r.total)} 分</span>
                  </div>
                </div>
                <div className={styles.playerRight}>
                  <span className={`${styles.diffValue} ${idx === 0 ? styles.diffFirst : ''}`}>
                    {fmtDiff(r.diff)}
                  </span>
                  <span className={`${styles.diffLabel} ${idx === 0 ? styles.diffLabelFirst : ''}`}>
                    {r.diff > 0 ? '高于平均' : r.diff < 0 ? '低于平均' : '持平'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 结算清单 */}
        <section className={styles.settleCard}>
          <div className={styles.settleHead}>
            <span className={styles.sectionTitle}>结算</span>
            <span className={styles.countBadge}>共 {transfers.length} 笔</span>
          </div>
          {transfers.length === 0 ? (
            <div className={styles.noDebt}>本局无欠款</div>
          ) : (
            <div className={styles.transferList}>
              {transfers.map((t, i) => (
                <div key={i} className={styles.transferRow}>
                  <div className={styles.transferParties}>
                    <span className={styles.party}>{t.from}</span>
                    <ArrowRight size={16} strokeWidth={1.8} className={styles.transferArrow} />
                    <span className={styles.party}>{t.to}</span>
                  </div>
                  <div className={styles.transferAmount}>
                    <span className={styles.amountValue}>{fmtAmount(t.amount)}</span>
                    <span className={styles.amountUnit}>分</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 底部操作 */}
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={onShare}>
            生成对局战报
          </button>
          <button className={styles.secondaryBtn} onClick={handleRematch} disabled={rematching}>
            {rematching ? '创建中…' : '开启新对局'}
          </button>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  )
}
