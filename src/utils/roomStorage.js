const KEY = 'roomList'

export function getRoomList() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

/** 记录/更新房间入口，并按最近访问排序 */
export function touchRoom({ id, name, status = 'active', playerCount = 0 }) {
  const list = getRoomList().filter((r) => r.id !== id)
  list.unshift({ id, name, status, playerCount, lastVisitedAt: Date.now() })
  save(list)
  return list
}

export function updateRoomMeta(id, patch) {
  const list = getRoomList().map((r) => (r.id === id ? { ...r, ...patch } : r))
  save(list)
  return list
}

export function removeRoom(id) {
  const list = getRoomList().filter((r) => r.id !== id)
  save(list)
  return list
}
