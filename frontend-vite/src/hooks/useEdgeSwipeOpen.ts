/**
 * useEdgeSwipeOpen — left-edge swipe to open a mobile off-canvas sidebar.
 *
 * Touch-only and mobile-only: gated to `(max-width: 767px)` AND `(pointer: coarse)`,
 * so it never fires on desktop. The arm band starts at 12px (not 0) to avoid
 * colliding with iOS Safari's own back-swipe gesture at the very edge.
 *
 * No dependencies. Listeners are attached at the document level and cleaned up
 * on unmount / when `enabled` flips.
 */
import { useEffect, useRef } from 'react'

interface UseEdgeSwipeOpenOptions {
  onOpen: () => void
  enabled?: boolean
}

const EDGE_MIN = 12 // skip 0..12px (iOS back-gesture zone)
const EDGE_MAX = 30 // arm only within 12..30px from the left edge
const DX_COMMIT = 60 // distance-based commit
const DX_FLICK = 30 // distance floor for a fast flick
const SPEED_FLICK = 0.4 // px/ms flick threshold

export function useEdgeSwipeOpen({ onOpen, enabled = true }: UseEdgeSwipeOpenOptions) {
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    if (!isMobile || !isCoarse) return

    let startX = 0
    let startY = 0
    let startTime = 0
    let armed = false

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        armed = false
        return
      }
      const t = e.touches[0]
      armed = t.clientX >= EDGE_MIN && t.clientX <= EDGE_MAX
      startX = t.clientX
      startY = t.clientY
      startTime = Date.now()
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!armed) return
      armed = false
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      if (Math.abs(dx) <= Math.abs(dy)) return // must be horizontal-dominant
      const speed = dx / Math.max(1, Date.now() - startTime)
      if (dx > DX_COMMIT || (speed > SPEED_FLICK && dx > DX_FLICK)) {
        onOpenRef.current()
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled])
}
