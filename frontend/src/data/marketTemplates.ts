import {
  MarketTemplate,
  TemplateCategory,
  CreateMarketFormState,
} from "@/types/template";

export const CATEGORY_META: Record<TemplateCategory, { label: string }> = {
  inflation: { label: "Inflation" },
  employment: { label: "Employment" },
  gdp: { label: "GDP" },
  fedPolicy: { label: "Fed Policy" },
};

export const CATEGORY_ORDER: TemplateCategory[] = [
  "inflation",
  "employment",
  "gdp",
  "fedPolicy",
];

export const MARKET_TEMPLATES: MarketTemplate[] = [
  {
    id: "cpi-all-items",
    category: "inflation",
    fredSeriesId: "CPIAUCSL",
    seriesName: "CPI All Items",
    sampleQuestion: "What will CPI YoY% be for the next release?",
    frequency: "monthly",
    marketType: "multiOutcome",
    numOutcomes: 4,
    defaultOutcomeLabels: ["<2.5%", "2.5-3.0%", "3.0-3.5%", ">3.5%"],
    defaultResolutionCondition: {
      conditionType: "exactRange",
      thresholdValue: 0,
      comparison: "greaterThanOrEqual",
      rangeLow: 0,
      rangeHigh: 5.0,
      rangeStep: 0.5,
    },
    defaultTitle: "CPI All Items YoY% — Next Release",
    defaultDescription:
      "Prediction market on the Consumer Price Index (All Urban Consumers) year-over-year percentage change for the upcoming BLS release. Resolves based on the seasonally adjusted CPI-U figure published by the Bureau of Labor Statistics.",
    resolutionSourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    closesAtOffsetDays: 25,
    resolvesAtOffsetDays: 40,
  },
  {
    id: "core-cpi",
    category: "inflation",
    fredSeriesId: "CPILFESL",
    seriesName: "Core CPI",
    sampleQuestion: "What will Core CPI YoY% be for the next release?",
    frequency: "monthly",
    marketType: "multiOutcome",
    numOutcomes: 4,
    defaultOutcomeLabels: ["<2.5%", "2.5-3.0%", "3.0-3.5%", ">3.5%"],
    defaultResolutionCondition: {
      conditionType: "exactRange",
      thresholdValue: 0,
      comparison: "greaterThanOrEqual",
      rangeLow: 0,
      rangeHigh: 5.0,
      rangeStep: 0.5,
    },
    defaultTitle: "Core CPI YoY% — Next Release",
    defaultDescription:
      "Prediction market on Core CPI (All Items Less Food and Energy) year-over-year percentage change. Resolves based on the seasonally adjusted figure published by the Bureau of Labor Statistics via FRED.",
    resolutionSourceUrl: "https://fred.stlouisfed.org/series/CPILFESL",
    closesAtOffsetDays: 25,
    resolvesAtOffsetDays: 40,
  },
  {
    id: "nonfarm-payrolls",
    category: "employment",
    fredSeriesId: "PAYEMS",
    seriesName: "Nonfarm Payrolls",
    sampleQuestion: "How many jobs will the next NFP report show?",
    frequency: "monthly",
    marketType: "multiOutcome",
    numOutcomes: 4,
    defaultOutcomeLabels: ["<100K", "100-175K", "175-250K", ">250K"],
    defaultResolutionCondition: {
      conditionType: "exactRange",
      thresholdValue: 0,
      comparison: "greaterThanOrEqual",
      rangeLow: 0,
      rangeHigh: 400,
      rangeStep: 75,
    },
    defaultTitle: "Nonfarm Payrolls Change — Next Release",
    defaultDescription:
      "Prediction market on the month-over-month change in Total Nonfarm Payrolls (in thousands). Resolves based on the initial estimate published by the Bureau of Labor Statistics.",
    resolutionSourceUrl: "https://fred.stlouisfed.org/series/PAYEMS",
    closesAtOffsetDays: 25,
    resolvesAtOffsetDays: 40,
  },
  {
    id: "unemployment-rate",
    category: "employment",
    fredSeriesId: "UNRATE",
    seriesName: "Unemployment Rate",
    sampleQuestion: "What will the unemployment rate be next month?",
    frequency: "monthly",
    marketType: "multiOutcome",
    numOutcomes: 4,
    defaultOutcomeLabels: ["<3.5%", "3.5-4.0%", "4.0-4.5%", ">4.5%"],
    defaultResolutionCondition: {
      conditionType: "exactRange",
      thresholdValue: 0,
      comparison: "greaterThanOrEqual",
      rangeLow: 2.0,
      rangeHigh: 6.0,
      rangeStep: 0.5,
    },
    defaultTitle: "Unemployment Rate — Next Release",
    defaultDescription:
      "Prediction market on the U.S. Civilian Unemployment Rate for the upcoming BLS release. Resolves based on the seasonally adjusted rate published via FRED.",
    resolutionSourceUrl: "https://fred.stlouisfed.org/series/UNRATE",
    closesAtOffsetDays: 25,
    resolvesAtOffsetDays: 40,
  },
  {
    id: "real-gdp-growth",
    category: "gdp",
    fredSeriesId: "GDPC1",
    seriesName: "Real GDP Growth",
    sampleQuestion: "What will real GDP growth be for the next quarter?",
    frequency: "quarterly",
    marketType: "multiOutcome",
    numOutcomes: 5,
    defaultOutcomeLabels: ["<0%", "0-1%", "1-2%", "2-3%", ">3%"],
    defaultResolutionCondition: {
      conditionType: "exactRange",
      thresholdValue: 0,
      comparison: "greaterThanOrEqual",
      rangeLow: -2.0,
      rangeHigh: 5.0,
      rangeStep: 1.0,
    },
    defaultTitle: "Real GDP Growth (QoQ Annualized) — Next Advance Estimate",
    defaultDescription:
      "Prediction market on the quarter-over-quarter annualized growth rate of Real Gross Domestic Product. Resolves based on the advance estimate published by the Bureau of Economic Analysis.",
    resolutionSourceUrl: "https://fred.stlouisfed.org/series/GDPC1",
    closesAtOffsetDays: 80,
    resolvesAtOffsetDays: 95,
  },
  {
    id: "fomc-rate-decision",
    category: "fedPolicy",
    fredSeriesId: "DFEDTARU",
    seriesName: "FOMC Rate Decision",
    sampleQuestion: "What will the Fed do at the next FOMC meeting?",
    frequency: "perFomc",
    marketType: "multiOutcome",
    numOutcomes: 3,
    defaultOutcomeLabels: ["Cut", "Hold", "Hike"],
    defaultResolutionCondition: {
      conditionType: "changePercent",
      thresholdValue: 0,
      comparison: "equal",
      rangeLow: -25,
      rangeHigh: 25,
      rangeStep: 25,
    },
    defaultTitle: "FOMC Rate Decision — Next Meeting",
    defaultDescription:
      "Prediction market on the Federal Reserve's interest rate decision at the next FOMC meeting. Resolves as Cut if the upper bound of the target range decreases, Hold if unchanged, or Hike if it increases.",
    resolutionSourceUrl: "https://fred.stlouisfed.org/series/DFEDTARU",
    closesAtOffsetDays: 35,
    resolvesAtOffsetDays: 40,
  },
];

function offsetDate(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().split("T")[0];
}

export function templateToFormState(
  template: MarketTemplate
): CreateMarketFormState {
  const resolvesAt = offsetDate(template.resolvesAtOffsetDays);
  const resolvesTimestamp = Math.floor(
    new Date(resolvesAt).getTime() / 1000
  );

  return {
    templateId: template.id,
    fredSeriesId: template.fredSeriesId,
    title: template.defaultTitle,
    description: template.defaultDescription,
    marketType: template.marketType,
    numOutcomes: template.numOutcomes,
    outcomeLabels: [...template.defaultOutcomeLabels],
    resolutionCondition: {
      ...template.defaultResolutionCondition,
      observationDate: resolvesTimestamp,
    },
    resolutionSourceUrl: template.resolutionSourceUrl,
    closesAt: offsetDate(template.closesAtOffsetDays),
    resolvesAt,
  };
}
