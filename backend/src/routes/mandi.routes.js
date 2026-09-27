const express = require('express');
const router = express.Router();
const db = require('../data/mockData');
const { sendSuccess, sendError } = require('../utils/response');

router.get('/', (req, res) => {
  let mandis = db.findMandis();
  const { state, search } = req.query;
  if (state) mandis = mandis.filter(m => m.state.toLowerCase() === state.toLowerCase());
  if (search) mandis = mandis.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.city.toLowerCase().includes(search.toLowerCase()));
  return sendSuccess(res, mandis, 'Mandis fetched.');
});

router.get('/nearby', (req, res) => {
  const { lat, lon, radiusKm = 150, commodity } = req.query;
  const farmerLat = lat ? parseFloat(lat) : 31.6340;
  const farmerLon = lon ? parseFloat(lon) : 74.8723;
  const radius = parseFloat(radiusKm);

  let nearby = db.findMandis()
    .map(m => ({
      ...m,
      distanceKm: db.haversineDistance(farmerLat, farmerLon, m.latitude, m.longitude),
    }))
    .filter(m => m.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (commodity) {
    nearby = nearby.map(m => {
      const prices = db.findMarketPrices({ mandiId: m.id, commodity, limit: 1 });
      return { ...m, latestPrice: prices[0] || null };
    });
  }

  return sendSuccess(res, nearby, 'Nearby mandis fetched.');
});

router.get('/:id', (req, res) => {
  const mandi = db.findMandi(req.params.id);
  if (!mandi) return sendError(res, 'Mandi not found.', 404);
  const recentPrices = db.findMarketPrices({ mandiId: mandi.id, limit: 30 });
  return sendSuccess(res, { ...mandi, recentPrices }, 'Mandi details fetched.');
});

module.exports = router;
