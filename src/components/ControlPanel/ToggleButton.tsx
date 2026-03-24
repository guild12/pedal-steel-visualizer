interface ToggleButtonProps {
  label: string;
  engaged: boolean;
  onClick: () => void;
}

export function ToggleButton({ label, engaged, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      data-engaged={engaged ? 'true' : 'false'}
      className={`
        px-4 py-2 rounded font-mono text-sm font-bold transition-colors
        ${engaged
          ? 'bg-red-600 text-white border-2 border-red-400'
          : 'bg-gray-800 text-gray-300 border-2 border-gray-600 hover:border-gray-400'
        }
      `}
    >
      {label}
    </button>
  )
}
