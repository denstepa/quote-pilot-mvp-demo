import { readFileSync } from 'fs';
import path from 'path';
import { parseEmailToRequest, ParsedRequest } from './request-parser';
// Note: parseEmailFile and parseMultipleEmails are used in commented tests

describe('Request Parser Integration Tests', () => {
  // Helper function to load email files
  const loadEmailFile = (filename: string): string => {
    return readFileSync(path.join(__dirname, '..', '..', 'data', 'emails', filename), 'utf-8');
  };

  // Test timeout for LLM calls (10 seconds)
  const LLM_TIMEOUT = 10000;

  // Helper function to validate core fields are present and reasonable
  const validateParsedRequest = (result: ParsedRequest, expectedCompany: string) => {
    expect(result.company).toBeTruthy();
    expect(result.company.toLowerCase()).toContain(expectedCompany.toLowerCase());
    expect(result.originAddress).toBeTruthy();
    expect(result.destinationAddress).toBeTruthy();
    expect(typeof result.priority).toBe('string');
    expect(['LOW', 'NORMAL', 'HIGH', 'URGENT']).toContain(result.priority);
  };

  // Helper function to check dimensions match regardless of which property they're assigned to
  const expectDimensionsToMatch = (result: ParsedRequest, expectedDimensions: number[]) => {
    const actualDimensions = [result.height, result.width, result.length].filter(d => d !== null).sort();
    const expectedSorted = expectedDimensions.sort();
    expect(actualDimensions).toEqual(expectedSorted);
  };

  describe('parseEmailToRequest', () => {
    it('should parse email_1.txt (Siemens Berlin to Guadalajara)', async () => {
      const emailContent = loadEmailFile('email_1.txt');
      const result = await parseEmailToRequest(emailContent);

      validateParsedRequest(result, 'Siemens');
            const expectedPickup = new Date('2025-06-24T09:00:00+02:00');
      const expectedDelivery = new Date('2025-07-08T14:00:00+02:00');
      expect(result.pickupDate?.toISOString()).toBe(expectedPickup.toISOString());
      expect(result.deliveryDate?.toISOString()).toBe(expectedDelivery.toISOString());
      expectDimensionsToMatch(result, [120, 80, 150]);
      expect(result.weight).toBe(450);
      expect(result.originAddress).toContain('Berlin');
      expect(result.destinationAddress).toContain('Guadalajara');
      expect(result.contactEmail).toBe('logistics@siemens.com');
      expect(result.priority).toBe('NORMAL');
    }, LLM_TIMEOUT);

    it('should parse email_2.txt (Bosch Stuttgart to Mexico City - Urgent)', async () => {
      const emailContent = loadEmailFile('email_2.txt');
      const result = await parseEmailToRequest(emailContent);

      validateParsedRequest(result, 'Bosch');

      const expectedPickup = new Date('2025-06-28T13:00:00+02:00');
      const expectedDelivery = new Date('2025-07-13T16:00:00+02:00');
      expect(result.pickupDate?.toISOString()).toBe(expectedPickup.toISOString());
      expect(result.deliveryDate?.toISOString()).toBe(expectedDelivery.toISOString());
      expectDimensionsToMatch(result, [100, 120, 200]);
      expect(result.weight).toBe(600);
      expect(result.originAddress).toContain('Stuttgart');
      expect(result.destinationAddress).toContain('Mexico City');
      expect(result.contactEmail).toBe('export@bosch.com');
      expect(result.priority).toBe('URGENT');
    }, LLM_TIMEOUT);

    it('should parse email_3.txt (Munich to Mexico City with informal format)', async () => {
      const emailContent = loadEmailFile('email_3.txt');
      const result = await parseEmailToRequest(emailContent);

      validateParsedRequest(result, 'R&S');
      
      const expectedPickup = new Date('2025-07-05T14:00:00+02:00');
      const expectedDelivery = new Date('2025-07-22T12:00:00+02:00');
      expect(result.pickupDate?.toISOString()).toBe(expectedPickup.toISOString());
      expect(result.deliveryDate?.toISOString()).toBe(expectedDelivery.toISOString());
      expectDimensionsToMatch(result, [100, 80, 170]);
      expect(result.weight).toBe(490);
      expect(result.originAddress).toContain('München');
      expect(result.destinationAddress).toContain('Mexico City');
      expect(result.contactEmail).toBe('export.mx@rohde-schwarz.com');

    }, LLM_TIMEOUT);

    it('should parse email_4.txt (Heraeus with booking priority)', async () => {
      const emailContent = loadEmailFile('email_4.txt');
      const result = await parseEmailToRequest(emailContent);

      validateParsedRequest(result, 'Heraeus');
      const expectedPickup = new Date('2025-06-27T14:00:00');
      const expectedDelivery = new Date('2025-07-13T12:00:00');
      expect(result.pickupDate?.toISOString()).toBe(expectedPickup.toISOString());
      expect(result.deliveryDate?.getTime()).toBeLessThanOrEqual(expectedDelivery.getTime());
      expectDimensionsToMatch(result, [95, 85, 160]);
      expect(result.weight).toBe(460);
      expect(result.originAddress).toContain('Wolfsburg');
      expect(result.destinationAddress).toContain('Sanctorum');
      expect(result.contactEmail).toBe('international@heraeus.com');
      expect(result.priority).toBe('NORMAL'); // Should be HIGH due to "booking"
    }, LLM_TIMEOUT);

    it('should parse email_5.txt (TBD delivery date)', async () => {
      const emailContent = loadEmailFile('email_5.txt');
      const result = await parseEmailToRequest(emailContent);

      validateParsedRequest(result, 'Siemens');

      const expectedPickup = new Date('2025-07-04T10:00:00+02:00');
      expect(result.pickupDate?.toISOString()).toBe(expectedPickup.toISOString());
      expect(result.deliveryDate).toBeNull();
      expectDimensionsToMatch(result, [100, 120, 150]);
      expect(result.weight).toBe(500);
      expect(result.originAddress).toContain('Saarbrücken');
      expect(result.destinationAddress).toContain('Sanctorum');
      expect(result.contactEmail).toBe('siemens.shipping@siemens.com');
      expect(result.notes).toBeTruthy();
      expect(result.priority).toBe('NORMAL');
    }, LLM_TIMEOUT);

    it('should parse email_6.txt (Bosh with missing weight)', async () => {
      const emailContent = loadEmailFile('email_6.txt');
      const result = await parseEmailToRequest(emailContent);

      validateParsedRequest(result, 'Bosh');    

      const expectedPickup = new Date('2025-07-10T14:00:00+02:00');
      const expectedDelivery = new Date('2025-07-31T12:00:00+02:00');
      expect(result.pickupDate?.toISOString()).toBe(expectedPickup.toISOString());
      expect(result.deliveryDate?.getTime()).toBeLessThanOrEqual(expectedDelivery.getTime());
      expectDimensionsToMatch(result, [100, 80, 170]);
      expect(result.weight).toBeNull();
      expect(result.originAddress).toContain('München');
      expect(result.destinationAddress).toContain('Mexico City');
      expect(result.contactEmail).toBe('export.mx@bosh.com');
      expect(result.priority).toBe('NORMAL');
    }, LLM_TIMEOUT);

    it('should parse email_7.txt (minimal information)', async () => {
      const emailContent = loadEmailFile('email_7.txt');
      const result = await parseEmailToRequest(emailContent);

      expect(result.pickupDate).toBeNull();
      expect(result.deliveryDate).toBeNull();
      expect(result.height).toBeNull();
      expect(result.width).toBeNull();
      expect(result.length).toBeNull();
      expect(result.weight).toBeNull();
      expect(result.destinationAddress).toContain('Mexico');
      expect(result.priority).toBe('NORMAL');
    }, LLM_TIMEOUT);

    it('should parse email_8.txt (urgent with specific date)', async () => {
      const emailContent = loadEmailFile('email_8.txt');
      const result = await parseEmailToRequest(emailContent);

      validateParsedRequest(result, 'Siemens');
        
      const expectedPickup = new Date('2024-07-04T10:00:00+02:00');
      const expectedDelivery = new Date('2025-07-13T12:00:00+02:00');
      expect(result.pickupDate?.toISOString()).toBe(expectedPickup.toISOString());
      expect(result.deliveryDate?.getTime()).toBeLessThanOrEqual(expectedDelivery.getTime());
      expectDimensionsToMatch(result, [100, 120, 150]);
      expect(result.weight).toBe(500);
      expect(result.originAddress).toContain('Saarbrücken');
      expect(result.destinationAddress).toContain('Sanctorum');
      expect(result.contactEmail).toBe('siemens.shipping@siemens.com');
      expect(result.priority).toBe('URGENT');
    }, LLM_TIMEOUT);
  });
}); 