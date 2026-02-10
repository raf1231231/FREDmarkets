// On-chain enum mirrors (from market.rs:108-122)

export type ConditionType =
  | "thresholdAbove"
  | "thresholdBelow"
  | "exactRange"
  | "changePercent";

export type Comparison =
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "equal";

export type TemplateCategory = "inflation" | "employment" | "gdp" | "fedPolicy";

export type DataFrequency = "monthly" | "quarterly" | "perFomc";

export interface ResolutionConditionInput {
  conditionType: ConditionType;
  thresholdValue: number;
  comparison: Comparison;
  rangeLow: number;
  rangeHigh: number;
  rangeStep: number;
  observationDate: number;
}

export interface MarketTemplate {
  id: string;
  category: TemplateCategory;
  fredSeriesId: string;
  seriesName: string;
  sampleQuestion: string;
  frequency: DataFrequency;
  marketType: "multiOutcome";
  numOutcomes: number;
  defaultOutcomeLabels: string[];
  defaultResolutionCondition: Omit<ResolutionConditionInput, "observationDate">;
  defaultTitle: string;
  defaultDescription: string;
  resolutionSourceUrl: string;
  closesAtOffsetDays: number;
  resolvesAtOffsetDays: number;
}

export interface CreateMarketFormState {
  templateId: string;
  fredSeriesId: string;
  title: string;
  description: string;
  marketType: "multiOutcome";
  numOutcomes: number;
  outcomeLabels: string[];
  resolutionCondition: ResolutionConditionInput;
  resolutionSourceUrl: string;
  closesAt: string;
  resolvesAt: string;
}
