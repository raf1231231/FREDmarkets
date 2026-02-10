# FRED_SERIES.md — Supported Economic Indicators for FREDmarkets

This file defines the FRED data series the platform supports, their metadata, release schedules, and how the oracle should handle them. Reference this when building market templates, the oracle service, frontend data visualizations, and seed data.

---

## 1. API Configuration

```
Base URL: https://api.stlouisfed.org/fred
API Key: stored in env var FRED_API_KEY
Rate Limit: 120 requests/minute
Response Format: JSON (file_type=json)
```

### Required Attribution

Display this notice prominently in the app:

> "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis."

Do not use "FRED" or "Federal Reserve Bank" in the hostname. Do not use the Federal Reserve Bank logo.

### Key API Endpoints

```
GET /series/observations?series_id={ID}&api_key={KEY}&file_type=json
GET /series?series_id={ID}&api_key={KEY}&file_type=json
GET /release/dates?release_id={ID}&api_key={KEY}&file_type=json
```

For oracle resolution, always pin the vintage to avoid revisions:
```
&realtime_start={RESOLUTION_DATE}&realtime_end={RESOLUTION_DATE}
```

---

## 2. Series Tiers

Series are organized into tiers by market appeal and expected trading volume. Tier 1 series should have auto-generated markets for every release. Tier 2 markets can be auto-generated or user-proposed. Tier 3 are available for user-proposed markets only.

---

## 3. Tier 1 — Headline Movers (Auto-Generate Markets)

These are the releases financial media covers live. Highest expected volume.

### INFLATION & PRICES

| # | Series ID | Name | Freq | Source | Release Day |
|---|-----------|------|------|--------|-------------|
| 1 | CPIAUCSL | CPI — All Urban Consumers, All Items | Monthly | BLS | ~13th of month |
| 2 | CPILFESL | CPI — Core (Less Food & Energy) | Monthly | BLS | ~13th (same release as CPI) |
| 3 | PCEPI | PCE Price Index | Monthly | BEA | ~last Fri of month |
| 4 | PCEPILFE | Core PCE Price Index | Monthly | BEA | ~last Fri (same release as PCE) |

**Oracle notes:**
- CPI and Core CPI release simultaneously in the "Consumer Price Index" release. One API call covers both.
- PCE and Core PCE release simultaneously in the "Personal Income and Outlays" release.
- CPI is the most publicly watched. Core PCE is the Fed's actual 2% target. Both are high-volume market candidates.
- Values are index levels. Market questions should use YoY % change: `((current / year_ago) - 1) * 100`.

### EMPLOYMENT

| # | Series ID | Name | Freq | Source | Release Day |
|---|-----------|------|------|--------|-------------|
| 5 | PAYEMS | Total Nonfarm Payrolls | Monthly | BLS | First Fri of month |
| 6 | UNRATE | Unemployment Rate (U-3) | Monthly | BLS | First Fri (same release) |
| 7 | CES0500000003 | Average Hourly Earnings — Private | Monthly | BLS | First Fri (same release) |

**Oracle notes:**
- All three release together in the BLS "Employment Situation" report — the single most market-moving data release in the world.
- PAYEMS is a level (thousands of persons). Market questions should use MoM change: `current - previous`.
- UNRATE is already a percentage. Use directly.
- CES0500000003 is dollars. Market questions should use MoM % change or YoY % change.

### GDP

| # | Series ID | Name | Freq | Source | Release Day |
|---|-----------|------|------|--------|-------------|
| 8 | GDP | Gross Domestic Product (Nominal) | Quarterly | BEA | ~last week of month, one month after quarter end |
| 9 | GDPC1 | Real GDP | Quarterly | BEA | Same release |

**Oracle notes:**
- GDP has three releases per quarter: Advance (1 month lag), Second (2 months), Third (3 months). The Advance estimate is the most market-relevant. Resolve markets on the Advance release.
- Use `realtime_start` vintage pinning — later revisions should NOT change resolution.
- Market questions should use annualized QoQ % change (this is how BEA reports it).

### FED POLICY

| # | Series ID | Name | Freq | Source | Release Day |
|---|-----------|------|------|--------|-------------|
| 10 | DFEDTARU | Fed Funds Target — Upper Bound | Per FOMC | Fed Board | 8 FOMC meetings/year |

**Oracle notes:**
- FOMC schedule is published a year in advance. Markets should be created around each meeting.
- This is a level (e.g., 5.50). Market questions are typically "Will the Fed cut / hold / hike?" which translates to: will the value decrease / stay the same / increase vs the prior observation.
- Resolution is clean — the value changes on the FOMC decision date or it doesn't.

---

## 4. Tier 2 — High Interest (Auto-Generate or User-Proposed)

### INFLATION — SECONDARY

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 11 | PPIFIS | PPI — Final Demand | Monthly | BLS |
| 12 | CUUR0000SEHA | CPI — Shelter Component | Monthly | BLS |
| 13 | MEDCPIM158SFRBCLE | Median CPI | Monthly | Cleveland Fed |
| 14 | T5YIE | 5-Year Breakeven Inflation Rate | Daily | Treasury |
| 15 | MICH | U of Michigan Inflation Expectations | Monthly | U of Michigan |

