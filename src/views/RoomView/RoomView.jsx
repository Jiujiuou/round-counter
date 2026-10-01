import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Plus, Share2 } from 'lucide-react'
import { useRoom } from '@/hooks/useRoom'
import { Sheet, Dialog, Toast } from '@/components'
import { touchRoom } from '@/utils/roomStorage'
import styles from '@/views/RoomView/index.module.less'

function fmtScore(v) {
  if (v == null) return ''
  return String(v)
}

export default function RoomView({ roomId, onBack, onFinish }) {
  const {
    loading,
    room,
    players,
    rows,
    totals,
    toast: hookToast,
    netError,
    showToast,
    addPlayer,
    saveRound,
    updateScore,
    deleteRound,
    finishRoom,
  } = useRoom(roomId)

  const [roundSheet, setRoundSheet] = useState(false)
  const [roundInputs, setRoundInputs] = useState({})
  const [editOpen, setEditOpen] = useState(false)
  const [editRoundId, setEditRoundId] = useState(null)
  const [editPlayerId, setEditPlayerId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editNeg, setEditNeg] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteRoundId, setDeleteRoundId] = useState(null)
  const [endOpen, setEndOpen] = useState(false)
  const [addPlayerSheet, setAddPlayerSheet] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [longPressTimer, setLongPressTimer] = useState(null)

  const isFinished = room?.status === 'finished'

  useEffect(() => {
    if (room) {
      touchRoom({ id: room.id, name: room.name, status: room.status, playerCount: players.length })
    }
  }, [room, players.length])

  useEffect(() => {
    if (isFinished) {
      onFinish(roomId)
    }
  }, [isFinished, roomId, onFinish])

  const openRoundSheet = () => {
    const init = {}
    players.forEach((p) => (init[p.id] = ''))
    setRoundInputs(init)
    setRoundSheet(true)
  }

  const setRoundInput = (pid, v) => {
    const clean = v.replace(/(?!^-)[^0-9]/g, '')
    setRoundInputs((prev) => ({ ...prev, [pid]: clean }))
  }

  const toggleSign = (pid) => {
    setRoundInputs((prev) => {
      const cur = prev[pid] ?? ''
      return { ...prev, [pid]: cur.startsWith('-') ? cur.slice(1) : `-${cur}` }
    })
  }

  const handleSaveRound = async () => {
    const map = {}
    players.forEach((p) => {
      const v = roundInputs[p.id]?.trim()
      if (v !== '') {
        const n = parseInt(v, 10)
        if (!Number.isNaN(n)) map[p.id] = n
      }
    })
    const res = await saveRound(map)
    if (res.ok) setRoundSheet(false)
  }

  const openEdit = (roundId, playerId, current) => {
    if (isFinished) return
    const s = current != null ? String(Math.abs(current)) : ''
    setEditRoundId(roundId)
    setEditPlayerId(playerId)
    setEditValue(s)
    setEditNeg(current != null && current < 0)
    setEditOpen(true)
  }

  const confirmEdit = async () => {
    const v = editValue.trim()
    let score = null
    if (v !== '') {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n)) score = editNeg ? -n : n
    }
    const res = await updateScore(editRoundId, editPlayerId, score)
    if (res.ok) setEditOpen(false)
  }

  const startLongPress = (roundId) => {
    if (isFinished) return
    const t = setTimeout(() => {
      setDeleteRoundId(roundId)
      setDeleteOpen(true)
    }, 600)
    setLongPressTimer(t)
  }
  const cancelLongPress = () => {
    if (longPressTimer) clearTimeout(longPressTimer)
    setLongPressTimer(null)
  }

  const confirmDelete = async () => {
    const res = await deleteRound(deleteRoundId)
    if (res.ok) setDeleteOpen(false)
  }

  const handleEnd = async () => {
    const res = await finishRoom()
    if (res.ok) {
      setEndOpen(false)
      onFinish(roomId)
    }
  }

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

  const handleAddPlayer = async () => {
    const n = newPlayerName.trim()
    if (!n) return
    if (players.some((p) => p.name === n)) {
      showToast('玩家名已存在')
      return
    }
    const res = await addPlayer(n)
    if (res.ok) {
      setAddPlayerSheet(false)
      setNewPlayerName('')
    }
  }

  const cellMinW = useMemo(() => {
    const base = players.length <= 4 ? 90 : players.length <= 6 ? 76 : 64
    return base
  }, [players.length])

  const tableWidth = `max(100%, ${40 + players.length * cellMinW}px)`

  // 主表格与固定总分行横向滚动同步
  const tableRef = useRef(null)
  const totalRef = useRef(null)
  const syncScroll = (from, to) => {
    if (to.current && from.current && to.current.scrollLeft !== from.current.scrollLeft) {
      to.current.scrollLeft = from.current.scrollLeft
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>加载中…</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <p>房间不存在或已被删除</p>
          <button className={styles.primaryBtn} onClick={onBack}>
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {netError && <div className={styles.netBar}>网络已断开，分数可能不同步</div>}

      <header className={styles.header}>
        <button className={styles.iconBtn} onClick={onBack} aria-label="返回">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <div className={styles.headerTitle}>{room.name}</div>
        <button className={styles.iconBtn} onClick={handleShare} aria-label="分享">
          <Share2 size={20} strokeWidth={1.8} />
        </button>
      </header>

      <main className={styles.main}>
        {rows.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>还没有轮次</p>
            <p className={styles.emptySub}>点击「+新一轮」开始记分</p>
          </div>
        ) : (
          <>
            <div
              ref={tableRef}
              className={styles.tableWrap}
              onScroll={() => syncScroll(tableRef, totalRef)}
            >
              <table className={styles.table} style={{ minWidth: tableWidth }}>
                <thead>
                  <tr>
                    <th
                      className={`${styles.th} ${styles.stickyCol}`}
                      style={{ width: 40, minWidth: 40 }}
                    />
                    {players.map((p) => (
                      <th key={p.id} className={styles.th} style={{ minWidth: cellMinW }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.roundId}>
                      <td
                        className={`${styles.td} ${styles.stickyCol} ${styles.roundNum}`}
                        style={{ width: 40, minWidth: 40 }}
                        onTouchStart={() => startLongPress(row.roundId)}
                        onTouchEnd={cancelLongPress}
                        onMouseDown={() => startLongPress(row.roundId)}
                        onMouseUp={cancelLongPress}
                        onMouseLeave={cancelLongPress}
                      >
                        {row.roundNumber}
                      </td>
                      {players.map((p) => {
                        const s = row.scores[p.id]
                        return (
                          <td
                            key={p.id}
                            className={`${styles.td} ${styles.scoreCell} ${s == null ? styles.emptyCell : ''}`}
                            style={{ minWidth: cellMinW }}
                            onClick={() => openEdit(row.roundId, p.id, s)}
                          >
                            <span className={`num ${s != null && s < 0 ? styles.scoreNeg : ''}`}>
                              {fmtScore(s)}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              ref={totalRef}
              className={styles.totalBar}
              onScroll={() => syncScroll(totalRef, tableRef)}
            >
              <div className={styles.totalInner} style={{ minWidth: tableWidth }}>
                <div className={styles.totalItem} style={{ minWidth: 40 }}>
                  总
                </div>
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={`${styles.totalItem} ${styles.totalScore} num`}
                    style={{ minWidth: cellMinW }}
                  >
                    {totals[p.id] ?? 0}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {!isFinished && (
        <div className={styles.bottomBar}>
          <button className={styles.actionBtn} onClick={openRoundSheet}>
            <Plus size={18} strokeWidth={2} />
            <span>新一轮</span>
          </button>
          <button className={styles.actionBtn} onClick={() => setAddPlayerSheet(true)}>
            <Plus size={18} strokeWidth={2} />
            <span>玩家</span>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.dangerBtn}`}
            onClick={() => setEndOpen(true)}
          >
            <span>结束</span>
          </button>
        </div>
      )}

      {/* 新一轮 Sheet */}
      <Sheet
        open={roundSheet}
        onClose={() => setRoundSheet(false)}
        title={`第 ${rows.length + 1} 轮`}
      >
        <div className={styles.roundBody}>
          {players.map((p) => (
            <div key={p.id} className={styles.roundRow}>
              <span className={styles.roundName}>{p.name}</span>
              <div className={styles.roundInputWrap}>
                <button
                  className={`${styles.signToggle} ${(roundInputs[p.id] ?? '').startsWith('-') ? styles.neg : ''}`}
                  onClick={() => toggleSign(p.id)}
                  aria-label="切换正负号"
                >
                  {(roundInputs[p.id] ?? '').startsWith('-') ? '−' : '+'}
                </button>
                <input
                  className={styles.roundInput}
                  type="text"
                  inputMode="numeric"
                  value={(roundInputs[p.id] ?? '').replace(/^-/, '')}
                  onChange={(e) =>
                    setRoundInput(
                      p.id,
                      `${(roundInputs[p.id] ?? '').startsWith('-') ? '-' : ''}${e.target.value}`,
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button className={styles.primaryBtn} onClick={handleSaveRound}>
            保存本轮
          </button>
        </div>
      </Sheet>

      {/* 修改分数 Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="修改分数"
        content={
          <div className={styles.editBody}>
            <div className={styles.editRow}>
              <button
                className={`${styles.signToggle} ${editNeg ? styles.neg : ''}`}
                onClick={() => setEditNeg((v) => !v)}
              >
                {editNeg ? '−' : '+'}
              </button>
              <input
                className={styles.editInput}
                type="text"
                inputMode="numeric"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="留空表示清除"
                autoFocus
              />
            </div>
            <p className={styles.editHint}>切换 +/− 改变正负，留空清除分数</p>
          </div>
        }
        onConfirm={confirmEdit}
        confirmText="确认"
      />

      {/* 删除轮次 */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="删除轮次"
        content="确定删除该轮次的全部记录？此操作不可撤销。"
        onConfirm={confirmDelete}
        confirmText="删除"
        danger
      />

      {/* 结束游戏 */}
      <Dialog
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title="结束游戏"
        content="结束后房间将锁定，所有人将跳转到结算页。确定结束？"
        onConfirm={handleEnd}
        confirmText="结束游戏"
        danger
      />

      {/* 添加玩家 Sheet */}
      <Sheet open={addPlayerSheet} onClose={() => setAddPlayerSheet(false)} title="添加玩家">
        <div className={styles.roundBody}>
          <input
            className={styles.input}
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="玩家姓名"
            maxLength={12}
          />
          <button className={styles.primaryBtn} onClick={handleAddPlayer}>
            确认添加
          </button>
        </div>
      </Sheet>

      <Toast message={hookToast} />
    </div>
  )
}
