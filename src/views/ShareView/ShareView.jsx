import { useMemo } from 'react'
import { ArrowLeft, Crown, Share2 } from 'lucide-react'
import { useRoom } from '@/hooks/useRoom'
import { nameToHsl, nameInitial } from '@/utils/colorHash'
import { fmtAmount, fmtDiff, settle } from '@/utils/settlement'
import { Toast } from '@/components'
import styles from '@/views/ShareView/index.module.less'

function fmtDate(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function fmtHM(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function ShareView({ roomId, onBack }) {
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

  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  // 展示最近最多 5 轮
  const previewRounds = rows.slice(0, 5)
  const hasMoreRounds = rows.length > 5

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: room?.name || '计分板', url })
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
      <header className={styles.topBar}>
        <button className={styles.iconBtn} onClick={onBack} aria-label="返回">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <button className={styles.iconBtn} onClick={handleShare} aria-label="分享">
          <Share2 size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className={styles.scroll}>
        {/* 标题区 */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>{room.name}</h1>
          <p className={styles.heroSub}>
            {fmtDate(room.created_at)} · {rows.length} 轮 · {fmtHM(room.created_at)}
            {room.ended_at && ` – ${fmtHM(room.ended_at)}`}
          </p>
        </div>

        {/* 领奖台 */}
        {top3.length > 0 && (
          <div className={styles.podium}>
            {top3[1] && (
              <div className={`${styles.podiumItem} ${styles.second}`}>
                <div className={styles.podiumName}>{top3[1].name}</div>
                <div className={`${styles.podiumScore} num`}>{fmtAmount(top3[1].total)}</div>
                <div
                  className={`${styles.podiumDiff} num ${top3[1].diff >= 0 ? styles.up : styles.down}`}
                >
                  {fmtDiff(top3[1].diff)}
                </div>
                <div
                  className={styles.podiumAvatar}
                  style={{ background: nameToHsl(top3[1].name) }}
                >
                  <span>{nameInitial(top3[1].name)}</span>
                </div>
                <div className={styles.podiumBase}>2</div>
              </div>
            )}
            {top3[0] && (
              <div className={`${styles.podiumItem} ${styles.first}`}>
                <Crown size={18} strokeWidth={2} className={styles.crown} />
                <div className={styles.podiumName}>{top3[0].name}</div>
                <div className={`${styles.podiumScore} num`}>{fmtAmount(top3[0].total)}</div>
                <div
                  className={`${styles.podiumDiff} num ${top3[0].diff >= 0 ? styles.up : styles.down}`}
                >
                  {fmtDiff(top3[0].diff)}
                </div>
                <div
                  className={styles.podiumAvatar}
                  style={{ background: nameToHsl(top3[0].name) }}
                >
                  <span>{nameInitial(top3[0].name)}</span>
                </div>
                <div className={styles.podiumBase}>1</div>
              </div>
            )}
            {top3[2] && (
              <div className={`${styles.podiumItem} ${styles.third}`}>
                <div className={styles.podiumName}>{top3[2].name}</div>
                <div className={`${styles.podiumScore} num`}>{fmtAmount(top3[2].total)}</div>
                <div
                  className={`${styles.podiumDiff} num ${top3[2].diff >= 0 ? styles.up : styles.down}`}
                >
                  {fmtDiff(top3[2].diff)}
                </div>
                <div
                  className={styles.podiumAvatar}
                  style={{ background: nameToHsl(top3[2].name) }}
                >
                  <span>{nameInitial(top3[2].name)}</span>
                </div>
                <div className={styles.podiumBase}>3</div>
              </div>
            )}
          </div>
        )}

        {/* 剩余排名 */}
        {rest.length > 0 && (
          <div className={styles.card}>
            {rest.map((r, idx) => (
              <div key={r.playerId} className={styles.rankRow}>
                <div className={styles.rankLeft}>
                  <span className={styles.rankNo}>{idx + 4}</span>
                  <div className={styles.rankAvatar} style={{ background: nameToHsl(r.name) }}>
                    <span>{nameInitial(r.name)}</span>
                  </div>
                  <span className={styles.rankName}>{r.name}</span>
                </div>
                <div className={styles.rankRight}>
                  <span className={`${styles.rankScore} num`}>{fmtAmount(r.total)}</span>
                  <span
                    className={`${styles.rankDiff} num ${r.diff >= 0 ? styles.up : styles.down}`}
                  >
                    {fmtDiff(r.diff)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 对局回顾 */}
        {previewRounds.length > 0 && (
          <div className={styles.roundCard}>
            <h3 className={styles.roundTitle}>对局回顾</h3>
            <div className={styles.roundWrap}>
              <table className={styles.roundTable}>
                <thead>
                  <tr>
                    <th className={`${styles.roundTh} ${styles.roundStickyCol}`} />
                    {players.map((p) => (
                      <th key={p.id} className={styles.roundTh}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRounds.map((row) => (
                    <tr key={row.roundId}>
                      <td className={`${styles.roundTd} ${styles.roundStickyCol}`}>
                        {row.roundNumber}
                      </td>
                      {players.map((p) => (
                        <td key={p.id} className={`${styles.roundTd} num`}>
                          {row.scores[p.id] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMoreRounds && (
              <div className={styles.roundFade}>
                <span>还有 {rows.length - 5} 轮对局</span>
              </div>
            )}
          </div>
        )}

        {/* 底部提示 */}
        <div className={styles.footerHint}>
          <p>长按可保存截图分享</p>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  )
}
