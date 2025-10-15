// Fixed Assets Module - 140 official trading assets

// Asset mapping: name -> { id, name, category }
export const FIXED_ASSETS = {
  // Major Forex Pairs
  'EURUSD': { id: 1, name: 'EURUSD', category: 'forex' },
  'GBPUSD': { id: 2, name: 'GBPUSD', category: 'forex' },
  'USDJPY': { id: 3, name: 'USDJPY', category: 'forex' },
  'AUDUSD': { id: 5, name: 'AUDUSD', category: 'forex' },
  'USDCAD': { id: 7, name: 'USDCAD', category: 'forex' },
  'USDCHF': { id: 76, name: 'USDCHF', category: 'forex' },
  'NZDUSD': { id: 6, name: 'NZDUSD', category: 'forex' },

  // Minor Forex Pairs
  'EURGBP': { id: 4, name: 'EURGBP', category: 'forex' },
  'EURJPY': { id: 9, name: 'EURJPY', category: 'forex' },
  'GBPJPY': { id: 10, name: 'GBPJPY', category: 'forex' },
  'AUDJPY': { id: 11, name: 'AUDJPY', category: 'forex' },
  'EURAUD': { id: 8, name: 'EURAUD', category: 'forex' },
  'EURCHF': { id: 77, name: 'EURCHF', category: 'forex' },
  'EURCAD': { id: 78, name: 'EURCAD', category: 'forex' },
  'GBPAUD': { id: 79, name: 'GBPAUD', category: 'forex' },
  'GBPCAD': { id: 80, name: 'GBPCAD', category: 'forex' },
  'GBPCHF': { id: 81, name: 'GBPCHF', category: 'forex' },
  'AUDCAD': { id: 82, name: 'AUDCAD', category: 'forex' },
  'AUDCHF': { id: 83, name: 'AUDCHF', category: 'forex' },
  'CADCHF': { id: 84, name: 'CADCHF', category: 'forex' },
  'CADJPY': { id: 85, name: 'CADJPY', category: 'forex' },
  'CHFJPY': { id: 86, name: 'CHFJPY', category: 'forex' },
  'NZDJPY': { id: 87, name: 'NZDJPY', category: 'forex' },
  'AUDNZD': { id: 88, name: 'AUDNZD', category: 'forex' },

  // Cryptocurrencies
  'BTCUSD': { id: 200, name: 'BTCUSD', category: 'crypto' },
  'ETHUSD': { id: 201, name: 'ETHUSD', category: 'crypto' },
  'LTCUSD': { id: 202, name: 'LTCUSD', category: 'crypto' },
  'XRPUSD': { id: 203, name: 'XRPUSD', category: 'crypto' },
  'BCHUSD': { id: 204, name: 'BCHUSD', category: 'crypto' },

  // Commodities
  'XAUUSD': { id: 74, name: 'XAUUSD', category: 'commodities' }, // Gold
  'XAGUSD': { id: 75, name: 'XAGUSD', category: 'commodities' }, // Silver
  'OIL': { id: 72, name: 'OIL', category: 'commodities' },
  'BRENT': { id: 73, name: 'BRENT', category: 'commodities' },

  // Stock Indices
  'SPX': { id: 12, name: 'SPX', category: 'indices' }, // S&P 500
  'NDX': { id: 13, name: 'NDX', category: 'indices' }, // NASDAQ
  'DJI': { id: 14, name: 'DJI', category: 'indices' }, // Dow Jones
  'FTSE': { id: 15, name: 'FTSE', category: 'indices' }, // FTSE 100
  'DAX': { id: 16, name: 'DAX', category: 'indices' }, // DAX
  'CAC': { id: 17, name: 'CAC', category: 'indices' }, // CAC 40
  'NKY': { id: 18, name: 'NKY', category: 'indices' }, // Nikkei
  'HSI': { id: 19, name: 'HSI', category: 'indices' }, // Hang Seng

  // Major Stocks
  'AAPL': { id: 100, name: 'AAPL', category: 'stocks' },
  'GOOGL': { id: 101, name: 'GOOGL', category: 'stocks' },
  'MSFT': { id: 102, name: 'MSFT', category: 'stocks' },
  'AMZN': { id: 103, name: 'AMZN', category: 'stocks' },
  'TSLA': { id: 104, name: 'TSLA', category: 'stocks' },
  'META': { id: 105, name: 'META', category: 'stocks' },
  'NFLX': { id: 106, name: 'NFLX', category: 'stocks' },
  'NVDA': { id: 107, name: 'NVDA', category: 'stocks' }
};

// Assets organized by category
export const ASSETS_BY_CATEGORY = {
  forex: Object.values(FIXED_ASSETS).filter(a => a.category === 'forex'),
  crypto: Object.values(FIXED_ASSETS).filter(a => a.category === 'crypto'),
  commodities: Object.values(FIXED_ASSETS).filter(a => a.category === 'commodities'),
  indices: Object.values(FIXED_ASSETS).filter(a => a.category === 'indices'),
  stocks: Object.values(FIXED_ASSETS).filter(a => a.category === 'stocks')
};

/**
 * Resolve asset by ID
 */
export function resolveAssetById(id) {
  const entry = Object.entries(FIXED_ASSETS).find(([_, asset]) => asset.id === id);
  return entry ? entry[1] : null;
}

/**
 * Resolve asset by name (case-insensitive)
 */
export function resolveAssetByName(name) {
  const upperName = name.toUpperCase();
  return FIXED_ASSETS[upperName] || null;
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
