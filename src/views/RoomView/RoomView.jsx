import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Share2, Loader2 } from 'lucide-react'
import { useRoom } from '@/hooks/useRoom'
import { Sheet, Dialog, Toast } from '@/components'
import { touchRoom } from '@/utils/roomStorage'
import styles from '@/views/RoomView/index.module.less'

function fmtScore(v) {
  if (v == null) return ''
  return v > 0 ? `+${v}` : String(v)
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
    finishRoom,
  } = useRoom(roomId)

  const [roundSheet, setRoundSheet] = useState(false)
  const [roundInputs, setRoundInputs] = useState({})
  // 整轮编辑弹层
  const [editRoundSheet, setEditRoundSheet] = useState(false)
  const [editRoundId, setEditRoundId] = useState(null)
  const [editRoundNumber, setEditRoundNumber] = useState(null)
  const [editInputs, setEditInputs] = useState({})
  const [endOpen, setEndOpen] = useState(false)
  const [addPlayerSheet, setAddPlayerSheet] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  // 异步操作 loading 态（防连点）
  const [savingRound, setSavingRound] = useState(false)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [savingEditRound, setSavingEditRound] = useState(false)
  const [ending, setEnding] = useState(false)
  // 同步生效的 busy 守卫（state 依赖渲染时机，存在竞态窗口）
  const busyRef = useRef(new Set())
  const isBusy = (k) => busyRef.current.has(k)
  const markBusy = (k) => busyRef.current.add(k)
  const clearBusy = (k) => busyRef.current.delete(k)

  const isFinished = room?.status === 'finished'

  useEffect(() => {
    if (room) {
      touchRoom({
        id: room.id,
        name: room.name,
        status: room.status,
        playerCount: players.length,
        playersSnapshot: players.map((p) => ({ name: p.name, total: totals[p.id] ?? 0 })),
        roundCount: rows.length,
        createdAt: room.created_at,
        endedAt: room.ended_at,
      })
    }
  }, [room, players, rows, totals])

  useEffect(() => {
    if (isFinished) {
      onFinish(roomId)
    }
  }, [isFinished, roomId, onFinish])

  const openRoundSheet = () => {
    const init = {}
    players.forEach((p) => (init[p.id] = ''))
    setRoundInputs(init)
    clearBusy('round')
    setSavingRound(false)
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
    if (isBusy('round')) return
    const map = {}
    players.forEach((p) => {
      const v = roundInputs[p.id]?.trim()
      if (v !== '') {
        const n = parseInt(v, 10)
        if (!Number.isNaN(n)) map[p.id] = n
      }
    })
    if (Object.keys(map).length === 0) {
      showToast('请至少输入一位玩家的分数')
      return
    }
    markBusy('round')
    setSavingRound(true)
    const res = await saveRound(map)
    if (res.ok) {
      // 成功后保持 disabled 直到弹层完全关闭，下次打开时复位；同时清空输入防穿透重开后的重复提交
      setRoundSheet(false)
      const init = {}
      players.forEach((p) => (init[p.id] = ''))
      setRoundInputs(init)
    } else {
      clearBusy('round')
      setSavingRound(false)
    }
  }

  // 打开整轮编辑弹层：预填该轮所有玩家分数（含正负号）
  const openRoundEdit = (row) => {
    if (isFinished) return
    const init = {}
    players.forEach((p) => {
      const s = row.scores[p.id]
      init[p.id] = s == null ? '' : String(s)
    })
    setEditRoundId(row.roundId)
    setEditRoundNumber(row.roundNumber)
    setEditInputs(init)
    clearBusy('editRound')
    setSavingEditRound(false)
    setEditRoundSheet(true)
  }

  const setEditInput = (pid, v) => {
    const clean = v.replace(/(?!^-)[^0-9]/g, '')
    setEditInputs((prev) => ({ ...prev, [pid]: clean }))
  }

  const toggleEditSign = (pid) => {
    setEditInputs((prev) => {
      const cur = prev[pid] ?? ''
      return { ...prev, [pid]: cur.startsWith('-') ? cur.slice(1) : `-${cur}` }
    })
  }

  // 保存整轮修改：只提交有变化的玩家；留空 = 清除该玩家本轮分数
  const handleSaveRoundEdit = async () => {
    if (isBusy('editRound')) return
    const row = rows.find((r) => r.roundId === editRoundId)
    if (!row) {
      setEditRoundSheet(false)
      return
    }
    const updates = []
    players.forEach((p) => {
      const v = (editInputs[p.id] ?? '').trim()
      let score = null
      if (v !== '') {
        const n = parseInt(v, 10)
        if (!Number.isNaN(n)) score = n
      }
      if (score !== (row.scores[p.id] ?? null)) updates.push({ playerId: p.id, score })
    })
    if (updates.length === 0) {
      setEditRoundSheet(false)
      return
    }
    markBusy('editRound')
    setSavingEditRound(true)
    const results = await Promise.all(
      updates.map((u) => updateScore(editRoundId, u.playerId, u.score)),
    )
    if (results.every((r) => r.ok)) {
      // 成功后保持 disabled 直到弹层完全关闭，下次打开时复位
      setEditRoundSheet(false)
    } else {
      clearBusy('editRound')
      setSavingEditRound(false)
      showToast('保存失败，请稍后再试')
    }
  }

  const handleEnd = async () => {
    if (isBusy('end')) return
    markBusy('end')
    setEnding(true)
    const res = await finishRoom()
    if (res.ok) {
      setEndOpen(false)
      onFinish(roomId)
    } else {
      clearBusy('end')
      setEnding(false)
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

  const openAddPlayerSheet = () => {
    setNewPlayerName('')
    clearBusy('add')
    setAddingPlayer(false)
    setAddPlayerSheet(true)
  }

  const handleAddPlayer = async () => {
    if (isBusy('add')) return
    const n = newPlayerName.trim()
    if (!n) return
    if (players.some((p) => p.name === n)) {
      showToast('玩家名已存在')
      return
    }
    markBusy('add')
    setAddingPlayer(true)
    const res = await addPlayer(n)
    if (res.ok) {
      setAddPlayerSheet(false)
      setNewPlayerName('')
    } else {
      clearBusy('add')
      setAddingPlayer(false)
    }
  }

  // 按玩家名实测列宽：主表格与总计行共用同一组宽度，保证逐列对齐
  const colWidths = useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.font = '600 12px "Hanken Grotesk", "PingFang SC", "Microsoft YaHei", sans-serif'
    return players.map((p) => Math.max(64, Math.ceil(ctx.measureText(p.name).width) + 20))
  }, [players])

  const tableWidth = `max(100%, ${colWidths.reduce((sum, w) => sum + w, 56)}px)`

  // 每轮最高分的玩家集合（用于加粗标记）
  const roundWinners = useMemo(() => {
    const map = {}
    rows.forEach((r) => {
      let max = -Infinity
      players.forEach((p) => {
        const s = r.scores[p.id]
        if (s != null && s > max) max = s
      })
      const winners = new Set()
      if (max > -Infinity) {
        players.forEach((p) => {
          if (r.scores[p.id] === max) winners.add(p.id)
        })
      }
      map[r.roundId] = winners
    })
    return map
  }, [rows, players])

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
          <ArrowLeft size={22} strokeWidth={2.2} />
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerTitle}>{room.name}</div>
        </div>
        <button className={styles.iconBtn} onClick={handleShare} aria-label="分享">
          <Share2 size={20} strokeWidth={1.8} />
        </button>
      </header>

      <main className={styles.main}>
        {rows.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>还没有轮次</p>
            <p className={styles.emptySub}>点击下方按钮录入第一轮</p>
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
                    <th className={`${styles.th} ${styles.stickyCol} ${styles.roundTh}`}>轮次</th>
                    {players.map((p, i) => (
                      <th key={p.id} className={styles.th} style={{ width: colWidths[i] }}>
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
                        onClick={() => openRoundEdit(row)}
                      >
                        第{row.roundNumber}轮
                      </td>
                      {players.map((p, i) => {
                        const s = row.scores[p.id]
                        const isWinner = s != null && roundWinners[row.roundId]?.has(p.id)
                        return (
                          <td
                            key={p.id}
                            className={`${styles.td} ${styles.scoreCell}`}
                            style={{ width: colWidths[i] }}
                          >
                            <span
                              className={`${s != null && s < 0 ? styles.scoreNeg : ''} ${isWinner ? styles.scoreWin : ''}`}
                            >
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
              <table className={styles.totalTable} style={{ minWidth: tableWidth }}>
                <tbody>
                  <tr>
                    <td className={`${styles.totalCell} ${styles.totalSticky}`}>总计</td>
                    {players.map((p, i) => {
                      const t = totals[p.id] ?? 0
                      return (
                        <td
                          key={p.id}
                          className={`${styles.totalCell} ${styles.totalScore} ${t < 0 ? styles.totalNeg : ''}`}
                          style={{ width: colWidths[i] }}
                        >
                          {fmtScore(t)}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {!isFinished && (
        <div className={styles.bottomBar}>
          <div className={styles.bottomGrid}>
            <button className={styles.roundBtn} onClick={openRoundSheet}>
              录入下一轮
            </button>
            <button className={styles.playerBtn} onClick={openAddPlayerSheet}>
              添加玩家
            </button>
          </div>
          <button
            className={styles.endBtn}
            onClick={() => {
              clearBusy('end')
              setEnding(false)
              setEndOpen(true)
            }}
          >
            结束对局并结算
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
                  placeholder="输入得分"
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
          <button className={styles.primaryBtn} onClick={handleSaveRound} disabled={savingRound}>
            {savingRound && <Loader2 size={18} className={styles.spin} />}
            {savingRound ? '保存中…' : '保存本轮'}
          </button>
        </div>
      </Sheet>

      {/* 编辑整轮 Sheet */}
      <Sheet
        open={editRoundSheet}
        onClose={() => setEditRoundSheet(false)}
        title={`第 ${editRoundNumber} 轮`}
      >
        <div className={styles.roundBody}>
          {players.map((p) => (
            <div key={p.id} className={styles.roundRow}>
              <span className={styles.roundName}>{p.name}</span>
              <div className={styles.roundInputWrap}>
                <button
                  className={`${styles.signToggle} ${(editInputs[p.id] ?? '').startsWith('-') ? styles.neg : ''}`}
                  onClick={() => toggleEditSign(p.id)}
                  aria-label="切换正负号"
                >
                  {(editInputs[p.id] ?? '').startsWith('-') ? '−' : '+'}
                </button>
                <input
                  className={styles.roundInput}
                  type="text"
                  inputMode="numeric"
                  placeholder="无分数"
                  value={(editInputs[p.id] ?? '').replace(/^-/, '')}
                  onChange={(e) =>
                    setEditInput(
                      p.id,
                      `${(editInputs[p.id] ?? '').startsWith('-') ? '-' : ''}${e.target.value}`,
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            className={styles.primaryBtn}
            onClick={handleSaveRoundEdit}
            disabled={savingEditRound}
          >
            {savingEditRound && <Loader2 size={18} className={styles.spin} />}
            {savingEditRound ? '保存中…' : '保存修改'}
          </button>
          <p className={styles.sheetNote}>留空的玩家将清除本轮分数</p>
        </div>
      </Sheet>

      {/* 结束游戏 */}
      <Dialog
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title="结束游戏"
        content="结束后本房间将立即锁定，当前计分结果将完成归档，所有玩家将同步跳转至最终结算清单。确定结束此局？"
        onConfirm={handleEnd}
        confirmText="确认结束"
        confirmLoading={ending}
      />

      {/* 添加玩家 Sheet */}
      <Sheet open={addPlayerSheet} onClose={() => setAddPlayerSheet(false)} title="添加玩家">
        <div className={styles.roundBody}>
          <input
            className={styles.input}
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="玩家姓名"
            maxLength={8}
          />
          <div className={styles.inputMeta}>
            <span>支持2-8个汉字或昵称</span>
            <span>{newPlayerName.length}/8</span>
          </div>
          <button className={styles.primaryBtn} onClick={handleAddPlayer} disabled={addingPlayer}>
            {addingPlayer && <Loader2 size={18} className={styles.spin} />}
            {addingPlayer ? '添加中…' : '确认添加'}
          </button>
          <button className={styles.cancelBtn} onClick={() => setAddPlayerSheet(false)}>
            取消
          </button>
          <p className={styles.sheetNote}>新加入玩家将自下一轮起参与计分</p>
        </div>
      </Sheet>

      <Toast message={hookToast} />
    </div>
  )
}
