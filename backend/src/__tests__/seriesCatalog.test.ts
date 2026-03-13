import { describe, it, expect } from 'vitest';
import { SERIES_CATALOG, ALL_SERIES_IDS, FREQUENCY_MAP } from '../config/seriesCatalog';

describe('Series Catalog', () => {
  it('should have unique series IDs', () => {
    const uniqueIds = new Set(ALL_SERIES_IDS);
    expect(uniqueIds.size).toBe(ALL_SERIES_IDS.length);
  });

  it('should have valid frequency values', () => {
    const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'perFomc'];
    const allValid = SERIES_CATALOG.every(s => validFrequencies.includes(s.frequency));
    expect(allValid).toBe(true);
  });

  it('should have FREQUENCY_MAP matching catalog', () => {
    SERIES_CATALOG.forEach(({ seriesId, frequency }) => {
      expect(FREQUENCY_MAP[seriesId]).toBe(frequency);
    });
  });

  it('should have at least 50 series', () => {
    expect(ALL_SERIES_IDS.length).toBeGreaterThan(50);
  });

  it('should have tier 1 series defined', () => {
    const tier1Ids = ['CPIAUCSL', 'CPILFESL', 'PCEPI', 'PAYEMS', 'UNRATE', 'GDP'];
    tier1Ids.forEach(id => {
      expect(ALL_SERIES_IDS).toContain(id);
    });
  });
});
