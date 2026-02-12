"use client";

interface OddsSliderProps {
  label: string;
  value: number; // basis points (0-10000)
  onChange: (newValue: number) => void;
  color: string;
  hidePercentage?: boolean;
}

export default function OddsSlider({
  label,
  value,
  onChange,
  color,
  hidePercentage = false,
}: OddsSliderProps) {
  const percent = (value / 100).toFixed(1);

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm text-fred-gray-800 w-28 shrink-0 truncate">
          {label}
        </span>
      )}
      <input
        type="range"
        min={100}
        max={9000}
        step={50}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value / 100}%, #e9ecef ${value / 100}%)`,
        }}
      />
      {!hidePercentage && (
        <span className="text-sm font-mono font-semibold w-14 text-right text-fred-gray-800">
          {percent}%
        </span>
      )}
    </div>
  );
}
