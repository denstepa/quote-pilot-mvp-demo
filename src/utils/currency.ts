// Currency conversion utilities
// Note: In production, you should use a real-time exchange rate API

export type SupportedCurrency = 'EUR' | 'USD';

// Static exchange rates - replace with API call in production
const EXCHANGE_RATES: Record<string, number> = {
  'EUR_TO_USD': 1.1401,
  'USD_TO_EUR': 0.8771,
};

/**
 * Convert amount from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rateKey = `${fromCurrency}_TO_${toCurrency}`;
  const rate = EXCHANGE_RATES[rateKey];
  
  if (!rate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  }

  return Math.round((amount * rate) * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert amount to EUR (base currency)
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency
 * @returns Amount in EUR
 */
export function convertToEur(amount: number, fromCurrency: SupportedCurrency): number {
  return convertCurrency(amount, fromCurrency, 'EUR');
}
