import { useEffect, useRef, useState } from 'react'
import TimeRing from '@/components/TimeRing/TimeRing'
import { calculateClockGeometry, measureNumberWidthRatio } from '@/utils/clockGeometry'
import styles from '@/components/Layout/index.module.less'

function Layout() {
  const rootRef = useRef(null)
  const [geometry, setGeometry] = useState(() =>
    calculateClockGeometry(window.innerWidth, window.innerHeight, measureNumberWidthRatio()),
  )

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect

      setGeometry(calculateClockGeometry(width, height, measureNumberWidthRatio()))
    })

    observer.observe(rootRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.guide} />
      <div
        className={styles.stage}
        style={{
          width: geometry.stageWidth,
          paddingInline: geometry.outerMargin,
          gap: geometry.gap,
        }}
      >
        {['hour', 'minute', 'second'].map((type) => (
          <div key={type} className={styles.lane}>
            <TimeRing
              type={type}
              {...geometry.rings[type]}
              ringFontSize={geometry.ringFontSize}
              numberOffset={geometry.numberOffset}
              groupShift={geometry.groupShift}
              tickWidth={geometry.tickWidth}
              tickThickness={geometry.tickThickness}
              minorTickWidthRatio={geometry.minorTickWidthRatio}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Layout
