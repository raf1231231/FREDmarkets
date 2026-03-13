import { describe, it, expect, beforeEach, vi } from 'vitest';
import { config } from '../config';

describe('Config', () => {
  it('should have required config values', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(config.fredBaseUrl).toContain('fred');
    expect(config.solanaRpcUrl).toContain('solana');
  });

  it('should have valid program ID format', () => {
    // Program ID should be a base58 string
    expect(config.fredMarketsProgramId.length).toBeGreaterThan(30);
  });

  it('should have default oracle cron schedule', () => {
    expect(config.oracleCronSchedule).toMatch(/^\*\/?\d+ \* \* \* \*$/);
  });

  it('should have valid node env', () => {
    expect(['development', 'production', 'test']).toContain(config.nodeEnv);
  });
});
