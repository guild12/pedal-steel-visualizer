import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface SwipeOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
  idleResetMs?: number
}

export function useHorizontalSwipe(
  ref: RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight, threshold = 80, idleResetMs = 300 }: SwipeOptions,
) {
  const accum = useRef(0)
  const fired = useRef(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Latest-callback ref: updated every render so the once-subscribed listener
  // always calls the current handlers without needing to re-subscribe.
  const callbacks = useRef({ onSwipeLeft, onSwipeRight })
  callbacks.current = { onSwipeLeft, onSwipeRight }

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

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [ref, threshold, idleResetMs])
}
