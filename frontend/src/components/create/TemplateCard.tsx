import { MarketTemplate, DataFrequency } from "@/types/template";
import FredLatestValue from "@/components/fred/FredLatestValue";

const frequencyBadge: Record<DataFrequency, { label: string; className: string }> = {
  monthly: { label: "Monthly", className: "bg-blue-50 text-blue-700" },
  quarterly: { label: "Quarterly", className: "bg-amber-50 text-amber-700" },
  perFomc: { label: "Per FOMC", className: "bg-purple-50 text-purple-700" },
};

interface TemplateCardProps {
  template: MarketTemplate;
  onClick: () => void;
}

export default function TemplateCard({ template, onClick }: TemplateCardProps) {
  const badge = frequencyBadge[template.frequency];

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left bg-fred-white rounded-[5px] border border-fred-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
    >
      <h3 className="text-sm font-semibold text-fred-navy leading-snug">
        {template.seriesName}
      </h3>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono text-fred-gray-600">
          {template.fredSeriesId}
        </span>
        <FredLatestValue seriesId={template.fredSeriesId} />
      </div>

      <p className="text-sm text-fred-gray-800 mb-3 leading-snug">
        {template.sampleQuestion}
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {template.defaultOutcomeLabels.map((label, i) => (
          <span
            key={i}
            className="inline-block px-2 py-0.5 bg-fred-gray-100 text-fred-gray-800 text-xs rounded"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-fred-gray-600">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
        <span>{template.numOutcomes} outcomes</span>
      </div>
    </button>
  );
}
