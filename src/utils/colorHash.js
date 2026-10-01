// 把名字哈希成好看的颜色（HSL）
export function nameToHsl(name) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h} 72% 58%)`
}

// 首字（1-2 个字符）
export function nameInitial(name) {
  return name.slice(0, 1)
}
