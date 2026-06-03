import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHorizontalSwipe } from './useHorizontalSwipe'

function makeTarget() {
  const listeners: Record<string, ((e: Event) => void)[]> = {}
  return {
    el: {
      addEventListener: (type: string, fn: (e: Event) => void) => {
        ;(listeners[type] ??= []).push(fn)
      },
      removeEventListener: (type: string, fn: (e: Event) => void) => {
        listeners[type] = (listeners[type] ?? []).filter(f => f !== fn)
      },
    } as unknown as HTMLElement,
    fire(type: string, e: Partial<WheelEvent>) {
      for (const fn of listeners[type] ?? []) fn({ preventDefault: () => {}, ...e } as Event)
    },
  }
}

describe('useHorizontalSwipe', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires onSwipeLeft once when deltaX exceeds threshold', () => {
    const target = makeTarget()
    const ref = { current: target.el }
    const onSwipeLeft = vi.fn()
    renderHook(() => useHorizontalSwipe(ref, { onSwipeLeft, onSwipeRight: vi.fn(), threshold: 80 }))
    target.fire('wheel', { deltaX: 50, deltaY: 0, ctrlKey: false })
    target.fire('wheel', { deltaX: 50, deltaY: 0, ctrlKey: false })
    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
  })

  it('ignores pinch-zoom (ctrlKey) and vertical-dominant scroll', () => {
    const target = makeTarget()
    const ref = { current: target.el }
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    renderHook(() => useHorizontalSwipe(ref, { onSwipeLeft, onSwipeRight, threshold: 80 }))
    target.fire('wheel', { deltaX: 100, deltaY: 0, ctrlKey: true })
    target.fire('wheel', { deltaX: 10, deltaY: 200, ctrlKey: false })
    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('fires onSwipeRight for negative deltaX', () => {
    const target = makeTarget()
    const ref = { current: target.el }
    const onSwipeRight = vi.fn()
    renderHook(() => useHorizontalSwipe(ref, { onSwipeLeft: vi.fn(), onSwipeRight, threshold: 80 }))
    target.fire('wheel', { deltaX: -90, deltaY: 0, ctrlKey: false })
    expect(onSwipeRight).toHaveBeenCalledTimes(1)
  })

  it('still fires later swipes after a re-render with new callbacks (idle reset survives re-render)', () => {
    const target = makeTarget()
    const ref = { current: target.el }
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { rerender } = renderHook(
      (props: { onSwipeLeft: () => void; onSwipeRight: () => void }) =>
        useHorizontalSwipe(ref, { ...props, threshold: 80, idleResetMs: 300 }),
      { initialProps: { onSwipeLeft, onSwipeRight } },
    )

    target.fire('wheel', { deltaX: 100, deltaY: 0, ctrlKey: false })
    expect(onSwipeLeft).toHaveBeenCalledTimes(1)

    // App re-renders with brand-new callback identities every render:
    const onSwipeLeft2 = vi.fn()
    const onSwipeRight2 = vi.fn()
    rerender({ onSwipeLeft: onSwipeLeft2, onSwipeRight: onSwipeRight2 })

    // idle reset should elapse and clear the accumulator / fired flag
    vi.advanceTimersByTime(400)

    target.fire('wheel', { deltaX: -100, deltaY: 0, ctrlKey: false })
    expect(onSwipeRight2).toHaveBeenCalledTimes(1)
  })
})
