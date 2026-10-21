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
    fire(type: string, e: Record<string, unknown>) {
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

  describe('touch', () => {
    const touch = (x: number, y: number) => ({ clientX: x, clientY: y })

    function setup(threshold = 80) {
      const target = makeTarget()
      const ref = { current: target.el }
      const onSwipeLeft = vi.fn()
      const onSwipeRight = vi.fn()
      renderHook(() => useHorizontalSwipe(ref, { onSwipeLeft, onSwipeRight, threshold }))
      return { target, onSwipeLeft, onSwipeRight }
    }

    it('fires onSwipeLeft (next) when the finger moves left past threshold', () => {
      const { target, onSwipeLeft, onSwipeRight } = setup()
      target.fire('touchstart', { touches: [touch(200, 100)] })
      target.fire('touchmove', { touches: [touch(100, 105)] })
      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('fires onSwipeRight (prev) when the finger moves right past threshold', () => {
      const { target, onSwipeLeft, onSwipeRight } = setup()
      target.fire('touchstart', { touches: [touch(100, 100)] })
      target.fire('touchmove', { touches: [touch(200, 95)] })
      expect(onSwipeRight).toHaveBeenCalledTimes(1)
      expect(onSwipeLeft).not.toHaveBeenCalled()
    })

    it('does not fire before threshold is reached', () => {
      const { target, onSwipeLeft, onSwipeRight } = setup()
      target.fire('touchstart', { touches: [touch(200, 100)] })
      target.fire('touchmove', { touches: [touch(150, 100)] })
      expect(onSwipeLeft).not.toHaveBeenCalled()
      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('does not fire on a vertical-dominant drag', () => {
      const { target, onSwipeLeft, onSwipeRight } = setup()
      target.fire('touchstart', { touches: [touch(200, 100)] })
      target.fire('touchmove', { touches: [touch(100, 400)] })
      expect(onSwipeLeft).not.toHaveBeenCalled()
      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('fires only once per touch, and again after touchend', () => {
      const { target, onSwipeLeft } = setup()
      target.fire('touchstart', { touches: [touch(300, 100)] })
      target.fire('touchmove', { touches: [touch(200, 100)] })
      target.fire('touchmove', { touches: [touch(100, 100)] })
      target.fire('touchmove', { touches: [touch(50, 100)] })
      expect(onSwipeLeft).toHaveBeenCalledTimes(1)

      target.fire('touchend', { touches: [] })
      target.fire('touchstart', { touches: [touch(300, 100)] })
      target.fire('touchmove', { touches: [touch(200, 100)] })
      expect(onSwipeLeft).toHaveBeenCalledTimes(2)
    })

    it('resets on touchcancel', () => {
      const { target, onSwipeLeft } = setup()
      target.fire('touchstart', { touches: [touch(300, 100)] })
      target.fire('touchmove', { touches: [touch(200, 100)] })
      target.fire('touchcancel', { touches: [] })
      // A move without a new touchstart must not fire.
      target.fire('touchmove', { touches: [touch(50, 100)] })
      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    })

    it('ignores two-finger touches', () => {
      const { target, onSwipeLeft, onSwipeRight } = setup()
      target.fire('touchstart', { touches: [touch(200, 100), touch(260, 100)] })
      target.fire('touchmove', { touches: [touch(50, 100), touch(110, 100)] })
      expect(onSwipeLeft).not.toHaveBeenCalled()
      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('ignores a gesture that becomes multi-touch mid-swipe', () => {
      const { target, onSwipeLeft, onSwipeRight } = setup()
      target.fire('touchstart', { touches: [touch(300, 100)] })
      target.fire('touchstart', { touches: [touch(300, 100), touch(340, 100)] })
      target.fire('touchmove', { touches: [touch(100, 100)] })
      expect(onSwipeLeft).not.toHaveBeenCalled()
      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('calls preventDefault only for horizontal-dominant moves beyond the slop', () => {
      const { target } = setup()
      const prevent = vi.fn()

      target.fire('touchstart', { touches: [touch(200, 100)] })
      // within slop
      target.fire('touchmove', { touches: [touch(195, 100)], preventDefault: prevent })
      // vertical-dominant
      target.fire('touchmove', { touches: [touch(180, 300)], preventDefault: prevent })
      expect(prevent).not.toHaveBeenCalled()

      // horizontal-dominant
      target.fire('touchmove', { touches: [touch(170, 110)], preventDefault: prevent })
      expect(prevent).toHaveBeenCalledTimes(1)
    })

    it('does not call preventDefault for multi-touch moves', () => {
      const { target } = setup()
      const prevent = vi.fn()
      target.fire('touchstart', { touches: [touch(200, 100), touch(260, 100)] })
      target.fire('touchmove', {
        touches: [touch(100, 100), touch(160, 100)],
        preventDefault: prevent,
      })
      expect(prevent).not.toHaveBeenCalled()
    })

    it('calls the latest callbacks after a re-render', () => {
      const target = makeTarget()
      const ref = { current: target.el }
      const first = vi.fn()
      const second = vi.fn()
      const { rerender } = renderHook(
        (props: { onSwipeLeft: () => void }) =>
          useHorizontalSwipe(ref, { ...props, onSwipeRight: vi.fn(), threshold: 80 }),
        { initialProps: { onSwipeLeft: first } },
      )
      rerender({ onSwipeLeft: second })
      target.fire('touchstart', { touches: [touch(200, 100)] })
      target.fire('touchmove', { touches: [touch(100, 100)] })
      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledTimes(1)
    })
  })
})
