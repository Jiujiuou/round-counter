import { useCallback, useEffect, useState } from 'react'
import { Layout, Toast } from '@/components'
import HomeView from '@/views/HomeView/HomeView'
import RoomView from '@/views/RoomView/RoomView'
import SettlementView from '@/views/SettlementView/SettlementView'
import { createRoom } from '@/hooks/useRoom'
import { supabase, supabaseReady } from '@/lib/supabase'
import { touchRoom } from '@/utils/roomStorage'

function getRoomParam() {
  return new URLSearchParams(window.location.search).get('room')
}

export default function App() {
  const [roomId, setRoomId] = useState(() => getRoomParam())
  // settled: 进入结算页的房间 id（含 status 确认）
  const [settleMode, setSettleMode] = useState(null) // null | 'loading' | 'yes' | 'no'
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  const enterRoom = useCallback((id) => {
    if (getRoomParam() !== id) {
      history.pushState(null, '', `?room=${id}`)
    }
    setSettleMode('loading')
    setRoomId(id)
  }, [])

  const goHome = useCallback(() => {
    history.pushState(null, '', window.location.pathname)
    setRoomId(null)
    setSettleMode(null)
  }, [])

  useEffect(() => {
    const onPop = () => {
      const id = getRoomParam()
      setSettleMode(id ? 'loading' : null)
      setRoomId(id)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // 检查房间状态以决定渲染 RoomView 还是 SettlementView
  useEffect(() => {
    if (!roomId || !supabaseReady) return
    let cancelled = false
    supabase
      .from('rooms')
      .select('status')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setSettleMode(data?.status === 'finished' ? 'yes' : 'no')
      })
    return () => {
      cancelled = true
    }
  }, [roomId])

  const handleFinish = useCallback(() => {
    setSettleMode('yes')
  }, [])

  const handleRematch = useCallback(
    async (oldName, playerNames) => {
      const res = await createRoom(`${oldName} · 新局`, playerNames)
      if (!res.ok) {
        showToast('创建失败，请稍后再试')
        return
      }
      touchRoom({ id: res.roomId, name: `${oldName} · 新局`, playerCount: playerNames.length })
      enterRoom(res.roomId)
    },
    [enterRoom, showToast],
  )

  let content
  if (!supabaseReady) {
    content = (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>
        <p>尚未配置 Supabase</p>
        <p style={{ fontSize: 14 }}>请按 .env.example 填写 .env.local 后重启开发服务器</p>
      </div>
    )
  } else if (!roomId) {
    content = <HomeView onEnterRoom={enterRoom} />
  } else if (settleMode === 'loading') {
    content = (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>加载中…</div>
    )
  } else if (settleMode === 'yes') {
    content = <SettlementView roomId={roomId} onBack={goHome} onRematch={handleRematch} />
  } else {
    content = <RoomView roomId={roomId} onBack={goHome} onFinish={handleFinish} />
  }

  return (
    <Layout>
      {content}
      <Toast message={toast} />
    </Layout>
  )
}
