import { useMemo, useState } from 'react'
import { ChevronRight, Plus, X } from 'lucide-react'
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

export default function HomeView({ onEnterRoom }) {
  const [roomList, setRoomList] = useState(() =>
    getRoomList().sort((a, b) => b.lastVisitedAt - a.lastVisitedAt),
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [toast, setToast] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)

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
    setCreateOpen(true)
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
    const names = playerNames.map((n) => n.trim()).filter(Boolean)
    if (names.length < 2) {
      showToast('至少需要 2 位玩家')
      return
    }
    if (new Set(names).size !== names.length) {
      showToast('玩家名不能重复')
      return
    }
    setCreating(true)
    const roomName = name.trim() || defaultName
    const res = await createRoom(roomName, names)
    setCreating(false)
    if (!res.ok) {
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.appName}>计分板</h1>
        <p className={styles.slogan}>和朋友一起，记录每一局</p>
      </header>

      <main className={styles.main}>
        <button className={styles.createBtn} onClick={openCreate}>
          <Plus size={20} strokeWidth={2} />
          <span>创建新房间</span>
        </button>

        {roomList.length > 0 && (
          <>
            <div className={styles.sectionTitle}>我的房间</div>
            <div className={styles.list}>
              {roomList.map((r) => (
                <div
                  key={r.id}
                  className={styles.roomItem}
                  onClick={() => onEnterRoom(r.id)}
                  onTouchStart={() => startLongPress(r)}
                  onTouchEnd={cancelLongPress}
                  onMouseDown={() => startLongPress(r)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                >
                  <div className={styles.roomInfo}>
                    <div className={styles.roomName}>
                      {r.name}
                      {r.status === 'finished' && <span className={styles.badge}>已结束</span>}
                    </div>
                    <div className={styles.roomMeta}>
                      {r.playerCount} 位玩家 · {formatTime(r.lastVisitedAt)}
                    </div>
                  </div>
                  <ChevronRight size={18} className={styles.arrow} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

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
        danger
      />
      <Toast message={toast} />
    </div>
  )
}