### EMPLOYMENT — SECONDARY

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 16 | U6RATE | Unemployment Rate — Broad (U-6) | Monthly | BLS |
| 17 | CIVPART | Labor Force Participation Rate | Monthly | BLS |
| 18 | ICSA | Initial Jobless Claims | Weekly | DOL |
| 19 | CCSA | Continued Jobless Claims | Weekly | DOL |
| 20 | JTSJOL | Job Openings (JOLTS) | Monthly | BLS |
| 21 | JTSQUR | Quits Rate (JOLTS) | Monthly | BLS |

### CONSUMER & SPENDING

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 22 | RSAFS | Advance Retail Sales | Monthly | Census |
| 23 | UMCSENT | U of Michigan Consumer Sentiment | Monthly | U of Michigan |
| 24 | PCE | Personal Consumption Expenditures | Monthly | BEA |
| 25 | DSPIC96 | Real Disposable Personal Income | Monthly | BEA |
| 26 | PSAVERT | Personal Savings Rate | Monthly | BEA |

### INTEREST RATES

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 27 | FEDFUNDS | Fed Funds Effective Rate | Monthly | Fed Board |
| 28 | GS2 | 2-Year Treasury Yield | Daily | Treasury |
| 29 | GS10 | 10-Year Treasury Yield | Daily | Treasury |
| 30 | GS30 | 30-Year Treasury Yield | Daily | Treasury |
| 31 | T10Y2Y | 10Y-2Y Treasury Spread | Daily | Treasury |
| 32 | T10Y3M | 10Y-3M Treasury Spread | Daily | Treasury |
| 33 | SOFR | Secured Overnight Financing Rate | Daily | NY Fed |

### HOUSING

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 34 | HOUST | Housing Starts | Monthly | Census |
| 35 | PERMIT | Building Permits | Monthly | Census |
| 36 | CSUSHPISA | Case-Shiller US Home Price Index | Monthly | S&P |
| 37 | MORTGAGE30US | 30-Year Fixed Mortgage Rate | Weekly | Freddie Mac |
| 38 | EXHOSLUSM495S | Existing Home Sales | Monthly | NAR |

### PRODUCTION & BUSINESS

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 39 | INDPRO | Industrial Production Index | Monthly | Fed Board |
| 40 | TCU | Capacity Utilization | Monthly | Fed Board |
| 41 | DGORDER | Durable Goods Orders | Monthly | Census |
| 42 | BUSINV | Business Inventories | Monthly | Census |

---

## 5. Tier 3 — Available for User-Proposed Markets

### MONEY SUPPLY & FINANCIAL CONDITIONS

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 43 | M2SL | M2 Money Supply | Monthly | Fed Board |
| 44 | WALCL | Fed Total Assets (Balance Sheet) | Weekly | Fed Board |
| 45 | BAMLH0A0HYM2 | High Yield Corporate Bond Spread | Daily | ICE/BofA |
| 46 | STLFSI4 | St. Louis Financial Stress Index | Weekly | STL Fed |

### TRADE & GLOBAL

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 47 | DEXUSEU | USD/EUR Exchange Rate | Daily | Fed Board |
| 48 | DEXJPUS | JPY/USD Exchange Rate | Daily | Fed Board |
| 49 | BOPGSTB | Trade Balance (Goods & Services) | Monthly | BEA |

### LEADING INDICATORS

| # | Series ID | Name | Freq | Source |
|---|-----------|------|------|--------|
| 50 | NAPM | ISM Manufacturing PMI | Monthly | ISM |

---

## 6. Market Template Types

Each series supports one or more market question patterns. The oracle's resolution logic maps to these.

### ThresholdAbove
"Will [SERIES] be above [VALUE] when released on [DATE]?"
- Binary market (2 outcomes: Yes / No)
- Resolution: `observation >= threshold` → Yes wins

### ThresholdBelow
"Will [SERIES] be below [VALUE] when released on [DATE]?"
- Binary market (2 outcomes: Yes / No)
- Resolution: `observation <= threshold` → Yes wins

### ExactRange
"Where will [SERIES] land when released on [DATE]?"
- Multi-outcome market (3-5 outcomes, e.g., "Below 3.0%", "3.0–3.5%", "3.5–4.0%", "Above 4.0%")
- Resolution: observation falls into one range → that outcome wins

### ChangePercent
"Will [SERIES] increase by more than [X]% MoM/YoY?"
- Binary or multi-outcome
- Resolution: `((current - prior) / prior) * 100` compared to threshold

### ChangeAbsolute
"Will [SERIES] change by more than [VALUE] from previous?"
- Used for PAYEMS (jobs added), ICSA (claims change)
- Resolution: `current - prior` compared to threshold

### DirectionOnly
"Will the Fed cut, hold, or hike rates at the [DATE] FOMC meeting?"
- 3-outcome market
- Resolution: compare `current` to `prior` observation of DFEDTARU

