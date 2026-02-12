import { FredObservation } from "@/types/fred";

interface FredSparklineProps {
  observations: FredObservation[];
  width?: number;
  height?: number;
  className?: string;
}

export default function FredSparkline({
  observations,
  width = 200,
  height = 48,
  className = "",
}: FredSparklineProps) {
  if (observations.length < 2) return null;

  const values = observations.map((o) => parseFloat(o.value));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const range = maxVal - minVal;
  const padding = range === 0 ? 1 : range * 0.05;
  const paddedMin = minVal - padding;
  const paddedMax = maxVal + padding;
  const paddedRange = paddedMax - paddedMin;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - paddedMin) / paddedRange) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const polygonPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className={className}
      preserveAspectRatio="none"
    >
      <polygon
        points={polygonPoints}
        fill="rgba(0, 56, 101, 0.08)"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#003865"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
