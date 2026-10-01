// 8 位短房间码：去掉易混淆字符（0/o/1/l/i）
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

export function genRoomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
