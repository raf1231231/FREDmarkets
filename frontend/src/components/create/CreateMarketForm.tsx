import { CreateMarketFormState } from "@/types/template";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface CreateMarketFormProps {
  templateName: string;
  formState: CreateMarketFormState;
  onFieldChange: <K extends keyof CreateMarketFormState>(
    field: K,
    value: CreateMarketFormState[K]
  ) => void;
  onOutcomeLabelChange: (index: number, value: string) => void;
  onBack: () => void;
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

function ByteCounter({ value, max }: { value: string; max: number }) {
  const len = byteLength(value);
  const over = len > max;
  return (
    <span className={`text-xs ${over ? "text-red-600" : "text-fred-gray-600"}`}>
      {len}/{max}
    </span>
  );
}

const conditionTypeLabels: Record<string, string> = {
  thresholdAbove: "Threshold Above",
  thresholdBelow: "Threshold Below",
  exactRange: "Exact Range",
  changePercent: "Change Percent",
};

const INPUT =
  "w-full border border-fred-gray-300 rounded-[5px] px-3 py-2 text-sm focus:outline-none focus:border-fred-blue";
const INPUT_READONLY =
  "w-full border border-fred-gray-200 rounded-[5px] px-3 py-2 text-sm bg-fred-gray-100 cursor-not-allowed text-fred-gray-600";

export default function CreateMarketForm({
  templateName,
  formState,
  onFieldChange,
  onOutcomeLabelChange,
  onBack,
}: CreateMarketFormProps) {
  const dateError =
    formState.closesAt && formState.resolvesAt && formState.closesAt >= formState.resolvesAt;

  const rc = formState.resolutionCondition;
  const conditionSummary =
    rc.conditionType === "exactRange"
      ? `Range: ${rc.rangeLow} – ${rc.rangeHigh}, step ${rc.rangeStep}`
      : rc.conditionType === "changePercent"
        ? `Change: ${rc.rangeLow} to ${rc.rangeHigh} bps`
        : `${conditionTypeLabels[rc.conditionType]}: ${rc.thresholdValue}`;

  return (
    <div className="max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-fred-link hover:text-fred-link-hover mb-4 cursor-pointer"
      >
        &larr; Back to templates
      </button>

      <Card title={`Configuring: ${templateName}`}>
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* FRED Series ID */}
          <div>
            <label className="block text-sm font-medium text-fred-gray-800 mb-1">
              FRED Series ID
            </label>
            <input
              type="text"
              value={formState.fredSeriesId}
              readOnly
              className={INPUT_READONLY}
            />
            <p className="text-xs text-fred-gray-600 mt-1">
              Set by the template. Cannot be changed.
            </p>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-fred-gray-800">
                Market Title
              </label>
              <ByteCounter value={formState.title} max={128} />
            </div>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => onFieldChange("title", e.target.value)}
              className={INPUT}
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-fred-gray-800">
                Description
              </label>
              <ByteCounter value={formState.description} max={512} />
            </div>
            <textarea
              rows={4}
              value={formState.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* Market Type (display only) */}
          <div>
            <label className="block text-sm font-medium text-fred-gray-800 mb-1">
              Market Type
            </label>
            <div className="flex items-center gap-3">
              <span className="inline-block px-3 py-1 bg-fred-blue text-white text-sm rounded-[5px]">
                Multi-Outcome
              </span>
              <span className="text-sm text-fred-gray-600">
                {formState.numOutcomes} outcomes
              </span>
            </div>
          </div>

          {/* Outcome Labels */}
          <div>
            <label className="block text-sm font-medium text-fred-gray-800 mb-2">
              Outcome Labels
            </label>
            <div className="space-y-2">
              {formState.outcomeLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-fred-gray-600 w-5 text-right">
                    {i + 1}.
                  </span>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => onOutcomeLabelChange(i, e.target.value)}
                    className={`${INPUT} flex-1`}
                  />
                  <ByteCounter value={label} max={32} />
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Condition (read-only summary) */}
          <div>
            <label className="block text-sm font-medium text-fred-gray-800 mb-1">
              Resolution Condition
            </label>
            <div className="rounded-[5px] border border-fred-gray-200 bg-fred-gray-50 px-3 py-2 text-sm text-fred-gray-600">
              <div>Type: {conditionTypeLabels[rc.conditionType]}</div>
              <div>{conditionSummary}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-fred-gray-800 mb-1">
                Close Date
              </label>
              <input
                type="date"
                value={formState.closesAt}
                onChange={(e) => onFieldChange("closesAt", e.target.value)}
                className={INPUT}
              />
              <p className="text-xs text-fred-gray-600 mt-1">Trading ends</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-fred-gray-800 mb-1">
                Resolution Date
              </label>
              <input
                type="date"
                value={formState.resolvesAt}
                onChange={(e) => onFieldChange("resolvesAt", e.target.value)}
                className={INPUT}
              />
              <p className="text-xs text-fred-gray-600 mt-1">
                FRED data expected
              </p>
            </div>
          </div>
          {dateError && (
            <p className="text-xs text-red-600">
              Resolution date must be after close date.
            </p>
          )}

          {/* Resolution Source URL */}
          <div>
            <label className="block text-sm font-medium text-fred-gray-800 mb-1">
              Resolution Source
            </label>
            <input
              type="text"
              value={formState.resolutionSourceUrl}
              readOnly
              className={INPUT_READONLY}
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-fred-gray-200">
            <Button disabled size="lg" className="w-full">
              Propose Market (connect wallet)
            </Button>
            <p className="text-xs text-fred-gray-600 text-center mt-2">
              Requires a small SOL fee for anti-spam protection.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
