import { useMemo, useRef, useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { Sheet, Dialog, Toast } from '@/components'
import { createRoom } from '@/hooks/useRoom'
import { getRoomList, removeRoom, touchRoom } from '@/utils/roomStorage'
import styles from '@/views/HomeView/index.module.less'

function formatTime(ts) {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function fmtScore(total) {
  return total > 0 ? `+${total}` : `${total}`
}

function fmtHM(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 「11月7日 19:30 - 22:45」，跨天时结束时间带日期 */
function fmtTimeRange(createdAt, endedAt) {
  if (!createdAt) return null
  const s = new Date(createdAt)
  let text = `${s.getMonth() + 1}月${s.getDate()}日 ${fmtHM(createdAt)}`
  if (endedAt) {
    const e = new Date(endedAt)
    const sameDay = s.toDateString() === e.toDateString()
    text += sameDay
      ? ` - ${fmtHM(endedAt)}`
      : ` - ${e.getMonth() + 1}月${e.getDate()}日 ${fmtHM(endedAt)}`
  }
  return text
}

function fmtDuration(createdAt, endedAt) {
  if (!createdAt || !endedAt) return null
  const mins = Math.max(1, Math.round((new Date(endedAt) - new Date(createdAt)) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}小时${m}分` : `${m}分`
}

export default function HomeView({ onEnterRoom }) {
  const [roomList, setRoomList] = useState(() =>
    getRoomList().sort((a, b) => b.lastVisitedAt - a.lastVisitedAt),
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [joinCode, setJoinCode] = useState('')
  const [toast, setToast] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const createBusyRef = useRef(false)

  const activeRooms = roomList.filter((r) => r.status !== 'finished')
  const finishedRooms = roomList.filter((r) => r.status === 'finished')

  const defaultName = useMemo(() => {
    const d = new Date()
    return `计分房 ${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在弹层打开时刷新默认名
  }, [createOpen])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const openCreate = () => {
    setName('')
    setPlayerNames(['', ''])
    createBusyRef.current = false
    setCreating(false)
    setCreateOpen(true)
  }

  const handleJoin = () => {
    const code = joinCode.trim()
    if (!code) {
      showToast('请输入房间号')
      return
    }
    onEnterRoom(code)
  }

  const handleJoinKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin()
  }

  const handleOpen = (room) => {
    // 已结算房间直达分享战报页
    onEnterRoom(room.id, room.status === 'finished' ? 'share' : undefined)
  }

  const handleContinue = (e, room) => {
    e.stopPropagation()
    onEnterRoom(room.id)
  }

  const setPlayer = (i, v) => {
    const next = [...playerNames]
    next[i] = v
    setPlayerNames(next)
  }

  const removePlayer = (i) => {
    if (playerNames.length <= 2) return
    setPlayerNames(playerNames.filter((_, idx) => idx !== i))
  }

  const addPlayerField = () => {
    if (playerNames.length >= 12) {
      showToast('最多 12 位玩家')
      return
    }
    setPlayerNames([...playerNames, ''])
  }

  const handleCreate = async () => {
    if (createBusyRef.current) return
    const names = playerNames.map((n) => n.trim()).filter(Boolean)
    if (names.length < 2) {
      showToast('至少需要 2 位玩家')
      return
    }
    if (new Set(names).size !== names.length) {
      showToast('玩家名不能重复')
      return
    }
    createBusyRef.current = true
    setCreating(true)
    const roomName = name.trim() || defaultName
    const res = await createRoom(roomName, names)
    if (!res.ok) {
      // 失败才复位 loading；成功后保持 disabled 直到弹层关闭
      createBusyRef.current = false
      setCreating(false)
      showToast('创建失败，请检查网络或配置')
      return
    }
    const list = touchRoom({ id: res.roomId, name: roomName, playerCount: names.length })
    setRoomList(list)
    setCreateOpen(false)
    onEnterRoom(res.roomId)
  }

  const startLongPress = (room) => {
    const t = setTimeout(() => setRemoveTarget(room), 550)
    setLongPressTimer(t)
  }

  const cancelLongPress = () => {
    if (longPressTimer) clearTimeout(longPressTimer)
    setLongPressTimer(null)
  }

  const confirmRemove = () => {
    setRoomList(removeRoom(removeTarget.id))
    setRemoveTarget(null)
  }

  const renderActiveCard = (r) => {
    const snapshot = [...(r.playersSnapshot ?? [])].sort((a, b) => b.total - a.total)
    return (
      <div
        key={r.id}
        className={styles.activeCard}
        onClick={() => handleOpen(r)}
        onTouchStart={() => startLongPress(r)}
        onTouchEnd={cancelLongPress}
        onMouseDown={() => startLongPress(r)}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
      >
        <div className={styles.activeHead}>
          <span className={styles.activeName}>{r.name}</span>
          <button className={styles.continueBtn} onClick={(e) => handleContinue(e, r)}>
            继续计分
          </button>
        </div>
        {snapshot.length > 0 && (
          <div className={styles.playerGrid}>
            {snapshot.map((p) => (
              <div key={p.name} className={styles.playerChip}>
                <span className={styles.chipName}>{p.name}</span>
                <span className={`${styles.chipScore} ${p.total < 0 ? styles.chipNeg : ''}`}>
                  {fmtScore(p.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderHistoryCard = (r) => {
    const range = fmtTimeRange(r.createdAt, r.endedAt)
    const duration = fmtDuration(r.createdAt, r.endedAt)
    const names = (r.playersSnapshot ?? []).map((p) => p.name).join('、')
    return (
      <div
        key={r.id}
        className={styles.historyCard}
        onClick={() => handleOpen(r)}
        onTouchStart={() => startLongPress(r)}
        onTouchEnd={cancelLongPress}
        onMouseDown={() => startLongPress(r)}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
      >
        <div className={styles.historyHead}>
          <span className={styles.historyName}>{r.name}</span>
          <span className={styles.historyStatus}>已结算</span>
        </div>
        <div className={styles.historyPlayers}>
          <span className={styles.historyCount}>{r.playerCount}人</span>
          {names && <span className={styles.historyNames}>· {names}</span>}
        </div>
        <div className={styles.historyFoot}>
          <span className={styles.historyTime}>
            {range ?? formatTime(r.lastVisitedAt)}
            {duration && ` · ${duration}`}
          </span>
          <span className={styles.historyDetail}>详情 &gt;</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>对局记账</h1>
        <p className={styles.subtitle}>好友聚会对局记账</p>
      </header>

      <div className={styles.actions}>
        <button className={styles.createBtn} onClick={openCreate}>
          创建新对局
        </button>
        <div className={styles.joinBar}>
          <input
            className={styles.joinInput}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={handleJoinKeyDown}
            placeholder="输入房间号加入"
            maxLength={16}
          />
          <button className={styles.joinBtn} onClick={handleJoin}>
            加入
          </button>
        </div>
      </div>

      {activeRooms.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>进行中对局</span>
            {activeRooms.length === 1 && activeRooms[0].roundCount > 0 && (
              <span className={styles.sectionMeta}>第 {activeRooms[0].roundCount} 轮</span>
            )}
          </div>
          {activeRooms.map(renderActiveCard)}
        </section>
      )}

      {finishedRooms.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>历史对局记录</span>
          </div>
          <div className={styles.historyList}>{finishedRooms.map(renderHistoryCard)}</div>
        </section>
      )}

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="创建房间">
        <div className={styles.field}>
          <label className={styles.label}>房间名</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            maxLength={20}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>玩家（至少 2 人）</label>
          {playerNames.map((p, i) => (
            <div key={i} className={styles.playerRow}>
              <input
                className={styles.input}
                value={p}
                onChange={(e) => setPlayer(i, e.target.value)}
                placeholder={`玩家 ${i + 1}`}
                maxLength={12}
              />
              {playerNames.length > 2 && (
                <button
                  className={styles.removePlayer}
                  onClick={() => removePlayer(i)}
                  aria-label="移除玩家"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button className={styles.addPlayerBtn} onClick={addPlayerField}>
            <Plus size={16} /> 添加玩家
          </button>
        </div>
        <button className={styles.submitBtn} onClick={handleCreate} disabled={creating}>
          {creating && <Loader2 size={18} className={styles.spin} />}
          {creating ? '创建中…' : '开始计分'}
        </button>
      </Sheet>

      <Dialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="移除记录"
        content={`仅从本机列表移除「${removeTarget?.name}」，云端房间数据不受影响。`}
        onConfirm={confirmRemove}
        confirmText="移除"
      />
      <Toast message={toast} />
    </div>
  )
}
