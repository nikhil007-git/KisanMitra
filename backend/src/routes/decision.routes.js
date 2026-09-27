const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sendSuccess, sendError } = require('../utils/response');
const db = require('../data/mockData');

router.post('/', (req, res) => {
  const { commodity = 'Wheat', mandiId = 'm-2', quantityQtl = 55, cropId } = req.body;
  const mandi = db.findMandi(mandiId) || db.mandis[0];
  const prices = db.findMarketPrices({ mandiId: mandi.id, commodity, limit: 14 });
  const currentPrice = prices[0]?.modalPrice || 2380;
  const transportCost = Math.round(45 * 7 * +quantityQtl / 100);
  const gross = currentPrice * +quantityQtl;
  const net = gross - transportCost - Math.round(gross * mandi.fee / 100);

  const decision = {
    id: uuidv4(),
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

router.get('/history', (req, res) => {
  return sendSuccess(res, db.decisions, 'Decision history fetched.');
});

module.exports = router;
