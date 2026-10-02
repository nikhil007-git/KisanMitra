const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { sendSuccess, sendError } = require('../utils/response');
const db = require('../data/mockData');
const { validateDecision } = require('../middleware/validators');
const { extractToken } = require('../utils/token');

const JWT_SECRET = config.jwt?.secret || process.env.JWT_SECRET || 'kisanmitra-secret-dev-2025';

function resolveUser(req) {
  try {
    const token = extractToken(req);
    if (token) {
      if (token.startsWith('local_token_') && process.env.NODE_ENV !== 'production') {
        return db.users[0];
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.findUser(decoded.userId);
      if (user) return user;
    }
  } catch (err) {
    // Invalid or expired token
  }
  return null;
}

router.post('/', validateDecision, (req, res) => {
  const user = resolveUser(req);
  const { commodity = 'Wheat', mandiId = 'm-2', quantityQtl = 55, cropId } = req.body;
  const mandi = db.findMandi(mandiId) || db.mandis[0];
  const prices = db.findMarketPrices({ mandiId: mandi.id, commodity, limit: 14 });
  const currentPrice = prices[0]?.modalPrice || 2380;
  const transportCost = Math.round(45 * 7 * +quantityQtl / 100);
  const gross = currentPrice * +quantityQtl;
  const net = gross - transportCost - Math.round(gross * mandi.fee / 100);

  const decision = {
    id: uuidv4(),
    userId: user ? user.id : (process.env.NODE_ENV === 'production' ? null : db.users[0]?.id),
    commodity,
    mandiId: mandi.id,
    mandiName: mandi.name,
    quantityQtl: +quantityQtl,
    currentModalPrice: currentPrice,
    transportCostTotal: transportCost,
    netProfitEstimate: net,
    recommendation: 'SELL_NOW',
    confidence: 0.84,
    reasoning: [
      `Wheat price is ₹${currentPrice}/qtl — ₹105 above MSP (₹2,275/qtl).`,
      'Heavy rain forecast on Wednesday will halt harvesting and transport.',
      'Ludhiana Mandi offers the highest net return after transport expenses.',
      'Holding past 7 days increases storage and pest risk.'
    ],
    trendDirection: 'STABLE_PEAK',
    predictedPrice30Day: Math.round(currentPrice * 1.02),
    factors: { weatherRisk: 8, priceVolatility: 3, arrivalPressure: 6, seasonalDemand: 8, storageRisk: 7 },
    bestTimeToSell: 'Next 48–72 hours before expected rainfall',
    createdAt: new Date(),
  };

  db.addDecision(decision);
  return sendSuccess(res, decision, 'Selling decision generated.');
});

// Protected against BOLA/IDOR: returns only decisions belonging to the authenticated user
router.get('/history', (req, res) => {
  const user = resolveUser(req);
  const userId = user ? user.id : (process.env.NODE_ENV === 'production' ? null : db.users[0]?.id);

  if (!userId) {
    return sendSuccess(res, [], 'Decision history fetched.');
  }

  const userDecisions = db.findDecisions(userId);
  return sendSuccess(res, userDecisions, 'Decision history fetched.');
});

module.exports = router;
