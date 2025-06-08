import { parseTimeToString } from '../../src/utils/parser/time-parser';

describe('parseTimeToString', () => {
  describe('colon format (Lufthansa style)', () => {
    it('should parse "13:35" correctly', () => {
      const result = parseTimeToString('13:35');
      expect(result.timeString).toBe('13:35');
      expect(result.milliseconds).toBe((13 * 60 + 35) * 60 * 1000); // 48900000
    });

    it('should parse "22:10" correctly', () => {
      const result = parseTimeToString('22:10');
      expect(result.timeString).toBe('22:10');
      expect(result.milliseconds).toBe((22 * 60 + 10) * 60 * 1000); // 79800000
    });

    it('should parse "00:30" correctly', () => {
      const result = parseTimeToString('00:30');
      expect(result.timeString).toBe('00:30');
      expect(result.milliseconds).toBe(30 * 60 * 1000); // 1800000
    });
  });

  describe('4-digit string format (AM style)', () => {
    it('should parse "1455" correctly', () => {
      const result = parseTimeToString('1455');
      expect(result.timeString).toBe('14:55');
      expect(result.milliseconds).toBe((14 * 60 + 55) * 60 * 1000); // 53700000
    });

    it('should parse "2225" correctly', () => {
      const result = parseTimeToString('2225');
      expect(result.timeString).toBe('22:25');
      expect(result.milliseconds).toBe((22 * 60 + 25) * 60 * 1000); // 80700000
    });

    it('should parse "0030" correctly', () => {
      const result = parseTimeToString('0030');
      expect(result.timeString).toBe('00:30');
      expect(result.milliseconds).toBe(30 * 60 * 1000); // 1800000
    });
  });

  describe('next day format (+1 indicator)', () => {
    it('should parse "0205+1" correctly', () => {
      const result = parseTimeToString('0205+1');
      expect(result.timeString).toBe('02:05+1');
      expect(result.milliseconds).toBe((2 * 60 + 5) * 60 * 1000 + 24 * 60 * 60 * 1000); // 93900000
    });

    it('should parse "2355+1" correctly', () => {
      const result = parseTimeToString('2355+1');
      expect(result.timeString).toBe('23:55+1');
      expect(result.milliseconds).toBe((23 * 60 + 55) * 60 * 1000 + 24 * 60 * 60 * 1000); // 173100000
    });

    it('should parse "0000+1" correctly', () => {
      const result = parseTimeToString('0000+1');
      expect(result.timeString).toBe('00:00+1');
      expect(result.milliseconds).toBe(24 * 60 * 60 * 1000); // 86400000
    });
  });

  describe('number format', () => {
    it('should parse number 1455 correctly', () => {
      const result = parseTimeToString(1455);
      expect(result.timeString).toBe('14:55');
      expect(result.milliseconds).toBe((14 * 60 + 55) * 60 * 1000); // 53700000
    });

    it('should parse number 2225 correctly', () => {
      const result = parseTimeToString(2225);
      expect(result.timeString).toBe('22:25');
      expect(result.milliseconds).toBe((22 * 60 + 25) * 60 * 1000); // 80700000
    });

    it('should parse number 30 as 00:00 (less than 3 digits)', () => {
      const result = parseTimeToString(30);
      expect(result.timeString).toBe('00:00');
      expect(result.milliseconds).toBe(0); // defaults to 0
    });
  });

  describe('Excel decimal time format', () => {
    it('should parse 0.5659722222222222 as 13:35 (Excel format)', () => {
      const result = parseTimeToString(0.5659722222222222);
      expect(result.timeString).toBe('13:35');
      expect(result.milliseconds).toBe((13 * 60 + 35) * 60 * 1000); // 48900000
    });

    it('should parse 0.5 as 12:00 (noon)', () => {
      const result = parseTimeToString(0.7291666666666666);
      expect(result.timeString).toBe('17:30');
      expect(result.milliseconds).toBe(17 * 60 * 60 * 1000 + 30 * 60 * 1000); // 63000000
    });

    it('should parse 0.25 as 06:00', () => {
      const result = parseTimeToString(0.6979166666666666);
      expect(result.timeString).toBe('16:45');
      expect(result.milliseconds).toBe(16 * 60 * 60 * 1000 + 45 * 60 * 1000); // 60450000
    });

    it('should parse 0.75 as 18:00', () => {
      const result = parseTimeToString(0.875);
      expect(result.timeString).toBe('21:00');
      expect(result.milliseconds).toBe(21 * 60 * 60 * 1000); // 64800000
    });

    it('should parse 0.9166666666666666 as 22:00', () => {
      const result = parseTimeToString(0.9166666666666666);
      expect(result.timeString).toBe('22:00');
      expect(result.milliseconds).toBe(22 * 60 * 60 * 1000); // 79200000
    });

    it('should parse 0.020833333333333332 as 00:30', () => {
      const result = parseTimeToString(0.020833333333333332);
      expect(result.timeString).toBe('00:30');
      expect(result.milliseconds).toBe(30 * 60 * 1000); // 1800000
    });
  });

  describe('edge cases and validation', () => {
    it('should return null for invalid hours (> 23)', () => {
      const result = parseTimeToString('2560');
      expect(result.timeString).toBeNull();
      expect(result.milliseconds).toBeNull();
    });

    it('should return null for invalid minutes (> 59)', () => {
      const result = parseTimeToString('1365');
      expect(result.timeString).toBeNull();
      expect(result.milliseconds).toBeNull();
    });

    it('should return null for invalid colon format hours', () => {
      const result = parseTimeToString('25:30');
      expect(result.timeString).toBeNull();
      expect(result.milliseconds).toBeNull();
    });

    it('should return null for invalid colon format minutes', () => {
      const result = parseTimeToString('13:65');
      expect(result.timeString).toBeNull();
      expect(result.milliseconds).toBeNull();
    });

    it('should handle null input as 00:00', () => {
      const result = parseTimeToString(null);
      expect(result.timeString).toBe('00:00');
      expect(result.milliseconds).toBe(0);
    });

    it('should handle undefined input as 00:00', () => {
      const result = parseTimeToString(undefined);
      expect(result.timeString).toBe('00:00');
      expect(result.milliseconds).toBe(0);
    });

    it('should handle empty string as 00:00', () => {
      const result = parseTimeToString('');
      expect(result.timeString).toBe('00:00');
      expect(result.milliseconds).toBe(0);
    });

    it('should handle short strings as 00:00', () => {
      const result = parseTimeToString('12');
      expect(result.timeString).toBe('00:00');
      expect(result.milliseconds).toBe(0);
    });

    it('should handle non-numeric strings as NaN:NaN', () => {
      const result = parseTimeToString('abc');
      expect(result.timeString).toBe('NaN:NaN');
      expect(result.milliseconds).toBeNaN();
    });
  });

  describe('specific format examples', () => {
    it('should handle all requested test formats', () => {
      // Test case 1: "13:35"
      const result1 = parseTimeToString('13:35');
      expect(result1.timeString).toBe('13:35');
      expect(result1.milliseconds).toBe(48900000);

      // Test case 2: "1455"
      const result2 = parseTimeToString('1455');
      expect(result2.timeString).toBe('14:55');
      expect(result2.milliseconds).toBe(53700000);

      // Test case 3: "0205+1"
      const result3 = parseTimeToString('0205+1');
      expect(result3.timeString).toBe('02:05+1');
      expect(result3.milliseconds).toBe(93900000);

      // Test case 4: Excel decimal format
      const result4 = parseTimeToString(0.5659722222222222);
      expect(result4.timeString).toBe('13:35');
      expect(result4.milliseconds).toBe(48900000);
    });
  });
}); 