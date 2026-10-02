import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, supabaseReady } from '@/lib/supabase'
import { genRoomId } from '@/lib/roomId'
import { removeRoom } from '@/utils/roomStorage'

export function useRoom(roomId) {
  const [loading, setLoading] = useState(true)
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState({})
  const [toast, setToast] = useState(null)
  const [netError, setNetError] = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const computeTotals = useCallback((currentRows) => {
    const t = {}
    currentRows.forEach((row) => {
      Object.entries(row.scores).forEach(([pid, score]) => {
        if (score != null) t[pid] = (t[pid] || 0) + score
      })
    })
    return t
  }, [])

  const load = useCallback(
    async (silent = false) => {
      if (!roomId || !supabaseReady) return
      try {
        const [{ data: roomData, error: roomErr }, { data: playersData }, { data: roundsData }] =
          await Promise.all([
            supabase.from('rooms').select('*').eq('id', roomId).single(),
            supabase.from('players').select('*').eq('room_id', roomId).order('sort_order'),
            supabase.from('rounds').select('*').eq('room_id', roomId).order('round_number'),
          ])
        if (roomErr || !roomData) {
          removeRoom(roomId)
          setRoom(null)
          return
        }
        const roundIds = (roundsData || []).map((r) => r.id)
        let scoresData = []
        if (roundIds.length) {
          const { data } = await supabase.from('scores').select('*').in('round_id', roundIds)
          scoresData = data || []
        }
        const scoreMap = {}
        scoresData.forEach((s) => {
          if (!scoreMap[s.round_id]) scoreMap[s.round_id] = {}
          scoreMap[s.round_id][s.player_id] = s.score
        })
        const newRows = (roundsData || []).map((r) => ({
          roundId: r.id,
          roundNumber: r.round_number,
          scores: scoreMap[r.id] || {},
        }))
        setRoom(roomData)
        setPlayers(playersData || [])
        setRows(newRows)
        setTotals(computeTotals(newRows))
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [roomId, computeTotals],
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!roomId || !supabaseReady) return
    const channel = supabase.channel(`room-${roomId}`)
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => load(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => load(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rounds', filter: `room_id=eq.${roomId}` },
        () => load(true),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => load(true))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setNetError(false)
          load(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setNetError(true)
        }
      })
    return () => {
      channel.unsubscribe()
    }
  }, [roomId, load])

  const addPlayer = useCallback(
    async (name) => {
      if (!supabaseReady) return { ok: false }
      const sortOrder = players.length
      const { data, error } = await supabase
        .from('players')
        .insert({ room_id: roomId, name, sort_order: sortOrder })
        .select()
        .single()
      if (error) {
        showToast('添加玩家失败')
        return { ok: false, error }
      }
      await load(true)
      return { ok: true, data }
    },
    [players.length, roomId, showToast, load],
  )

  const saveRound = useCallback(
    async (scoreMap) => {
      if (!supabaseReady) return { ok: false }
      const nextNum = rows.length > 0 ? Math.max(...rows.map((r) => r.roundNumber)) + 1 : 1
      const { data: roundData, error: roundErr } = await supabase
        .from('rounds')
        .insert({ room_id: roomId, round_number: nextNum })
        .select()
        .single()
      if (roundErr) {
        showToast(roundErr.code === '23505' ? '本轮已被创建' : '保存失败')
        return { ok: false, error: roundErr }
      }
      const entries = Object.entries(scoreMap).filter(([, v]) => v != null)
      if (entries.length) {
        const scoreInserts = entries.map(([playerId, score]) => ({
          round_id: roundData.id,
          player_id: playerId,
          score,
        }))
        await supabase.from('scores').insert(scoreInserts)
      }
      await load(true)
      return { ok: true }
    },
    [rows, roomId, showToast, load],
  )

  const updateScore = useCallback(
    async (roundId, playerId, score) => {
      if (!supabaseReady) return { ok: false }
      let res
      if (score == null) {
        res = await supabase
          .from('scores')
          .delete()
          .eq('round_id', roundId)
          .eq('player_id', playerId)
      } else {
        res = await supabase
          .from('scores')
          .upsert(
            { round_id: roundId, player_id: playerId, score },
            { onConflict: 'round_id,player_id' },
          )
      }
      if (res.error) {
        showToast('修改失败')
        return { ok: false }
      }
      await load(true)
      return { ok: true }
    },
    [showToast, load],
  )

  const finishRoom = useCallback(async () => {
    if (!supabaseReady) return { ok: false }
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'finished', ended_at: new Date().toISOString() })
      .eq('id', roomId)
    if (error) {
      showToast('结束失败')
      return { ok: false }
    }
    await load(true)
    return { ok: true }
  }, [roomId, showToast, load])

  return {
    loading,
    room,
    players,
    rows,
    totals,
    toast,
    netError,
    showToast,
    addPlayer,
    saveRound,
    updateScore,
    finishRoom,
  }
}

export async function createRoom(name, playerNames) {
  if (!supabaseReady) return { ok: false, error: new Error('Supabase 未配置') }
  // 短码碰撞时重试一次
  let room = null
  for (let attempt = 0; attempt < 3 && !room; attempt += 1) {
    const { data, error } = await supabase
      .from('rooms')
      .insert({ id: genRoomId(), name })
      .select()
      .single()
    if (!error) room = data
    else if (error.code !== '23505') return { ok: false, error }
  }
  if (!room) return { ok: false, error: new Error('房间码冲突') }
  const playerInserts = playerNames.map((n, i) => ({
    room_id: room.id,
    name: n,
    sort_order: i,
  }))
  const { error: playerErr } = await supabase.from('players').insert(playerInserts)
  if (playerErr) return { ok: false, error: playerErr }
  return { ok: true, roomId: room.id }
}
