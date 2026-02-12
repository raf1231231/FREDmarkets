"use client";

import { CLOUD_CATEGORIES } from "@/data/seriesCatalog";
import type { MarketPotential } from "@/types/cloud";

interface TableViewProps {
  potentials: MarketPotential[];
  onSelect: (potential: MarketPotential) => void;
}

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  perFomc: "FOMC",
};

export default function TableView({ potentials, onSelect }: TableViewProps) {
  return (
    <div className="flex-1 overflow-auto px-6 pb-6">
      <div className="bg-white rounded-[5px] border border-fred-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-fred-gray-50 border-b border-fred-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-fred-gray-700 px-4 py-3 uppercase tracking-wider">
                Category
              </th>
              <th className="text-left text-xs font-semibold text-fred-gray-700 px-4 py-3 uppercase tracking-wider">
                Market
              </th>
              <th className="text-left text-xs font-semibold text-fred-gray-700 px-4 py-3 uppercase tracking-wider">
                Current Value
              </th>
              <th className="text-left text-xs font-semibold text-fred-gray-700 px-4 py-3 uppercase tracking-wider">
                Frequency
              </th>
              <th className="text-left text-xs font-semibold text-fred-gray-700 px-4 py-3 uppercase tracking-wider">
                Outcomes
              </th>
              <th className="text-right text-xs font-semibold text-fred-gray-700 px-4 py-3 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fred-gray-100">
            {potentials.map((potential) => {
              const { entry, derivedMetricLabel, outcomes } = potential;
              const categoryMeta = CLOUD_CATEGORIES[entry.category];

              return (
                <tr
                  key={entry.seriesId}
                  className="hover:bg-fred-gray-50 transition-colors"
                >
                  {/* Category */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: categoryMeta.color }}
                      />
                      <div>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: categoryMeta.color + "15",
                            color: categoryMeta.color,
                          }}
                        >
                          {categoryMeta.label}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Market name + tier */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-semibold text-fred-gray-800">
                          {entry.name}
                        </p>
                        <p className="text-[10px] font-mono text-fred-gray-600">
                          {entry.seriesId}
                        </p>
                      </div>
                      {entry.tier === 1 && (
                        <span className="text-[9px] font-bold text-fred-link bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                          T1
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Current value */}
                  <td className="px-4 py-3">
                    <span className="text-base font-bold text-fred-navy">
                      {derivedMetricLabel}
                    </span>
                  </td>

                  {/* Frequency */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-fred-gray-700">
                      {frequencyLabels[entry.frequency]}
                    </span>
                  </td>

                  {/* Outcomes */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-fred-gray-700">
                      {outcomes.length}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelect(potential)}
                      className="text-sm font-semibold text-fred-link hover:text-fred-link-hover transition-colors"
                    >
                      Sponsor
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
