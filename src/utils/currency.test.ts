import { convertCurrency, convertToEur } from './currency';

describe('Currency Converter', () => {
  describe('convertCurrency', () => {
    it('should return the same amount when currencies are identical', () => {
      expect(convertCurrency(100, 'EUR', 'EUR')).toBe(100);
      expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
    });

    it('should convert EUR to USD correctly', () => {
      const result = convertCurrency(100, 'EUR', 'USD');
      expect(result).toBe(114.01); // 100 * 1.1401
    });

    it('should convert USD to EUR correctly', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      expect(result).toBe(87.71); // 100 * 0.8771
    });

    it('should round to 2 decimal places', () => {
      const result = convertCurrency(100.123, 'EUR', 'USD');
      expect(result).toBe(114.15); // 100.123 * 1.1401 rounded to 2 decimals
    });
  });

  describe('convertToEur', () => {
    it('should return the same amount when already in EUR', () => {
      expect(convertToEur(100, 'EUR')).toBe(100);
    });

    it('should convert USD to EUR correctly', () => {
      const result = convertToEur(100, 'USD');
      expect(result).toBe(87.71); // 100 * 0.8771
    });
  });
}); 