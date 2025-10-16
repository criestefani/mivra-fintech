// Fixed Assets Module - 141 official trading assets from Avalon
// Source: docs/IDs-Definitivo.txt

// Asset mapping: name -> { id, name, category }
export const FIXED_ASSETS = {
  // Major Forex Pairs
  'EURUSD-OTC': { id: 76, name: 'EUR/USD OTC', category: 'forex' },
  'GBPUSD-OTC': { id: 81, name: 'GBP/USD OTC', category: 'forex' },
  'USDJPY-OTC': { id: 85, name: 'USD/JPY OTC', category: 'forex' },
  'AUDUSD-OTC': { id: 2111, name: 'AUD/USD OTC', category: 'forex' },
  'USDCAD-OTC': { id: 2112, name: 'USD/CAD OTC', category: 'forex' },
  'USDCHF-OTC': { id: 78, name: 'USD/CHF OTC', category: 'forex' },
  'NZDUSD-OTC': { id: 80, name: 'NZD/USD OTC', category: 'forex' },

  // Minor Forex Pairs
  'EURGBP-OTC-L': { id: 77, name: 'EUR/GBP OTC', category: 'forex' },
  'EURJPY-OTC-L': { id: 79, name: 'EUR/JPY OTC', category: 'forex' },
  'GBPJPY-OTC': { id: 84, name: 'GBP/JPY OTC', category: 'forex' },
  'AUDJPY-OTC': { id: 2113, name: 'AUD/JPY OTC', category: 'forex' },
  'EURAUD-OTC': { id: 2120, name: 'EUR/AUD OTC', category: 'forex' },
  'EURCHF-OTC': { id: 2131, name: 'EUR/CHF OTC', category: 'forex' },
  'EURCAD-OTC': { id: 2117, name: 'EUR/CAD OTC', category: 'forex' },
  'GBPAUD-OTC': { id: 2116, name: 'GBP/AUD OTC', category: 'forex' },
  'GBPCAD-OTC': { id: 2114, name: 'GBP/CAD OTC', category: 'forex' },
  'GBPCHF-OTC': { id: 2115, name: 'GBP/CHF OTC', category: 'forex' },
  'GBPNZD-OTC': { id: 2132, name: 'GBP/NZD OTC', category: 'forex' },
  'AUDCAD-OTC': { id: 86, name: 'AUD/CAD OTC', category: 'forex' },
  'AUDCHF-OTC': { id: 2129, name: 'AUD/CHF OTC', category: 'forex' },
  'AUDNZD-OTC': { id: 2130, name: 'AUD/NZD OTC', category: 'forex' },
  'CADCHF-OTC': { id: 2119, name: 'CAD/CHF OTC', category: 'forex' },
  'CADJPY-OTC': { id: 2136, name: 'CAD/JPY OTC', category: 'forex' },
  'CHFJPY-OTC': { id: 2118, name: 'CHF/JPY OTC', category: 'forex' },
  'CHFNOK-OTC': { id: 2200, name: 'CHF/NOK OTC', category: 'forex' },
  'NZDJPY-OTC': { id: 2138, name: 'NZD/JPY OTC', category: 'forex' },
  'NZDCAD-OTC': { id: 2137, name: 'NZD/CAD OTC', category: 'forex' },
  'EURNZD-OTC': { id: 2122, name: 'EUR/NZD OTC', category: 'forex' },
  'EURRUB-OTC': { id: 82, name: 'EUR/RUB OTC', category: 'forex' },

  // Exotic Forex
  'USDPLN-OTC': { id: 2128, name: 'USD/PLN OTC', category: 'forex' },
  'USDTRY-OTC': { id: 2124, name: 'USD/TRY OTC', category: 'forex' },
  'USDSEK-OTC': { id: 2123, name: 'USD/SEK OTC', category: 'forex' },
  'USDNOK-OTC': { id: 2121, name: 'USD/NOK OTC', category: 'forex' },
  'USDHKD-OTC': { id: 1382, name: 'USD/HKD OTC', category: 'forex' },
  'USDSGD-OTC': { id: 1381, name: 'USD/SGD OTC', category: 'forex' },
  'USDZAR-OTC': { id: 1380, name: 'USD/ZAR OTC', category: 'forex' },
  'USDXOF-OTC': { id: 1379, name: 'USD/XOF OTC', category: 'forex' },
  'USDINR-OTC': { id: 1383, name: 'USD/INR OTC', category: 'forex' },
  'USDBRL-OTC-L': { id: 2298, name: 'USD/BRL OTC', category: 'forex' },
  'USDMXN-OTC-L': { id: 2300, name: 'USD/MXN OTC', category: 'forex' },
  'USDCOP-OTC': { id: 2299, name: 'USD/COP OTC', category: 'forex' },
  'USDTHB-OTC': { id: 2182, name: 'USD/THB OTC', category: 'forex' },
  'EURTHB-OTC': { id: 2181, name: 'EUR/THB OTC', category: 'forex' },
  'JPYTHB-OTC': { id: 2183, name: 'JPY/THB OTC', category: 'forex' },

  // Cryptocurrencies
  'BTCUSD-OTC-op': { id: 2270, name: 'BTC/USD OTC', category: 'crypto' },
  'ETHUSD-OTC': { id: 1941, name: 'ETH/USD OTC', category: 'crypto' },
  'LTCUSD-OTC': { id: 2126, name: 'LTC/USD OTC', category: 'crypto' },
  'XRPUSD': { id: 2107, name: 'XRP/USD', category: 'crypto' },
  'BCHUSD-OTC': { id: 2148, name: 'BCH/USD OTC', category: 'crypto' },
  'ADAUSD': { id: 1974, name: 'ADA/USD', category: 'crypto' },
  'DOGEUSD': { id: 1977, name: 'DOGE/USD', category: 'crypto' },
  'SOLUSD': { id: 1978, name: 'SOL/USD', category: 'crypto' },
  'SHIBUSDT': { id: 1975, name: 'SHIB/USDT', category: 'crypto' },
  'TRON-OTC': { id: 1976, name: 'TRON OTC', category: 'crypto' },
  'EOSUSD-OTC': { id: 2127, name: 'EOS/USD OTC', category: 'crypto' },
  'LINKUSD-OTC': { id: 2143, name: 'LINK/USD OTC', category: 'crypto' },
  'DOTUSD-OTC': { id: 2149, name: 'DOT/USD OTC', category: 'crypto' },
  'ATOMUSD-OTC': { id: 2150, name: 'ATOM/USD OTC', category: 'crypto' },
  'MATICUSD-OTC': { id: 2167, name: 'MATIC/USD OTC', category: 'crypto' },
  'NEARUSD-OTC': { id: 2168, name: 'NEAR/USD OTC', category: 'crypto' },
  'JUPUSD-OTC': { id: 2141, name: 'JUP/USD OTC', category: 'crypto' },
  'IMXUSD-OTC': { id: 2140, name: 'IMX/USD OTC', category: 'crypto' },
  'ICPUSD-OTC': { id: 2139, name: 'ICP/USD OTC', category: 'crypto' },
  'INJUSD-OTC': { id: 2151, name: 'INJ/USD OTC', category: 'crypto' },
  'SEIUSD-OTC': { id: 2152, name: 'SEI/USD OTC', category: 'crypto' },
  'IOTAUSD-OTC': { id: 2153, name: 'IOTA/USD OTC', category: 'crypto' },
  'DASHUSD-OTC': { id: 2155, name: 'DASH/USD OTC', category: 'crypto' },
  'ARBUSD-OTC': { id: 2156, name: 'ARB/USD OTC', category: 'crypto' },
  'WLDUSD-OTC': { id: 2157, name: 'WLD/USD OTC', category: 'crypto' },
  'ORDIUSD-OTC': { id: 2158, name: 'ORDI/USD OTC', category: 'crypto' },
  'SATSUSD-OTC': { id: 2159, name: 'SATS/USD OTC', category: 'crypto' },
  'PYTHUSD-OTC': { id: 2160, name: 'PYTH/USD OTC', category: 'crypto' },
  'RONINUSD-OTC': { id: 2161, name: 'RONIN/USD OTC', category: 'crypto' },
  'TIAUSD-OTC': { id: 2162, name: 'TIA/USD OTC', category: 'crypto' },
  'MANAUSD-OTC': { id: 2163, name: 'MANA/USD OTC', category: 'crypto' },
  'SANDUSD-OTC': { id: 2164, name: 'SAND/USD OTC', category: 'crypto' },
  'GRTUSD-OTC': { id: 2165, name: 'GRT/USD OTC', category: 'crypto' },
  'STXUSD-OTC': { id: 2166, name: 'STX/USD OTC', category: 'crypto' },
  'GALAUSD-OTC': { id: 2147, name: 'GALA/USD OTC', category: 'crypto' },
  'FLOKIUSD-OTC': { id: 2146, name: 'FLOKI/USD OTC', category: 'crypto' },
  'PEPEUSD-OTC': { id: 2145, name: 'PEPE/USD OTC', category: 'crypto' },
  'WIFUSD-OTC': { id: 2144, name: 'WIF/USD OTC', category: 'crypto' },
  'DYDXUSD-OTC': { id: 2277, name: 'DYDX/USD OTC', category: 'crypto' },
  'ONDOUSD-OTC': { id: 2276, name: 'ONDO/USD OTC', category: 'crypto' },
  'ONYXCOINUSD-OTC': { id: 2278, name: 'ONYXCOIN/USD OTC', category: 'crypto' },
  'FARTCOINUSD-OTC': { id: 2279, name: 'FARTCOIN/USD OTC', category: 'crypto' },
  'PENGUUSD-OTC': { id: 2280, name: 'PENGU/USD OTC', category: 'crypto' },
  'PENUSD-OTC-L': { id: 2301, name: 'PEN/USD OTC', category: 'crypto' },
  'TON/USD-OTC': { id: 2091, name: 'TON/USD OTC', category: 'crypto' },
  'MelaniaCoin OTC': { id: 2267, name: 'Melania Coin OTC', category: 'crypto' },
  'TrumpCoin OTC': { id: 2265, name: 'Trump Coin OTC', category: 'crypto' },
  'MUSKvsTRUMP-OTC': { id: 2296, name: 'MUSK vs TRUMP OTC', category: 'crypto' },

  // Commodities
  'XAUUSD-OTC': { id: 2086, name: 'Gold (XAU/USD) OTC', category: 'commodities' },
  'XAGUSD-OTC': { id: 1858, name: 'Silver (XAG/USD) OTC', category: 'commodities' },
  'USOUSD-OTC': { id: 1859, name: 'Crude Oil (USO/USD) OTC', category: 'commodities' },
  'UKOUSD-OTC': { id: 1931, name: 'Brent Oil (UKO/USD) OTC', category: 'commodities' },
  'XNGUSD-OTC': { id: 1863, name: 'Natural Gas OTC', category: 'commodities' },
  'XAU/XAG-OTC': { id: 2086, name: 'Gold/Silver OTC', category: 'commodities' },

  // Stock Indices
  'S&P 500': { id: 1971, name: 'S&P 500', category: 'indices' },
  'USNDAQ 100 (NDX) Spot Index': { id: 1972, name: 'NASDAQ 100', category: 'indices' },
  'INDU': { id: 1973, name: 'Dow Jones', category: 'indices' },
  'DAX': { id: 2046, name: 'DAX', category: 'indices' },
  'CAC': { id: 2045, name: 'CAC 40', category: 'indices' },
  'IBEX': { id: 2044, name: 'IBEX 35', category: 'indices' },
  'UKX': { id: 2047, name: 'FTSE 100', category: 'indices' },
  'AS51': { id: 2048, name: 'ASX 200', category: 'indices' },
  'HSI': { id: 2049, name: 'Hang Seng', category: 'indices' },
  'SX5E': { id: 2050, name: 'Euro Stoxx 50', category: 'indices' },
  'NKY': { id: 2051, name: 'Nikkei 225', category: 'indices' },
  'Dollar Index': { id: 2062, name: 'Dollar Index', category: 'indices' },
  'Yen_Index': { id: 2063, name: 'Yen Index', category: 'indices' },
  'US2000 Spot Index': { id: 2108, name: 'Russell 2000', category: 'indices' },

  // Major Stocks
  'AAPL': { id: 1938, name: 'Apple', category: 'stocks' },
  'GOOGL': { id: 1933, name: 'Google', category: 'stocks' },
  'MSFT': { id: 2099, name: 'Microsoft', category: 'stocks' },
  'AMZN': { id: 2083, name: 'Amazon', category: 'stocks' },
  'TESLA': { id: 2087, name: 'Tesla', category: 'stocks' },
  'FB': { id: 1937, name: 'Meta/Facebook', category: 'stocks' },
  'INTEL': { id: 2098, name: 'Intel', category: 'stocks' },
  'CITI': { id: 2100, name: 'Citigroup', category: 'stocks' },
  'COKE': { id: 2101, name: 'Coca-Cola', category: 'stocks' },
  'JPM': { id: 2102, name: 'JPMorgan', category: 'stocks' },
  'MCDON': { id: 2103, name: 'McDonalds', category: 'stocks' },
  'MORSTAN': { id: 2104, name: 'Morgan Stanley', category: 'stocks' },
  'NIKE': { id: 2105, name: 'Nike', category: 'stocks' },
  'ALIBABA': { id: 2106, name: 'Alibaba', category: 'stocks' },
  'GS': { id: 2110, name: 'Goldman Sachs', category: 'stocks' },
  'AIG': { id: 2109, name: 'AIG', category: 'stocks' },
  'SNAP-OTC': { id: 2125, name: 'Snap Inc OTC', category: 'stocks' },
  'BIDU-OTC': { id: 2097, name: 'Baidu OTC', category: 'stocks' },

  // Pairs/Derivatives
  'US30/JP225-OTC': { id: 2079, name: 'Dow Jones / Nikkei OTC', category: 'pairs' },
  'US100/JP225-OTC': { id: 2080, name: 'NASDAQ / Nikkei OTC', category: 'pairs' },
  'US500/JP225-OTC': { id: 2081, name: 'S&P 500 / Nikkei OTC', category: 'pairs' },
  'NVDA/AMD-OTC': { id: 2084, name: 'NVIDIA / AMD OTC', category: 'pairs' },
  'GOOGLE/MSFT-OTC': { id: 2099, name: 'Google / Microsoft OTC', category: 'pairs' },
  'MSFT/AAPL-OTC': { id: 2088, name: 'Microsoft / Apple OTC', category: 'pairs' },
  'INTEL/IBM-OTC': { id: 2098, name: 'Intel / IBM OTC', category: 'pairs' },
  'NFLX/AMZN-OTC': { id: 2090, name: 'Netflix / Amazon OTC', category: 'pairs' },
  'META/GOOGLE-OTC': { id: 2094, name: 'Meta / Google OTC', category: 'pairs' },
  'GER30/UK100-OTC': { id: 2093, name: 'DAX / FTSE OTC', category: 'pairs' },
};

