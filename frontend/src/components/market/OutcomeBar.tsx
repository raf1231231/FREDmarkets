interface OutcomeBarProps {
  label: string;
  probability: number; // 0-100
}

export default function OutcomeBar({ label, probability }: OutcomeBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-fred-gray-800 w-28 truncate">{label}</span>
      <div className="flex-1 bg-fred-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-fred-blue h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, probability))}%` }}
        />
      </div>
      <span className="text-sm font-medium text-fred-gray-800 w-14 text-right">
        {probability.toFixed(1)}%
      </span>
    </div>
  );
}
