// ISO 3166-1 alpha-2 country codes to country names mapping
export const COUNTRY_CODES: Record<string, string> = {
  // Europe
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'AT': 'Austria',
  'CH': 'Switzerland',
  'GB': 'United Kingdom',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'SK': 'Slovakia',
  'HU': 'Hungary',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'GR': 'Greece',
  'HR': 'Croatia',
  'SI': 'Slovenia',
  'RS': 'Serbia',
  'UA': 'Ukraine',
  
  // Mexico
  'MX': 'Mexico',
  
  // Other common countries
  'US': 'United States',
  'CA': 'Canada',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'EC': 'Ecuador',
  'UY': 'Uruguay',
  'PY': 'Paraguay',
  'BO': 'Bolivia',
};

/**
 * Get country name from country code
 * @param code ISO 3166-1 alpha-2 country code
 * @returns Country name or the code if not found
 */
export function getCountryName(code: string): string {
  return COUNTRY_CODES[code.toUpperCase()] || code;
}

/**
 * Get country code from country name
 * @param name Country name
 * @returns ISO 3166-1 alpha-2 country code or the name if not found
 */
export function getCountryCode(name: string): string {
  const entry = Object.entries(COUNTRY_CODES).find(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, countryName]) => countryName.toLowerCase() === name.toLowerCase()
  );
  return entry ? entry[0] : name;
} 