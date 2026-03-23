import { 
  normalizeRawFieldKey, 
  normalizeFormValue, 
  toRawFieldPayloadValue,
  sanitizePayload 
} from '../components/property/form/helpers';

describe('components/property/form/helpers', () => {
  describe('normalizeRawFieldKey', () => {
    it('should append __list to array field names', () => {
      expect(normalizeRawFieldKey('feature[]')).toBe('feature__list');
      expect(normalizeRawFieldKey('type_heating')).toBe('type_heating');
    });
  });

  describe('normalizeFormValue', () => {
    it('should return empty string for null/undefined', () => {
      expect(normalizeFormValue('title', null)).toBe('');
      expect(normalizeFormValue('price', undefined)).toBe('');
    });

    it('should return number as string', () => {
      expect(normalizeFormValue('price', 1250)).toBe('1250');
    });

    it('should join array values with commas', () => {
      // Create a Set to simulate LIST_FIELDS registry if needed, 
      // but the helper uses the imported LIST_FIELDS constant.
      // We assume 'feature[]' is in LIST_FIELDS.
      expect(normalizeFormValue('feature[]', [1, 2, '3'])).toBe('1,2,3');
    });
  });

  describe('toRawFieldPayloadValue', () => {
    it('should return array of strings/numbers for array fields', () => {
      const result = toRawFieldPayloadValue('feature[]', '1, 2, 3');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return numeric value for numeric fields', () => {
      // Assuming 'meters_built' is in NUMERIC_FIELDS
      expect(toRawFieldPayloadValue('meters_built', '1.250,00')).toBe(1250);
    });

    it('should return 1 or 0 (numbers) for boolean fields', () => {
      // Assuming 'bank_owned_property' is in BOOLEAN_FIELDS
      expect(toRawFieldPayloadValue('bank_owned_property', true)).toBe(1);
      expect(toRawFieldPayloadValue('bank_owned_property', '1')).toBe(1);
      expect(toRawFieldPayloadValue('bank_owned_property', 0)).toBe(0);
    });
  });

  describe('sanitizePayload', () => {
    it('should remove null, undefined and empty strings from simple objects', () => {
      const input = {
        title: 'House',
        price: 1500,
        empty: '',
        nullish: null,
        und: undefined
      };
      const result = sanitizePayload(input);
      expect(result).toEqual({ title: 'House', price: 1500 });
    });
  });
});
