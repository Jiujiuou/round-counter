import { useMemo, useState } from 'react'
import { ArrowLeft, Crown, Medal, RotateCcw, Share2, Trophy } from 'lucide-react'
import { useRoom } from '@/hooks/useRoom'
import { Toast } from '@/components'
import { fmtAmount, fmtDiff, settle } from '@/utils/settlement'
import styles from '@/views/SettlementView/index.module.less'

function fmtDate(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function fmtHM(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDuration(start, end) {
  const ms = new Date(end) - new Date(start)
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} 分钟`
  const h = Math.floor(min / 60)
  return `${h} 小时 ${min % 60} 分`
}

const rankMedal = [
  { icon: Crown, cls: 'gold' },
  { icon: Medal, cls: 'silver' },
  { icon: Medal, cls: 'bronze' },
]

export default function SettlementView({ roomId, onBack, onRematch }) {
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
  const topScore = ranked.length ? ranked[0].total : 0
  const champions = ranked.filter((r) => r.total === topScore)

  const handleShare = async () => {
    const url = window.location.href
    const text = `「${room?.name}」结算结果：${champions.map((c) => c.name).join('、')} 夺冠`
    if (navigator.share) {
      try {
        await navigator.share({ title: room?.name, text, url })
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
      <header className={styles.topBar}>
        <button className={styles.iconBtn} onClick={onBack} aria-label="返回">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <button className={styles.iconBtn} onClick={handleShare} aria-label="分享">
          <Share2 size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className={styles.scroll}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.trophyWrap}>
            <Trophy size={34} strokeWidth={1.5} className={styles.trophy} />
          </div>
          <h1 className={styles.champion}>{champions.map((c) => c.name).join(' · ')}</h1>
          <div className={styles.championScore}>
            <span className="num">{fmtDiff(champions[0]?.total ?? 0)}</span> 分
          </div>
          <div className={styles.divider} />
          <div className={styles.meta}>
            <div className={styles.metaTitle}>
              {room.name} · {fmtDate(room.created_at)}
            </div>
            <div className={styles.metaSub}>
              {fmtHM(room.created_at)}
              {room.ended_at &&
                ` – ${fmtHM(room.ended_at)} · ${fmtDuration(room.created_at, room.ended_at)}`}
              {' · '}
              {rows.length} 轮
            </div>
          </div>
        </section>

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

        {/* 完整分数表 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>完整分数表</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.th} ${styles.stickyCol}`} />
                  {players.map((p) => (
                    <th key={p.id} className={styles.th}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.roundId}>
                    <td className={`${styles.td} ${styles.stickyCol} ${styles.roundNum}`}>
                      {row.roundNumber}
                    </td>
                    {players.map((p) => (
                      <td key={p.id} className={`${styles.td} num`}>
                        {row.scores[p.id] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className={`${styles.td} ${styles.stickyCol} ${styles.totalCell}`}>总</td>
                  {players.map((p) => (
                    <td key={p.id} className={`${styles.td} ${styles.totalCell} num`}>
                      {totalsArr.find((t) => t.playerId === p.id)?.total ?? 0}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
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
          <button className={styles.shareBtn} onClick={handleShare}>
            <Share2 size={18} strokeWidth={1.8} />
            <span>分享结果</span>
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
