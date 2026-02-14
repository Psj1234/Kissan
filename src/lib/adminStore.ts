/**
 * Admin panel data: market prices (with last 4 per crop), audit trail, activity, demand, alerts.
 * Persisted in localStorage; last 4 prices used by chatbot for auto-fetch predictions.
 */

const KEY_PRICES = "kisan_admin_prices";
const KEY_HISTORY = "kisan_admin_price_history";
const KEY_ACTIVITY = "kisan_admin_activity";
const KEY_DEMAND = "kisan_admin_demand";
const KEY_ALERTS = "kisan_admin_alerts";
const ADMIN_NAME = "Admin";

const MAX_LAST_PRICES = 4;

export type PriceRow = {
  id: number;
  crop: string;
  price: number;
  /** Last 4 prices (most recent first: Day -1, -2, -3, -4). Used for "previous" display and chatbot auto-fetch. */
  lastThreePrices: number[];
  unit: string;
};

/** @deprecated Use lastThreePrices[0] for "previous" price. */
export type PriceHistoryEntry = { adminName: string; crop: string; oldPrice: number; newPrice: number; at: string };
export type ActivityStats = { activeFarmersToday: number; mostViewedCrop: string; mostPredictedCrop: string };
export type DemandRow = { crop: string; views: number; profitCalcs: number };
export type AlertEntry = { message: string; at: string; target: string };

const defaultPrices: PriceRow[] = [
  { id: 1, crop: "Wheat", price: 2450, lastThreePrices: [2400, 2350, 2300, 2250], unit: "quintal" },
  { id: 2, crop: "Rice", price: 3200, lastThreePrices: [3150, 3100, 3050, 3000], unit: "quintal" },
  { id: 3, crop: "Onion", price: 1200, lastThreePrices: [1150, 1100, 1080, 1050], unit: "quintal" },
  { id: 4, crop: "Potato", price: 900, lastThreePrices: [880, 860, 850, 830], unit: "quintal" },
  { id: 5, crop: "Tomato", price: 1100, lastThreePrices: [1050, 1020, 1000, 980], unit: "quintal" },
  { id: 6, crop: "Cucumber", price: 950, lastThreePrices: [920, 900, 880, 860], unit: "quintal" },
  { id: 7, crop: "Bajra", price: 2100, lastThreePrices: [2050, 2000, 1980, 1950], unit: "quintal" },
  { id: 8, crop: "Soybean", price: 4100, lastThreePrices: [4000, 3950, 3900, 3850], unit: "quintal" },
];

function loadJson<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s) as T;
  } catch (_) {}
  return fallback;
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

/** Normalize legacy rows that had previousPrice instead of lastThreePrices */
function normalizePriceRow(row: PriceRow & { previousPrice?: number }): PriceRow {
  let lastThree = Array.isArray(row.lastThreePrices)
    ? row.lastThreePrices.slice(0, MAX_LAST_PRICES)
    : row.previousPrice != null
      ? [row.previousPrice]
      : [];
  
  // Ensure we have exactly 4 prices by padding with the current price or last available price
  if (lastThree.length < MAX_LAST_PRICES) {
    const fillPrice = lastThree.length > 0 ? lastThree[lastThree.length - 1] : row.price;
    while (lastThree.length < MAX_LAST_PRICES) {
      lastThree.push(fillPrice);
    }
  }
  
  return {
    id: row.id,
    crop: row.crop,
    price: row.price,
    lastThreePrices: lastThree,
    unit: row.unit || "quintal",
  };
}

export function getMarketPrices(): PriceRow[] {
  const raw = loadJson<(PriceRow & { previousPrice?: number })[]>(KEY_PRICES, defaultPrices);
  
  // Check if migration is needed (any row with fewer than 4 prices)
  const needsMigration = raw.some(row => {
    const prices = Array.isArray(row.lastThreePrices) ? row.lastThreePrices : [];
    return prices.length < MAX_LAST_PRICES;
  });
  
  const normalized = raw.map(normalizePriceRow);
  
  // Auto-save normalized data to fix incomplete price histories
  if (needsMigration) {
    saveJson(KEY_PRICES, normalized);
  }
  
  return normalized;
}

export function setMarketPrices(prices: PriceRow[]) {
  saveJson(KEY_PRICES, prices);
}

/** Get last 4 prices for a crop by name (for chatbot). Commodity name case-insensitive. */
export function getLastThreePricesForCrop(cropName: string): number[] {
  const prices = getMarketPrices();
  const row = prices.find((p) => p.crop.toLowerCase() === cropName.toLowerCase());
  return row ? row.lastThreePrices.slice(0, MAX_LAST_PRICES) : [];
}

/** Append to audit trail only. Caller must update row price and lastThreePrices. */
export function savePriceUpdate(crop: string, oldPrice: number, newPrice: number) {
  const history = getPriceHistory();
  history.unshift({
    adminName: ADMIN_NAME,
    crop,
    oldPrice,
    newPrice,
    at: new Date().toISOString(),
  });
  saveJson(KEY_HISTORY, history.slice(0, 200));
}

export function getPriceHistory(): PriceHistoryEntry[] {
  return loadJson(KEY_HISTORY, []);
}

export function getActivityStats(): ActivityStats {
  return loadJson(KEY_ACTIVITY, {
    activeFarmersToday: 12450,
    mostViewedCrop: "Onion",
    mostPredictedCrop: "Onion",
  });
}

export function getDemandRows(): DemandRow[] {
  return loadJson(KEY_DEMAND, [
    { crop: "Onion", views: 1240, profitCalcs: 876 },
    { crop: "Tomato", views: 980, profitCalcs: 654 },
    { crop: "Potato", views: 756, profitCalcs: 512 },
    { crop: "Wheat", views: 620, profitCalcs: 401 },
    { crop: "Rice", views: 445, profitCalcs: 298 },
  ]);
}

export function getAlertsSent(): AlertEntry[] {
  return loadJson(KEY_ALERTS, []);
}

export function sendAlert(message: string, target: string) {
  const alerts = getAlertsSent();
  alerts.unshift({ message, at: new Date().toISOString(), target });
  saveJson(KEY_ALERTS, alerts.slice(0, 100));
}

/** Add a new crop. Returns new row with next id. */
export function addCrop(crop: string, price: number, unit = "quintal"): PriceRow {
  const prices = getMarketPrices();
  const nextId = prices.length ? Math.max(...prices.map((p) => p.id)) + 1 : 1;
  const row: PriceRow = {
    id: nextId,
    crop: crop.trim(),
    price,
    lastThreePrices: [],
    unit,
  };
  const updated = [...prices, row];
  setMarketPrices(updated);
  return row;
}

/** Update crop name for an existing row. */
export function updateCropName(id: number, newCrop: string) {
  const prices = getMarketPrices();
  const updated = prices.map((p) => (p.id === id ? { ...p, crop: newCrop.trim() } : p));
  setMarketPrices(updated);
}
