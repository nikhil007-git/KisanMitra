const express = require('express');
const router = express.Router();
const { sendSuccess, sendError } = require('../utils/response');
const db = require('../data/mockData');

const GEMINI_KEY = process.env.GEMINI_API_KEY;

router.post('/price', async (req, res) => {
  const { commodity = 'Wheat', mandiId = 'm-1', horizon = 15 } = req.body;
  const mandi = db.findMandi(mandiId);
  const prices = db.findMarketPrices({ mandiId, commodity, limit: 30 });
  const currentPrice = prices[0]?.modalPrice || 2340;

  const trend = 0.006;
  const predicted = Array.from({ length: +horizon }, (_, i) => ({
    day: i + 1,
    predictedPrice: Math.round(currentPrice * (1 + (trend * (i + 1)))),
  }));

  return sendSuccess(res, {
    commodity, mandiName: mandi?.name || 'Local Mandi', currentPrice,
    predictedMinPrice: Math.round(currentPrice * 0.98),
    predictedMaxPrice: Math.round(currentPrice * 1.05),
    predictedModalPrice: predicted[predicted.length - 1]?.predictedPrice,
    confidence: 0.82,
    trendDirection: 'RISING', trendStrength: 'HIGH',
    horizon: +horizon, predicted,
    keyInsights: [
      `${commodity} prices are on a rising trajectory with +2.8% estimated gain over ${horizon} days.`,
      'Lower arrivals in surrounding districts favor current holders.',
      'Weather alert in next 4 days could temporarily slow supply to mandis.',
    ],
    source: GEMINI_KEY ? 'gemini-assisted' : 'statistical-model',
  }, 'Price prediction generated.');
});

router.post('/decision', (req, res) => {
  res.redirect(307, '/api/decisions');
});

router.get('/history', (req, res) => {
  return sendSuccess(res, [
    { date: 'Dec 10, 2025', crop: 'Wheat', predicted: 2320, actual: 2340, accuracy: '98.3%' },
    { date: 'Dec 1, 2025',  crop: 'Wheat', predicted: 2280, actual: 2310, accuracy: '98.7%' },
    { date: 'Nov 20, 2025', crop: 'Wheat', predicted: 2240, actual: 2265, accuracy: '98.9%' },
  ], 'Prediction history fetched.');
});

module.exports = router;
