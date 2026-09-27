/**
 * Haversine formula — calculates distance in km between two GPS coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Calculate transport cost
 * @param {number} distanceKm
 * @param {number} quantityQtl - quintals
 * @param {number} ratePerKmQtl - ₹ per km per quintal
 * @param {number} minCharge - minimum charge in ₹
 * @returns {number} Total transport cost in ₹
 */
const calculateTransportCost = (distanceKm, quantityQtl, ratePerKmQtl, minCharge = 0) => {
  const calculated = distanceKm * quantityQtl * ratePerKmQtl;
  return Math.max(calculated, minCharge);
};

/**
 * Calculate net profit from selling grain
 * @param {Object} params
 * @returns {Object} Detailed profit breakdown
 */
const calculateNetProfit = ({
  quantityQtl,
  modalPricePerQtl,
  transportCostTotal,
  laborCostTotal = 0,
  mandiFeePercent = 1.5, // 1.5% of gross by default
  miscCosts = 0,
}) => {
  const grossRevenue = quantityQtl * modalPricePerQtl;
  const mandiFee = (grossRevenue * mandiFeePercent) / 100;
  const totalDeductions = transportCostTotal + laborCostTotal + mandiFee + miscCosts;
  const netProfit = grossRevenue - totalDeductions;
  const netPricePerQtl = netProfit / quantityQtl;
  const marginPercent = (netProfit / grossRevenue) * 100;

  return {
    grossRevenue: Math.round(grossRevenue),
    transportCost: Math.round(transportCostTotal),
    laborCost: Math.round(laborCostTotal),
    mandiFee: Math.round(mandiFee),
    miscCosts: Math.round(miscCosts),
    totalDeductions: Math.round(totalDeductions),
    netProfit: Math.round(netProfit),
    netPricePerQtl: Math.round(netPricePerQtl),
    marginPercent: Math.round(marginPercent * 10) / 10,
  };
};

/**
 * Returns pagination offset
 */
const getPagination = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

module.exports = {
  haversineDistance,
  calculateTransportCost,
  calculateNetProfit,
  getPagination,
};
