import { readableTextColor } from '../../utils/controlColors'

interface ToggleButtonProps {
  label: string;
  engaged: boolean;
  color: string;
  onClick: () => void;
}

export function ToggleButton({ label, engaged, color, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      data-engaged={engaged ? 'true' : 'false'}
      style={engaged
        ? { backgroundColor: color, borderColor: color, color: readableTextColor(color) }
        : { borderColor: color, color }
      }
      className="px-4 py-2 rounded font-mono text-sm font-bold border-2 bg-gray-800 transition-colors"
    >
      {label}
    </button>
  )
}
