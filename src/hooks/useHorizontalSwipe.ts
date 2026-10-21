import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface SwipeOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
  idleResetMs?: number
}

// Minimum horizontal travel before a touch is treated as a horizontal gesture
// (and the page's native scroll is suppressed).
const TOUCH_SLOP = 10

export function useHorizontalSwipe(
  ref: RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight, threshold = 80, idleResetMs = 300 }: SwipeOptions,
) {
  const accum = useRef(0)
  const fired = useRef(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Latest-callback ref: updated after every render so the once-subscribed
  // listeners always call the current handlers without needing to re-subscribe.
  const callbacks = useRef({ onSwipeLeft, onSwipeRight })
  useLayoutEffect(() => {
    callbacks.current = { onSwipeLeft, onSwipeRight }
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // pinch-zoom
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return // vertical-dominant

      e.preventDefault() // stop the browser back/forward gesture
      accum.current += e.deltaX

      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => {
        accum.current = 0
        fired.current = false
      }, idleResetMs)

      if (!fired.current && Math.abs(accum.current) >= threshold) {
        fired.current = true
        if (accum.current > 0) callbacks.current.onSwipeLeft()
        else callbacks.current.onSwipeRight()
      }
    }

    // Touch gesture state: null when no single-finger gesture is in progress.
    let touchStart: { x: number; y: number } | null = null
    let touchFired = false
    let touchMulti = false

    const resetTouch = () => {
      touchStart = null
      touchFired = false
      touchMulti = false
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        // Multi-touch (pinch): ignore for the rest of this gesture.
        touchStart = null
        touchMulti = true
        return
      }
      if (touchMulti) return
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      touchFired = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchStart = null
        touchMulti = true
        return
      }
      if (!touchStart) return

      const dx = e.touches[0].clientX - touchStart.x
      const dy = e.touches[0].clientY - touchStart.y
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) <= TOUCH_SLOP) return // vertical-dominant or within slop

      e.preventDefault() // keep the page from scrolling sideways

      if (!touchFired && Math.abs(dx) >= threshold) {
        touchFired = true
        if (dx < 0) callbacks.current.onSwipeLeft()
        else callbacks.current.onSwipeRight()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      // Only reset once all fingers are lifted.
      if (e.touches.length === 0) resetTouch()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [ref, threshold, idleResetMs])
}
