import { useState } from 'react'

export const HINTS_DISMISSED_KEY = 'psv-hints-dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(HINTS_DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

interface HintStripProps {
  pedalCount: number;
}

/** One-time orientation for first-run users. Dismissal is remembered per browser. */
export function HintStrip({ pedalCount }: HintStripProps) {
  const [dismissed, setDismissed] = useState(readDismissed)
  if (dismissed) return null

  const pedalKeys = pedalCount <= 1 ? '1' : `1–${Math.min(pedalCount, 9)}`

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(HINTS_DISMISSED_KEY, 'true')
    } catch {
      // Private mode or blocked storage: the strip just comes back next visit.
    }
  }

  return (
    <div
      role="note"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2"
    >
      <span className="text-gray-500 uppercase tracking-wider text-[10px]">Quick start</span>
      <span><b className="text-gray-200">Click a fret</b> to place the bar</span>
      <span><b className="text-gray-200">Press {pedalKeys}</b> or the buttons below for pedals</span>
      <span><b className="text-gray-200">Swipe or use ‹ ›</b> to page snapshots</span>
      <span><b className="text-gray-200">Esc</b> clears</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss quick start"
        className="ml-auto text-gray-500 hover:text-gray-200 px-1"
      >
        ×
      </button>
    </div>
  )
}
