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

const jwt = require('jsonwebtoken');
const config = require('../config');
const { extractToken } = require('../utils/token');

const JWT_SECRET = config.jwt?.secret || process.env.JWT_SECRET || 'kisanmitra-secret-dev-2025';

router.post('/', (req, res) => {
  const token = extractToken(req);
  if (!token) return sendError(res, 'Authentication required to submit market prices.', 401);

  try {
    if (!token.startsWith('local_token_') || process.env.NODE_ENV === 'production') {
      jwt.verify(token, JWT_SECRET);
    }
  } catch {
    return sendError(res, 'Invalid or expired token.', 401);
  }

  const { mandiId, commodity, priceDate, modalPrice } = req.body;
  if (!mandiId || !commodity || modalPrice === undefined || modalPrice === null) {
    return sendError(res, 'mandiId, commodity and modalPrice required.', 400);
  }

  const numPrice = Number(modalPrice);
  if (isNaN(numPrice) || numPrice <= 0 || numPrice > 1000000) {
    return sendError(res, 'modalPrice must be a valid positive number.', 400);
  }

  return sendSuccess(res, {
    id: require('uuid').v4(),
    mandiId: String(mandiId).slice(0, 50),
    commodity: String(commodity).slice(0, 50),
    modalPrice: numPrice,
    priceDate: priceDate || new Date()
  }, 'Price recorded.', 201);
});

module.exports = router;
