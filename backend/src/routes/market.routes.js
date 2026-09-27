const express = require('express');
const router = express.Router();
const db = require('../data/mockData');
const { sendSuccess, sendError } = require('../utils/response');

router.get('/', (req, res) => {
  const { commodity, mandiId, limit = 30 } = req.query;
  const prices = db.findMarketPrices({ commodity, mandiId, limit: +limit });
  return sendSuccess(res, prices, 'Market prices fetched.');
});

router.get('/latest', (req, res) => {
  const { commodity = 'Wheat' } = req.query;
  const mandis = db.findMandis();
  const result = mandis.map(m => {
    const prices = db.findMarketPrices({ mandiId: m.id, commodity, limit: 1 });
    const latest = prices[0];
    return latest ? { ...latest, mandi: m } : null;
  }).filter(Boolean);

  return sendSuccess(res, result, `Latest ${commodity} prices fetched.`);
});

router.get('/trend', (req, res) => {
  const { commodity = 'Wheat', mandiId = 'm-1', days = 30 } = req.query;
  const prices = db.findMarketPrices({ mandiId, commodity, limit: +days });
  if (!prices.length) return sendSuccess(res, { trend: [], stats: null }, 'No data.');

  const modals = prices.map(p => p.modalPrice);
  const stats = {
    avgModalPrice: Math.round(modals.reduce((a, b) => a + b, 0) / modals.length),
    minModalPrice: Math.min(...modals),
    maxModalPrice: Math.max(...modals),
    currentModalPrice: prices[0]?.modalPrice,
    priceChangePercent: parseFloat((((prices[0]?.modalPrice - prices[prices.length - 1]?.modalPrice) / prices[prices.length - 1]?.modalPrice) * 100).toFixed(1)),
    dataPoints: prices.length,
  };

  return sendSuccess(res, { trend: [...prices].reverse(), stats }, `${days}-day trend fetched.`);
});

router.get('/commodities', (req, res) => {
  const commodities = ['Wheat', 'Rice', 'Mustard', 'Cotton', 'Maize', 'Soybean', 'Sugarcane', 'Onion', 'Potato'];
  return sendSuccess(res, commodities, 'Commodities list fetched.');
});

router.post('/', (req, res) => {
  const { mandiId, commodity, priceDate, modalPrice } = req.body;
  if (!mandiId || !commodity || !modalPrice) return sendError(res, 'mandiId, commodity and modalPrice required.', 400);
  return sendSuccess(res, { id: require('uuid').v4(), mandiId, commodity, modalPrice: +modalPrice, priceDate: priceDate || new Date() }, 'Price recorded.', 201);
});

module.exports = router;
