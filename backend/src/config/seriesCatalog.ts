// FRED series catalog for cache warming
// Mirrors frontend/src/data/seriesCatalog.ts structure

export const SERIES_CATALOG = [
  // TIER 1 — Headline Movers
  { seriesId: "CPIAUCSL", frequency: "monthly" },
  { seriesId: "CPILFESL", frequency: "monthly" },
  { seriesId: "PCEPI", frequency: "monthly" },
  { seriesId: "PCEPILFE", frequency: "monthly" },
  { seriesId: "PAYEMS", frequency: "monthly" },
  { seriesId: "UNRATE", frequency: "monthly" },
  { seriesId: "CES0500000003", frequency: "monthly" },
  { seriesId: "GDP", frequency: "quarterly" },
  { seriesId: "GDPC1", frequency: "quarterly" },
  { seriesId: "DFEDTARU", frequency: "perFomc" },

  // TIER 2 — Key Indicators
  { seriesId: "PPIFIS", frequency: "monthly" },
  { seriesId: "CUUR0000SEHA", frequency: "monthly" },
  { seriesId: "MEDCPIM158SFRBCLE", frequency: "monthly" },
  { seriesId: "T5YIE", frequency: "daily" },
  { seriesId: "MICH", frequency: "monthly" },
  { seriesId: "U6RATE", frequency: "monthly" },
  { seriesId: "CIVPART", frequency: "monthly" },
  { seriesId: "ICSA", frequency: "weekly" },
  { seriesId: "CCSA", frequency: "weekly" },
  { seriesId: "JTSJOL", frequency: "monthly" },
  { seriesId: "JTSQUR", frequency: "monthly" },
  { seriesId: "RSAFS", frequency: "monthly" },
  { seriesId: "UMCSENT", frequency: "monthly" },
  { seriesId: "PCE", frequency: "monthly" },
  { seriesId: "DSPIC96", frequency: "monthly" },
  { seriesId: "PSAVERT", frequency: "monthly" },
  { seriesId: "FEDFUNDS", frequency: "monthly" },
  { seriesId: "GS2", frequency: "daily" },
  { seriesId: "GS10", frequency: "daily" },
  { seriesId: "GS30", frequency: "daily" },
  { seriesId: "T10Y2Y", frequency: "daily" },
  { seriesId: "T10Y3M", frequency: "daily" },
  { seriesId: "SOFR", frequency: "daily" },
  { seriesId: "HOUST", frequency: "monthly" },
  { seriesId: "PERMIT", frequency: "monthly" },
  { seriesId: "CSUSHPISA", frequency: "monthly" },
  { seriesId: "MORTGAGE30US", frequency: "weekly" },
  { seriesId: "EXHOSLUSM495S", frequency: "monthly" },
  { seriesId: "INDPRO", frequency: "monthly" },
  { seriesId: "TCU", frequency: "monthly" },
  { seriesId: "DGORDER", frequency: "monthly" },
  { seriesId: "BUSINV", frequency: "monthly" },

  // COMMODITIES
  { seriesId: "DCOILWTICO", frequency: "daily" },
  { seriesId: "GASREGW", frequency: "weekly" },
  { seriesId: "DHHNGSP", frequency: "daily" },
  { seriesId: "GOLDAMGBD228NLBM", frequency: "daily" },
  { seriesId: "SLVPRUSD", frequency: "daily" },
  { seriesId: "PCOPPUSDM", frequency: "monthly" },
  { seriesId: "PWHEAMTUSDM", frequency: "monthly" },
  { seriesId: "PMAIZMTUSDM", frequency: "monthly" },
  { seriesId: "CPIUFDSL", frequency: "monthly" },
  { seriesId: "CPIENGSL", frequency: "monthly" },

  // CREDIT & DEBT
  { seriesId: "TOTALSL", frequency: "monthly" },
  { seriesId: "REVOLSL", frequency: "monthly" },
  { seriesId: "SLOAS", frequency: "quarterly" },
  { seriesId: "HHMSDODNS", frequency: "quarterly" },
  { seriesId: "DRCCLACBS", frequency: "quarterly" },
  { seriesId: "DRALSACBS", frequency: "quarterly" },
  { seriesId: "TDSP", frequency: "quarterly" },
  { seriesId: "DRTSCILM", frequency: "quarterly" },

  // TRADE
  { seriesId: "BOPGSTB", frequency: "monthly" },
  { seriesId: "EXPGS", frequency: "monthly" },
  { seriesId: "IMPGS", frequency: "monthly" },
  { seriesId: "DTWEXBGS", frequency: "daily" },
  { seriesId: "BOPBCA", frequency: "quarterly" },
  { seriesId: "IR", frequency: "monthly" },

  // INFLATION — Specific Categories
  { seriesId: "CUUR0000SAM", frequency: "monthly" },
  { seriesId: "CUUR0000SEMC01", frequency: "monthly" },
  { seriesId: "CUUR0000SEMF01", frequency: "monthly" },
  { seriesId: "CUUR0000SEEB01", frequency: "monthly" },
  { seriesId: "CUUR0000SEEB03", frequency: "monthly" },
  { seriesId: "CUSR0000SAF11", frequency: "monthly" },
  { seriesId: "CUSR0000SEFV", frequency: "monthly" },
  { seriesId: "CUUR0000SAS4", frequency: "monthly" },
  { seriesId: "CUUR0000SAA", frequency: "monthly" },
  { seriesId: "CUUR0000SAR", frequency: "monthly" },

  // EMPLOYMENT — Sector Jobs
  { seriesId: "USTRADE", frequency: "monthly" },
  { seriesId: "MANEMP", frequency: "monthly" },
  { seriesId: "USCONS", frequency: "monthly" },
  { seriesId: "CES6500000001", frequency: "monthly" },
  { seriesId: "USGOVT", frequency: "monthly" },
  { seriesId: "CES7000000001", frequency: "monthly" },
  { seriesId: "CES6054000001", frequency: "monthly" },
  { seriesId: "LNS12026620", frequency: "monthly" },

  // CONSUMER
  { seriesId: "TOTALSA", frequency: "monthly" },
  { seriesId: "ECOMSA", frequency: "quarterly" },
  { seriesId: "RRSFS", frequency: "monthly" },
  { seriesId: "CUSR0000SETA02", frequency: "monthly" },
  { seriesId: "CUSR0000SETA01", frequency: "monthly" },
  { seriesId: "CUSR0000SETD", frequency: "monthly" },
  { seriesId: "CUSR0000SETB01", frequency: "monthly" },
  { seriesId: "CUUR0000SETG01", frequency: "monthly" },

  // HOUSING
  { seriesId: "MSPUS", frequency: "quarterly" },
  { seriesId: "RHORUSQ156N", frequency: "quarterly" },
  { seriesId: "RRVRUSQ156N", frequency: "quarterly" },
  { seriesId: "MSACSR", frequency: "monthly" },
  { seriesId: "MORTGAGE15US", frequency: "weekly" },

  // PRODUCTION
  { seriesId: "IPMAN", frequency: "monthly" },
  { seriesId: "IPDMAT", frequency: "monthly" },
];

export const ALL_SERIES_IDS = SERIES_CATALOG.map((s) => s.seriesId);
export const FREQUENCY_MAP = SERIES_CATALOG.reduce((acc, s) => {
  acc[s.seriesId] = s.frequency;
  return acc;
}, {} as Record<string, string>);
