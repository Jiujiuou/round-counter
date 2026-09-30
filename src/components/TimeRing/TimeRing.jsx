import { useEffect, useMemo, useRef } from 'react'
import styles from '@/components/TimeRing/index.module.less'

function getTimeValue(type, now) {
  const second = now.getSeconds() + now.getMilliseconds() / 1000
  const minute = now.getMinutes() + second / 60

  if (type === 'hour') return now.getHours() + minute / 60
  if (type === 'minute') return minute

  return second
}

function TimeRing({
  type,
  count,
  labelInterval,
  horizontalRadius,
  verticalRadius,
  ringFontSize,
  numberOffset,
  groupShift,
  tickWidth,
  tickThickness,
  minorTickWidthRatio,
}) {
  const markerRefs = useRef([])
  const markerValues = useMemo(() => Array.from({ length: count }, (_, value) => value), [count])

  useEffect(() => {
    let animationFrameId
    const stepAngle = (2 * Math.PI) / count

    const render = () => {
      const value = getTimeValue(type, new Date())

      markerValues.forEach((markerValue) => {
        const marker = markerRefs.current[markerValue]

        if (!marker) return

        let difference = value - markerValue
        if (difference > count / 2) difference -= count
        if (difference < -count / 2) difference += count

        const angle = difference * stepAngle
        if (Math.abs(angle) > Math.PI / 2) {
          marker.style.visibility = 'hidden'
          return
        }

        const x = horizontalRadius * (Math.cos(angle) - 1)
        const y = verticalRadius * Math.sin(angle)

        marker.style.visibility = 'visible'
        marker.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad)`
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [type, count, horizontalRadius, verticalRadius, markerValues])

  return (
    <div
      className={styles.root}
      style={{
        '--font-size': `${ringFontSize}px`,
        '--number-offset': `${numberOffset}px`,
        '--group-shift': `${groupShift}px`,
        '--tick-width': `${tickWidth}px`,
        '--tick-thickness': `${tickThickness}px`,
        '--minor-tick-width': `${tickWidth * minorTickWidthRatio}px`,
      }}
    >
      {markerValues.map((markerValue) => {
        const isMajor = markerValue % labelInterval === 0

        return (
          <div
            key={markerValue}
            ref={(element) => {
              markerRefs.current[markerValue] = element
            }}
            className={`${styles.marker} ${isMajor ? '' : styles.minor}`}
            aria-hidden="true"
          >
            {isMajor && (
              <span className={styles.number}>{String(markerValue).padStart(2, '0')}</span>
            )}
            <span className={styles.tick} />
          </div>
        )
      })}
    </div>
  )
}

export default TimeRing