---

## 7. Suggested Default Thresholds

When auto-generating markets, derive thresholds from the most recent observation. These are starting-point rules:

| Series | Question Style | Threshold Logic |
|--------|---------------|-----------------|
| CPIAUCSL | YoY % change ranges | Prior reading ± 0.5pp brackets (e.g., <2.5%, 2.5-3.0%, 3.0-3.5%, >3.5%) |
| CPILFESL | YoY % change ranges | Same as CPI with tighter brackets (± 0.3pp) |
| PCEPILFE | YoY % change ranges | Bracket around Fed's 2.0% target: <1.5%, 1.5-2.0%, 2.0-2.5%, 2.5-3.0%, >3.0% |
| PAYEMS | MoM change (thousands) | 3-month trailing avg ± 75k brackets (e.g., <100k, 100-175k, 175-250k, >250k) |
| UNRATE | Level | Prior reading ± 0.3pp (e.g., <3.5%, 3.5-3.8%, 3.8-4.1%, >4.1%) |
| GDPC1 | Annualized QoQ % | <0% (contraction), 0-1%, 1-2%, 2-3%, >3% |
| DFEDTARU | Direction vs prior | 3-outcome: Cut / Hold / Hike |
| GS10 | Level at month-end | Prior ± 25bps brackets |
| RSAFS | MoM % change | Negative / 0-0.5% / >0.5% |
| MORTGAGE30US | Level at week-end | Prior ± 25bps brackets |
| HOUST | Level (thousands, SAAR) | Prior ± 50k brackets |
| UMCSENT | Level | Prior ± 5 points brackets |
| ICSA | Level (thousands) | Prior ± 25k brackets |

---

## 8. Oracle Polling Schedule

The oracle service should poll FRED based on release frequency:

| Frequency | Polling Cadence | Series Examples |
|-----------|----------------|-----------------|
| Monthly | Every 5 min on known release day (8:30 AM ET typical), every 30 min as catch-all during release week | CPIAUCSL, PAYEMS, UNRATE, PCE |
| Weekly | Every 30 min on release day (Thursdays for ICSA, MORTGAGE30US) | ICSA, CCSA, MORTGAGE30US |
| Quarterly | Every 5 min on known release day, otherwise daily | GDP, GDPC1 |
| Per FOMC | Every 5 min on FOMC decision day (2:00 PM ET typical) | DFEDTARU |
| Daily | Once daily after market close (for yields, rates, FX) | GS10, GS2, SOFR, DEXUSEU |

### Release Calendar Integration

Use the FRED releases API to get upcoming release dates:
```
GET /release/dates?release_id={ID}&include_release_dates_with_no_data=true
```

Key release IDs:
| Release | FRED Release ID |
|---------|----------------|
| Employment Situation | 50 |
| Consumer Price Index | 10 |
| GDP | 53 |
| Personal Income and Outlays | 54 |
| FOMC Press Release | 398 |
| New Residential Construction | 13 |
| Advance Retail Sales | 59 |
| Durable Goods | 94 |
| JOLTS | 110 |
| Industrial Production and Capacity Utilization | 13 |

---

## 9. Data Revision Handling

FRED data gets revised. This matters for market resolution.

**Rule: Resolve on first-published value. Revisions do not change outcomes.**

Implementation: Use vintage pinning in the API call. When resolving a market that should resolve on date `2026-03-15`, call:
```
GET /series/observations?series_id=CPIAUCSL&realtime_start=2026-03-15&realtime_end=2026-03-15
```

This returns only the data that was available on that date — the initial release, not any later revision.

Series with significant revision risk:
- GDP (Advance → Second → Third, often revised by 1+ percentage points)
- PAYEMS (monthly revisions of ±50k are common, annual benchmark revisions can change the picture entirely)
- RSAFS (Advance → Revised, typically within a month)
- HOUST (revised monthly)

Series with minimal revision risk:
- UNRATE (rarely revised)
- CPIAUCSL (rarely revised, never significantly)
- FEDFUNDS / DFEDTARU (never revised)
- GS10, GS2, SOFR (market rates, never revised)
- MORTGAGE30US (survey-based, never revised)

---

## 10. Copyright & Licensing Notes

Most FRED series sourced from government agencies (BLS, BEA, Census, Fed Board) are public domain. However, some series are copyrighted by third parties.

**Copyrighted series in this list:**
- CSUSHPISA (S&P Case-Shiller) — copyrighted by S&P Dow Jones Indices
- BAMLH0A0HYM2 (ICE BofA) — copyrighted by ICE Benchmark Administration
- UMCSENT / MICH (U of Michigan) — copyrighted by University of Michigan
- NAPM (ISM PMI) — copyrighted by Institute for Supply Management

For copyrighted series: display data for personal/research use only. Do not redistribute raw data. Link back to FRED as the source. Check individual series notes for specific restrictions.

Government-sourced series (BLS, BEA, Census, Fed Board, Treasury) are public domain and have no redistribution restrictions beyond the FRED API terms.
