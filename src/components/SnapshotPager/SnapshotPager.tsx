interface SnapshotPagerProps {
  count: number
  activeIndex: number
  onGo: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onAdd: () => void
  onDeleteCurrent: () => void
}

export function SnapshotPager({
  count,
  activeIndex,
  onGo,
  onPrev,
  onNext,
  onAdd,
  onDeleteCurrent,
}: SnapshotPagerProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous snapshot"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white"
        onClick={onPrev}
      >
        ‹
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Snapshot ${i + 1}`}
            aria-current={i === activeIndex}
            className={`w-2.5 h-2.5 rounded-full ${
              i === activeIndex ? 'bg-white' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            onClick={() => onGo(i)}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Next snapshot"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white"
        onClick={onNext}
      >
        ›
      </button>

      <button
        type="button"
        aria-label="Add snapshot"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white"
        onClick={onAdd}
      >
        +
      </button>

      <button
        type="button"
        aria-label="Delete current snapshot"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-40"
        disabled={count <= 1}
        onClick={onDeleteCurrent}
      >
        ×
      </button>
    </div>
  )
}
