// کشورها و واحدهای پولی پشتیبانی شده
export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
}

export const COUNTRIES: Country[] = [
  {
    code: "AE",
    name: "امارات متحده عربی",
    flag: "🇦🇪",
    currency: "AED",
    currencyName: "درهم امارات",
    currencySymbol: "د.إ"
  },
  {
    code: "SA",
    name: "عربستان سعودی",
    flag: "🇸🇦",
    currency: "SAR",
    currencyName: "ریال سعودی",
    currencySymbol: "ر.س"
  },
  {
    code: "KW",
    name: "کویت",
    flag: "🇰🇼",
    currency: "KWD",
    currencyName: "دینار کویتی",
    currencySymbol: "د.ك"
  },
  {
    code: "QA",
    name: "قطر",
    flag: "🇶🇦",
    currency: "QAR",
    currencyName: "ریال قطری",
    currencySymbol: "ر.ق"
  },
  {
    code: "BH",
    name: "بحرین",
    flag: "🇧🇭",
    currency: "BHD",
    currencyName: "دینار بحرینی",
    currencySymbol: "د.ب"
  },
  {
    code: "OM",
    name: "عمان",
    flag: "🇴🇲",
    currency: "OMR",
    currencyName: "ریال عمانی",
    currencySymbol: "ر.ع"
  },
  {
    code: "IQ",
    name: "عراق",
    flag: "🇮🇶",
    currency: "IQD",
    currencyName: "دینار عراقی",
    currencySymbol: "د.ع"
  }
];

// Helper functions
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(country => country.code === code);
};

export const getCountryByCurrency = (currency: string): Country | undefined => {
  return COUNTRIES.find(country => country.currency === currency);
};

export const getSupportedCurrencies = (): string[] => {
  return COUNTRIES.map(country => country.currency);
};

export const getSupportedCountryCodes = (): string[] => {
  return COUNTRIES.map(country => country.code);
};
