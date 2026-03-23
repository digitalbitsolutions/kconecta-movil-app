import { parseNumber, pickString, formatPrice } from '../utils/dataMappers';

describe('utils/dataMappers', () => {
  describe('parseNumber', () => {
    it('should parse standard integers', () => {
      expect(parseNumber(123)).toBe(123);
      expect(parseNumber('123')).toBe(123);
    });

    it('should handle null/undefined as 0', () => {
      expect(parseNumber(null)).toBe(0);
      expect(parseNumber(undefined)).toBe(0);
      expect(parseNumber('')).toBe(0);
    });

    it('should parse European format numbers (dots as thousands, comma as decimal)', () => {
      expect(parseNumber('1.250,50')).toBe(1250.5);
      expect(parseNumber('4.000')).toBe(4000);
      expect(parseNumber('4,50')).toBe(4.5);
    });

    it('should parse simple decimal strings with dots', () => {
      expect(parseNumber('1250.50')).toBe(1250.5);
    });

    it('should handle large amounts with spaces or mixed separators', () => {
      expect(parseNumber('1 250 000')).toBe(1250000);
    });
  });

  describe('pickString', () => {
    it('should pick the first non-empty string', () => {
      expect(pickString('', 'Hello', 'World')).toBe('Hello');
    });

    it('should trim whitespace', () => {
      expect(pickString('   ', '  Target  ')).toBe('Target');
    });

    it('should convert finite numbers to strings', () => {
      expect(pickString(null, 123, 'Other')).toBe('123');
    });

    it('should return empty string if no valid values found', () => {
      expect(pickString(null, undefined, '')).toBe('');
    });
  });

  describe('formatPrice', () => {
    it('should format 0 as "Sin precio"', () => {
      expect(formatPrice(0)).toBe('Sin precio');
      expect(formatPrice('abc')).toBe('Sin precio');
    });

    it('should format valid numbers correctly as Euro currency', () => {
      const result = formatPrice(1500);
      // Accept both 1.500 or 1500 depending on environment locale support
      expect(result).toMatch(/1.?.?500/);
      expect(result).toMatch(/€/);
    });
  });
});
