import { useMemo } from 'react'
import { Share2 } from 'lucide-react'
import { useRoom } from '@/hooks/useRoom'
import { fmtDiff, settle } from '@/utils/settlement'
import { Toast } from '@/components'
import styles from '@/views/ShareView/index.module.less'

const CN_DIGITS = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 1-99 转中文数字，超出范围回退阿拉伯数字 */
function toCnNum(n) {
  if (!Number.isInteger(n) || n < 1 || n > 99) return String(n)
  if (n < 10) return CN_DIGITS[n - 1]
  const ten = Math.floor(n / 10)
  const one = n % 10
  const tensPart = ten === 1 ? '十' : `${CN_DIGITS[ten - 1]}十`
  return one === 0 ? tensPart : `${tensPart}${CN_DIGITS[one - 1]}`
}

/** 「四十五分钟」/「两小时十五分钟」/「不足一分钟」 */
function fmtDurationCn(createdAt, endedAt) {
  if (!createdAt || !endedAt) return null
  const mins = Math.round((new Date(endedAt) - new Date(createdAt)) / 60000)
  if (mins < 1) return '不足一分钟'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${toCnNum(mins)}分钟`
  return m === 0 ? `${toCnNum(h)}小时` : `${toCnNum(h)}小时${toCnNum(m)}分钟`
}

export default function ShareView({ roomId }) {
  const { loading, room, players, rows, toast, showToast } = useRoom(roomId)

  const totalsArr = useMemo(
    () =>
      players.map((p) => ({
        playerId: p.id,
        name: p.name,
        total: rows.reduce((s, r) => s + (r.scores[p.id] ?? 0), 0),
      })),
    [players, rows],
  )

  const { rows: settledRows } = useMemo(() => settle(totalsArr), [totalsArr])
  const ranked = useMemo(() => [...settledRows].sort((a, b) => b.total - a.total), [settledRows])

  const winner = ranked[0]
  const seats = ranked.slice(1)

  const duration = room ? fmtDurationCn(room.created_at, room.ended_at) : null
  const metaText = `${toCnNum(rows.length)}轮已竞${duration ? ` · ${duration}` : ''}`

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: room?.name || '对局战报', url })
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
        showToast('链接已复制')
      } catch {
        showToast('复制失败')
      }
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
      <div className={styles.scroll}>
        {/* 战报海报 */}
        <div className={styles.poster}>
          <div className={styles.divider} />
          <div className={styles.posterHead}>
            <h1 className={styles.posterTitle}>对局战报</h1>
            <span className={styles.posterMeta}>{metaText}</span>
          </div>

          {/* 头名 */}
          {winner && (
            <div className={styles.winnerBlock}>
              <div className={styles.winnerLeft}>
                <div className={styles.winnerTags}>
                  <span className={styles.winnerBadge}>头名</span>
                  <span className={styles.winnerSub}>本场胜家</span>
                </div>
                <span className={styles.winnerName}>{winner.name}</span>
              </div>
              <span className={styles.winnerScore}>{fmtDiff(winner.total)}</span>
            </div>
          )}

          {/* 全员终局席位 */}
          {seats.length > 0 && (
            <div className={styles.seats}>
              <div className={styles.seatsLabel}>全员终局席位</div>
              <div className={styles.seatList}>
                {seats.map((r, idx) => (
                  <div key={r.playerId} className={styles.seatRow}>
                    <div className={styles.seatLeft}>
                      <span className={styles.seatNo}>{toCnNum(idx + 2)}</span>
                      <span className={styles.seatName}>{r.name}</span>
                    </div>
                    <span
                      className={`${styles.seatScore} ${r.total < 0 ? styles.seatScoreNeg : ''}`}
                    >
                      {fmtDiff(r.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 操作 */}
        <div className={styles.actions}>
          <button className={styles.shareBtn} onClick={handleShare}>
            <Share2 size={16} strokeWidth={1.8} />
            <span>分享至微信好友与群聊</span>
          </button>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  )
}