// Assets organized by category
export const ASSETS_BY_CATEGORY = {
  forex: Object.values(FIXED_ASSETS).filter(a => a.category === 'forex'),
  crypto: Object.values(FIXED_ASSETS).filter(a => a.category === 'crypto'),
  commodities: Object.values(FIXED_ASSETS).filter(a => a.category === 'commodities'),
  indices: Object.values(FIXED_ASSETS).filter(a => a.category === 'indices'),
  stocks: Object.values(FIXED_ASSETS).filter(a => a.category === 'stocks'),
  pairs: Object.values(FIXED_ASSETS).filter(a => a.category === 'pairs')
};

/**
 * Get all available assets as array
 * Used by market-scanner.mjs
 */
export function getAvailableAssets() {
  return Object.values(FIXED_ASSETS);
}

/**
 * Get asset name by ID
 * Used by market-scanner.mjs
 */
export function getAssetName(activeId) {
  const asset = Object.values(FIXED_ASSETS).find(a => a.id === parseInt(activeId));
  return asset ? asset.name : `Asset ${activeId}`;
}

/**
 * Resolve asset by ID
 */
export function resolveAssetById(id) {
  const entry = Object.entries(FIXED_ASSETS).find(([_, asset]) => asset.id === parseInt(id));
  return entry ? entry[1] : null;
}

