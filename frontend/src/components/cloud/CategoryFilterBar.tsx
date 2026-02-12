"use client";

import {
  CLOUD_CATEGORIES,
  CLOUD_CATEGORY_ORDER,
  type CloudCategory,
} from "@/data/seriesCatalog";

interface CategoryFilterBarProps {
  active: CloudCategory | "all";
  onChange: (cat: CloudCategory | "all") => void;
  counts: Record<CloudCategory | "all", number>;
}

export default function CategoryFilterBar({
  active,
  onChange,
  counts,
}: CategoryFilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-3 px-1 scrollbar-hide">
      <FilterPill
        label="All"
        count={counts.all || 0}
        color="#6b7280"
        isActive={active === "all"}
        onClick={() => onChange("all")}
      />
      {CLOUD_CATEGORY_ORDER.map((cat) => {
        const meta = CLOUD_CATEGORIES[cat];
        return (
          <FilterPill
            key={cat}
            label={meta.label}
            count={counts[cat] || 0}
            color={meta.color}
            isActive={active === cat}
            onClick={() => onChange(cat)}
          />
        );
      })}
    </div>
  );
}

function FilterPill({
  label,
  count,
  color,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
      style={{
        backgroundColor: isActive ? color : "white",
        color: isActive ? "white" : "#343a40",
        borderColor: isActive ? color : "#dee2e6",
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: isActive ? "white" : color }}
      />
      {label}
      <span
        className="text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
        style={{
          backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#f1f3f5",
          color: isActive ? "white" : "#6c757d",
        }}
      >
        {count}
      </span>
    </button>
  );
}
