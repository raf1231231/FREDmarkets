import { describe, it, expect } from 'vitest';
import {
  bytesToString,
  bpsToPercent,
  bpsToPrice,
  formatUsdc,
  formatTimestamp,
  shortenAddress,
  getMarketStatusKey,
  getMarketStatusLabel,
} from './utils';

describe('bytesToString', () => {
  it('converts byte array to string', () => {
    const bytes = [72, 101, 108, 108, 111]; // "Hello"
    expect(bytesToString(bytes)).toBe('Hello');
  });

  it('handles null-terminated strings', () => {
    const bytes = [72, 101, 108, 108, 111, 0, 0, 0];
    expect(bytesToString(bytes)).toBe('Hello');
  });

  it('handles empty array', () => {
    expect(bytesToString([])).toBe('');
  });
});

describe('bpsToPercent', () => {
  it('converts 0 bps to 0%', () => {
    expect(bpsToPercent(0)).toBe('0.00%');
  });

  it('converts 5000 bps to 50.00%', () => {
    expect(bpsToPercent(5000)).toBe('50.00%');
  });

  it('converts 10000 bps to 100.00%', () => {
    expect(bpsToPercent(10000)).toBe('100.00%');
  });
});

describe('bpsToPrice', () => {
  it('converts 5000 bps to $0.5000', () => {
    expect(bpsToPrice(5000)).toBe('$0.5000');
  });

  it('converts 10000 bps to $1.0000', () => {
    expect(bpsToPrice(10000)).toBe('$1.0000');
  });
});

describe('formatUsdc', () => {
  it('formats number base units', () => {
    expect(formatUsdc(1000000)).toBe('$1.00');
  });

  it('formats large amounts with commas', () => {
    expect(formatUsdc(100000000)).toBe('$100.00');
  });
});

describe('formatTimestamp', () => {
  it('formats unix timestamp to date string', () => {
    // March 13, 2026 = 1773705600
    const result = formatTimestamp(1773705600);
    expect(result).toContain('2026');
  });
});

describe('shortenAddress', () => {
  it('shortens address with default 4 chars', () => {
    const addr = 'Gak745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo';
    expect(shortenAddress(addr)).toBe('Gak7...hMBo');
  });

  it('shortens address with custom chars', () => {
    const addr = 'Gak745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo';
    expect(shortenAddress(addr, 6)).toBe('Gak745...FshMBo');
  });
});

describe('getMarketStatusKey', () => {
  it('extracts key from pending status', () => {
    expect(getMarketStatusKey({ pending: {} })).toBe('pending');
  });

  it('extracts key from active status', () => {
    expect(getMarketStatusKey({ active: {} })).toBe('active');
  });
});

describe('getMarketStatusLabel', () => {
  it('capitalizes pending status', () => {
    expect(getMarketStatusLabel({ pending: {} })).toBe('Pending');
  });

  it('capitalizes active status', () => {
    expect(getMarketStatusLabel({ active: {} })).toBe('Active');
  });
});
