import {
  STAGE_WIDTH_RATIO,
  OUTER_MARGIN_RATIO,
  LANE_GAP_RATIO,
  GROUP_WIDTH_RATIO,
  FONT_HEIGHT_RATIO,
  RING_FONT_RATIO,
  RING_STEP_FONT_RATIO,
  MINOR_TICK_WIDTH_RATIO,
  MIN_VERTICAL_RADIUS_HEIGHT_RATIO,
  VERTICAL_GAP_FONT_RATIO,
  SAFETY_WIDTH_RATIO,
  TICK_FONT_RATIO,
  TEXT_GAP_FONT_RATIO,
  TICK_THICKNESS_FONT_RATIO,
  TICK_MIN_THICKNESS,
  TICK_MAX_THICKNESS,
  ELLIPSE_THRESHOLD,
  RING_COUNTS,
  RING_LABEL_INTERVALS,
} from '@/constants/clockGeometry'

export function measureNumberWidthRatio() {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) return 1.12

  const fontFamily =
    getComputedStyle(document.documentElement).getPropertyValue('--clock-font').trim() || 'Arial'

  context.font = `500 100px ${fontFamily}`

  const widestNumber = Math.max(
    ...Array.from(
      { length: 60 },
      (_, index) => context.measureText(String(index).padStart(2, '0')).width,
    ),
  )

  return widestNumber / 100
}

function rotatedGroupBounds(angle, group) {
  const sine = Math.sin(angle)
  const cosine = Math.cos(angle)
  const numberHalfWidth = (group.numberWidth * cosine + group.fontSize * sine) / 2
  const numberHalfHeight = (group.fontSize * cosine + group.numberWidth * sine) / 2
  const tickStart = group.numberWidth / 2 + group.textGap
  const tickEnd = tickStart + group.tickWidth
  const tickHalfWidth = (group.tickThickness * sine) / 2
  const tickHalfHeight = (group.tickThickness * cosine) / 2

  return {
    left: Math.min(-numberHalfWidth, tickStart * cosine - tickHalfWidth),
    right: Math.max(numberHalfWidth, tickEnd * cosine + tickHalfWidth),
    top: Math.min(-numberHalfHeight, tickStart * sine - tickHalfHeight),
    bottom: Math.max(numberHalfHeight, tickEnd * sine + tickHalfHeight),
  }
}

function fitsInsideLane(radius, laneWidth, height, group, safety) {
  const halfLane = laneWidth / 2

  for (let sample = 0; sample <= 40; sample += 1) {
    const y = (height / 2) * (sample / 40)
    const sine = y / radius
    const cosine = Math.sqrt(1 - sine * sine)
    const drift = radius * (1 - cosine)
    const bounds = rotatedGroupBounds(Math.asin(sine), group)
    const groupX = -group.shift - drift

    if (groupX + bounds.left < -halfLane + safety) return false
    if (groupX + bounds.right > halfLane - safety) return false
  }

  return true
}

function minimumFittingRadius(laneWidth, height, group, safety) {
  let lower = height / 2 + 0.001
  let upper = Math.max(height, group.fontSize)

  while (!fitsInsideLane(upper, laneWidth, height, group, safety)) {
    upper *= 2
  }

  for (let iteration = 0; iteration < 40; iteration += 1) {
    const middle = (lower + upper) / 2

    if (fitsInsideLane(middle, laneWidth, height, group, safety)) {
      upper = middle
    } else {
      lower = middle
    }
  }

  return upper
}

function maximumFittingHorizontalRadius(verticalRadius, laneWidth, height, group, safety) {
  const halfLane = laneWidth / 2
  const angleLimit = Math.asin(Math.min(1, height / (2 * verticalRadius)))
  let minimum = 0
  let maximum = verticalRadius

  for (let sample = 1; sample <= 40; sample += 1) {
    const angle = angleLimit * (sample / 40)
    const cosine = Math.cos(angle)
    const driftFactor = 1 - cosine
    const bounds = rotatedGroupBounds(angle, group)

    minimum = Math.max(minimum, (bounds.right - group.shift - halfLane + safety) / driftFactor)
    maximum = Math.min(maximum, (halfLane - safety - group.shift + bounds.left) / driftFactor)
  }

  return maximum >= minimum ? maximum : 0
}

