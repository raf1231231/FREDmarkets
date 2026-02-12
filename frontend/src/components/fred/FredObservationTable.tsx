"use client";

import { useFredObservations } from "@/hooks/useFredObservations";
import Card from "@/components/ui/Card";
import FredLoadingSkeleton from "./FredLoadingSkeleton";

interface FredObservationTableProps {
  seriesId: string;
  limit?: number;
  className?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function formatValue(valStr: string): string {
  const n = parseFloat(valStr);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 3,
  });
}

export default function FredObservationTable({
  seriesId,
  limit = 10,
  className = "",
}: FredObservationTableProps) {
  const { observations, loading, error } = useFredObservations(seriesId, limit);

  if (loading) {
    return (
      <Card title="Recent Observations" className={className}>
        <FredLoadingSkeleton variant="table" />
      </Card>
    );
  }

  if (error || observations.length === 0) {
    return (
      <Card title="Recent Observations" className={className}>
        <p className="text-sm text-fred-gray-600 text-center py-4">
          {error ? "Unable to load observations." : "No observations available."}
        </p>
      </Card>
    );
  }

  const rows = [...observations].reverse();

  return (
    <Card title="Recent Observations" className={className}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-fred-gray-200">
            <th className="text-left py-1.5 text-xs font-medium text-fred-gray-600 uppercase tracking-wider">
              Date
            </th>
            <th className="text-right py-1.5 text-xs font-medium text-fred-gray-600 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((obs) => (
            <tr
              key={obs.date}
              className="border-b border-fred-gray-100 last:border-0"
            >
              <td className="py-1.5 text-fred-gray-800">
                {formatDate(obs.date)}
              </td>
              <td className="py-1.5 text-right font-mono text-fred-gray-800">
                {formatValue(obs.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