/**
 * Resolve asset by name (case-insensitive)
 * Matches both keys and display names
 */
export function resolveAssetByName(name) {
  const upperName = name.toUpperCase();

  // Try exact key match first
  if (FIXED_ASSETS[upperName]) {
    return FIXED_ASSETS[upperName];
  }

  // Try exact display name match
  const nameMatch = Object.values(FIXED_ASSETS).find(asset =>
    asset.name.toUpperCase() === upperName
  );
  if (nameMatch) {
    return nameMatch;
  }

  // Normalize string: remove spaces, slashes, parentheses for fuzzy matching
  const normalize = (str) => str.toUpperCase().replace(/[\s\/\(\)\-]/g, '');
  const normalizedInput = normalize(name);

  // Try normalized key match
  const normalizedKeyMatch = Object.entries(FIXED_ASSETS).find(([key, _]) =>
    normalize(key) === normalizedInput
  );
  if (normalizedKeyMatch) {
    return normalizedKeyMatch[1];
  }

  // Try normalized display name match
  const normalizedNameMatch = Object.values(FIXED_ASSETS).find(asset =>
    normalize(asset.name) === normalizedInput
  );
  if (normalizedNameMatch) {
    return normalizedNameMatch;
  }

  // Final fallback: partial match
  const partialMatch = Object.entries(FIXED_ASSETS).find(([key, asset]) =>
    normalize(key).includes(normalizedInput) ||
    normalize(asset.name).includes(normalizedInput)
  );

  return partialMatch ? partialMatch[1] : null;
}

/**
 * Get total count of unique assets
 */
export function getTotalAssetsCount() {
  return Object.keys(FIXED_ASSETS).length;
}

/**
 * Get all asset names
 */
export function getAllAssetNames() {
  return Object.keys(FIXED_ASSETS);
}

/**
 * Get all assets in a category
 */
export function getAssetsByCategory(category) {
  return ASSETS_BY_CATEGORY[category] || [];
}

console.log(`✅ Fixed Assets loaded: ${getTotalAssetsCount()} assets`);