function minimumReadableVerticalRadius(count, labelInterval, height, group, desiredRadius) {
  const halfStepAngle = (labelInterval * Math.PI) / count
  const minimumGap = group.fontSize * VERTICAL_GAP_FONT_RATIO

  const fitsVertically = (radius) => {
    for (let sample = 0; sample <= 40; sample += 1) {
      const sine = ((height / 2) * (sample / 40)) / radius
      const cosine = Math.sqrt(1 - sine * sine)
      const bounds = rotatedGroupBounds(Math.asin(sine), group)
      const rotatedHeight = bounds.bottom - bounds.top
      const separation = 2 * radius * Math.sin(halfStepAngle) * cosine

      if (separation < rotatedHeight + minimumGap) return false
    }

    return true
  }

  let lower = height / 2 + 0.001
  let upper = Math.max(height, desiredRadius)

  while (!fitsVertically(upper)) upper *= 2

  for (let iteration = 0; iteration < 40; iteration += 1) {
    const middle = (lower + upper) / 2

    if (fitsVertically(middle)) {
      upper = middle
    } else {
      lower = middle
    }
  }

  return upper
}

export function calculateClockGeometry(width, height, numberWidthRatio) {
  const stageWidth = width * STAGE_WIDTH_RATIO
  const outerMargin = stageWidth * OUTER_MARGIN_RATIO
  const gap = stageWidth * LANE_GAP_RATIO
  const laneWidth = (stageWidth - 2 * outerMargin - 2 * gap) / 3
  const fontSize = Math.min(
    (laneWidth * GROUP_WIDTH_RATIO) / (numberWidthRatio + TEXT_GAP_FONT_RATIO + TICK_FONT_RATIO),
    height * FONT_HEIGHT_RATIO,
  )
  const ringFontSize = fontSize * RING_FONT_RATIO
  const numberWidth = ringFontSize * numberWidthRatio
  const textGap = ringFontSize * TEXT_GAP_FONT_RATIO
  const tickWidth = ringFontSize * TICK_FONT_RATIO
  const tickThickness = Math.min(
    TICK_MAX_THICKNESS,
    Math.max(TICK_MIN_THICKNESS, ringFontSize * TICK_THICKNESS_FONT_RATIO),
  )
  const numberOffset = numberWidth / 2 + textGap + tickWidth
  const groupShift = (textGap + tickWidth) / 2
  const group = {
    numberWidth,
    fontSize: ringFontSize,
    textGap,
    tickWidth,
    tickThickness,
    shift: groupShift,
  }
  const desiredStep = fontSize * RING_STEP_FONT_RATIO
  const safety = stageWidth * SAFETY_WIDTH_RATIO
  const fittingRadius = minimumFittingRadius(laneWidth, height, group, safety)

  const rings = Object.fromEntries(
    Object.entries(RING_COUNTS).map(([type, count]) => {
      const labelInterval = RING_LABEL_INTERVALS[type]
      const spacingRadius = (count * desiredStep) / (2 * Math.PI)
      const readableRadius = minimumReadableVerticalRadius(
        count,
        labelInterval,
        height,
        group,
        spacingRadius,
      )
      const baseRadius = Math.max(
        height * MIN_VERTICAL_RADIUS_HEIGHT_RATIO,
        spacingRadius,
        readableRadius,
      )
      const useEllipse = fittingRadius > baseRadius * ELLIPSE_THRESHOLD
      const verticalRadius = useEllipse ? baseRadius : Math.max(baseRadius, fittingRadius)
      const horizontalRadius = useEllipse
        ? maximumFittingHorizontalRadius(verticalRadius, laneWidth, height, group, safety)
        : verticalRadius
      return [type, { count, labelInterval, horizontalRadius, verticalRadius }]
    }),
  )

  return {
    stageWidth,
    outerMargin,
    gap,
    laneWidth,
    ringFontSize,
    numberOffset,
    groupShift,
    tickWidth,
    tickThickness,
    minorTickWidthRatio: MINOR_TICK_WIDTH_RATIO,
    rings,
  }
}
