/**
 * useSwipeDismiss — hand-rolled drag-to-dismiss for a Radix SheetContent.
 *
 * Touch-only (no-op for mouse / non-coarse pointers). Adds an inline transform
 * while dragging and a `data-dragging` attribute so the CSS slide transition is
 * disabled mid-drag (see sheet.tsx `data-[dragging]:transition-none`). On commit
 * the inline transform is cleared FIRST so Radix can play its own slide-out.
 *
 * No dependencies. Desktop is untouched: every handler bails before doing work
 * when the pointer is not coarse.
 */
import { useCallback, useRef } from 'react'

type Axis = 'x' | 'y'
type Dir = 'down' | 'left'

interface UseSwipeDismissOptions {
  axis: Axis
  dir: Dir
  onDismiss: () => void
  /** Fraction of the element size that must be dragged to commit. */
  distancePct?: number
  /** Min flick speed (px/ms) in the dismiss direction to commit. */
  velocity?: number
  /** Scroll container to gate vertical drags (only allowed at scrollTop<=0). */
  getScrollEl?: () => HTMLElement | null
  /** CSS selector for a grab handle that always allows a drag to start. */
  handleSelector?: string
}

interface DragState {
  startX: number
  startY: number
  startTime: number
  /** null = undecided, true = this gesture is a dismiss drag, false = abandoned */
  active: boolean | null
}

const isCoarsePointer = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches

export function useSwipeDismiss({
  axis,
  dir,
  onDismiss,
  distancePct,
  velocity = 0.5,
  getScrollEl,
  handleSelector,
}: UseSwipeDismissOptions) {
  const ref = useRef<HTMLDivElement | null>(null)
  const drag = useRef<DragState | null>(null)
  const pct = distancePct ?? (axis === 'y' ? 0.3 : 0.4)

  const setTransform = useCallback((value: string | null) => {
    const el = ref.current
    if (!el) return
    el.style.transform = value ?? ''
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isCoarsePointer() || e.touches.length !== 1) return
      const t = e.touches[0]

      // Scroll-guard: for axis 'x' there is no scrollTop requirement (rely on
      // axis-lock). For axis 'y' allow only when scrolled to top OR the touch
      // began inside the grab handle.
      if (axis === 'y') {
        const onHandle = !!handleSelector && !!(e.target as Element)?.closest?.(handleSelector)
        const atTop = (getScrollEl?.()?.scrollTop ?? 0) <= 0
        if (!atTop && !onHandle) return
      }

      drag.current = {
        startX: t.clientX,
        startY: t.clientY,
        startTime: Date.now(),
        active: null,
      }
    },
    [axis, getScrollEl, handleSelector]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const d = drag.current
      if (!d || d.active === false) return
      const t = e.touches[0]
      const dx = t.clientX - d.startX
      const dy = t.clientY - d.startY

      // Axis-lock on first meaningful move.
      if (d.active === null) {
        const absX = Math.abs(dx)
        const absY = Math.abs(dy)
        if (absX < 6 && absY < 6) return
        const onAxis = axis === 'y' ? absY >= absX : absX >= absY
        if (!onAxis) {
          d.active = false // dominant on off-axis → let native scroll happen
          return
        }
        d.active = true
        ref.current?.setAttribute('data-dragging', '')
      }

      // Clamp so we can't over-drag past origin.
      if (axis === 'y') {
        const offset = dir === 'down' ? Math.max(0, dy) : 0
        setTransform(`translateY(${offset}px)`)
      } else {
        const offset = dir === 'left' ? Math.min(0, dx) : 0
        setTransform(`translateX(${offset}px)`)
      }
    },
    [axis, dir, setTransform]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const d = drag.current
      drag.current = null
      if (!d || d.active !== true) return

      const el = ref.current
      const t = e.changedTouches[0]
      const dx = t.clientX - d.startX
      const dy = t.clientY - d.startY
      const elapsed = Math.max(1, Date.now() - d.startTime)

      const size = axis === 'y' ? (el?.offsetHeight ?? 0) : (el?.offsetWidth ?? 0)
      const travel = axis === 'y' ? dy : -dx // positive = toward dismiss dir
      const speed = travel / elapsed
      const commit = travel > pct * size || speed > velocity

      if (commit) {
        // Clear inline transform FIRST so Radix plays its own slide-out.
        setTransform(null)
        el?.removeAttribute('data-dragging')
        onDismiss()
      } else {
        // Snap back: re-enable CSS transition by removing data-dragging.
        el?.removeAttribute('data-dragging')
        setTransform(null)
      }
    },
    [axis, pct, velocity, onDismiss, setTransform]
  )

  return { ref, onTouchStart, onTouchMove, onTouchEnd }
}
