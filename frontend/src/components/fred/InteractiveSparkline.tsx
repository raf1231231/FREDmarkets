"use client";

/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useRef, useCallback } from "react";
import { FredObservation } from "@/types/fred";

interface InteractiveSparklineProps {
  observations: FredObservation[];
  width?: number;
  height?: number;
  className?: string;
}

export default function InteractiveSparkline({
  observations,
  width = 400,
  height = 180,
  className = "",
}: InteractiveSparklineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (observations.length < 2) return null;

  const values = observations.map((o) => parseFloat(o.value));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const range = maxVal - minVal;
  const padding = range === 0 ? 1 : range * 0.15;
  const paddedMin = minVal - padding;
  const paddedMax = maxVal + padding;
  const paddedRange = paddedMax - paddedMin;

  // Chart area (with margins for axes)
  const marginLeft = 45;
  const marginRight = 10;
  const marginTop = 10;
  const marginBottom = 30;
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;

  // Generate points for the line
  const points = values.map((v, i) => {
    const x = marginLeft + (i / (values.length - 1)) * chartWidth;
    const y = marginTop + (1 - (v - paddedMin) / paddedRange) * chartHeight;
    return { x, y, value: v, date: observations[i].date };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `${linePoints} ${marginLeft + chartWidth},${marginTop + chartHeight} ${marginLeft},${marginTop + chartHeight}`;

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = paddedMin + (paddedRange * i) / 4;
    const y = marginTop + chartHeight - (i / 4) * chartHeight;
    return { value, y };
  });

  // X-axis ticks (show first, middle, last dates)
  const xTicks = [
    { index: 0, label: formatDate(observations[0].date) },
    {
      index: Math.floor(observations.length / 2),
      label: formatDate(observations[Math.floor(observations.length / 2)].date),
    },
    {
      index: observations.length - 1,
      label: formatDate(observations[observations.length - 1].date),
    },
  ];

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      // Find closest point
      let closestIndex = 0;
      let closestDistance = Infinity;

      points.forEach((point, i) => {
        const distance = Math.abs(point.x - mouseX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });

      setHoveredIndex(closestIndex);
    },
    [points]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        className="cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-axis grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={marginLeft}
            y1={tick.y}
            x2={marginLeft + chartWidth}
            y2={tick.y}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* Area under the line */}
        <polygon
          points={areaPoints}
          fill="rgba(0, 56, 101, 0.08)"
          stroke="none"
        />

        {/* Main line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#003865"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === i ? 4 : 2}
            fill={hoveredIndex === i ? "#003865" : "#003865"}
            opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.3}
          />
        ))}

        {/* Crosshair on hover */}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={marginTop}
              x2={hoveredPoint.x}
              y2={marginTop + chartHeight}
              stroke="#003865"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />
          </>
        )}

        {/* Y-axis */}
        <line
          x1={marginLeft}
          y1={marginTop}
          x2={marginLeft}
          y2={marginTop + chartHeight}
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={marginLeft - 8}
            y={tick.y}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-[9px] fill-fred-gray-600"
          >
            {tick.value.toFixed(1)}
          </text>
        ))}

        {/* X-axis */}
        <line
          x1={marginLeft}
          y1={marginTop + chartHeight}
          x2={marginLeft + chartWidth}
          y2={marginTop + chartHeight}
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {/* X-axis labels */}
        {xTicks.map((tick) => {
          const x = marginLeft + (tick.index / (values.length - 1)) * chartWidth;
          return (
            <text
              key={tick.index}
              x={x}
              y={marginTop + chartHeight + 15}
              textAnchor="middle"
              className="text-[9px] fill-fred-gray-600"
            >
              {tick.label}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute bg-fred-navy text-white px-2 py-1.5 rounded shadow-lg text-xs pointer-events-none z-10"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 10}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-semibold">{hoveredPoint.value.toFixed(2)}</div>
          <div className="text-[10px] opacity-90">
            {formatDateFull(hoveredPoint.date)}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
