"use client";

import type { MarketPotential } from "@/types/cloud";
import FloatingCard from "./FloatingCard";

interface CloudContainerProps {
  potentials: MarketPotential[];
  onSelect: (potential: MarketPotential) => void;
}

export default function CloudContainer({
  potentials,
  onSelect,
}: CloudContainerProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {potentials.map((potential, i) => (
          <FloatingCard
            key={potential.entry.seriesId}
            potential={potential}
            index={i}
            onClick={() => onSelect(potential)}
          />
        ))}
      </div>
    </div>
  );
}
