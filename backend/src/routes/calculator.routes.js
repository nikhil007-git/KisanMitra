const express = require('express');
const router = express.Router();
const { sendSuccess, sendError } = require('../utils/response');
const { validateTransportCalc, validateProfitCalc } = require('../middleware/validators');

router.post('/transport', validateTransportCalc, (req, res) => {
  const { fromLat, fromLon, toLat, toLon, quantityQtl = 50, vehicleType = 'medium', distanceKm: customDist } = req.body;
  const rates = { small: 10, medium: 7, large: 5.5 };
  const rate = rates[vehicleType] || 7;

  let distanceKm = customDist || 25;
  if (fromLat && fromLon && toLat && toLon) {
    const R = 6371;
    const dLat = ((toLat - fromLat) * Math.PI) / 180;
    const dLon = ((toLon - fromLon) * Math.PI) / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(fromLat*Math.PI/180)*Math.cos(toLat*Math.PI/180)*Math.sin(dLon/2)**2;
    distanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  const transportCost = Math.round(distanceKm * rate * +quantityQtl / 100);
  return sendSuccess(res, {
    distanceKm, vehicleType, ratePerKmPerQtl: rate,
    quantityQtl: +quantityQtl, transportCost,
    costPerQtl: Math.round(transportCost / +quantityQtl),
  }, 'Transport cost calculated.');
});

router.post('/profit', validateProfitCalc, (req, res) => {
  const { quantityQtl = 50, modalPricePerQtl = 2340, transportCostTotal = 1500, mandiFeePercent = 1.5, bagCostPerQtl = 5, labourCostPerQtl = 10, otherCosts = 0 } = req.body;

  const gross = +quantityQtl * +modalPricePerQtl;
  const mandiFee = Math.round(gross * +mandiFeePercent / 100);
  const bags = Math.round(+quantityQtl * +bagCostPerQtl);
  const labour = Math.round(+quantityQtl * +labourCostPerQtl);
  const transport = +transportCostTotal || 0;
  const totalCosts = transport + mandiFee + bags + labour + +otherCosts;
  const net = gross - totalCosts;
  const roi = totalCosts > 0 ? parseFloat(((net / totalCosts) * 100).toFixed(1)) : 0;

  return sendSuccess(res, {
    grossRevenue: gross, transportCost: transport, mandiFee, bagCost: bags,
    labourCost: labour, otherCosts: +otherCosts, totalCosts, netReturn: net,
    netPerQtl: Math.round(net / +quantityQtl), roi,
  }, 'Profit calculated.');
});

router.post('/compare-mandis', (req, res) => {
  const { commodity = 'Wheat', quantityQtl = 50, vehicleType = 'medium', farmerLat = 31.634, farmerLon = 74.872 } = req.body;
  const db = require('../data/mockData');
  const rates = { small: 10, medium: 7, large: 5.5 };
  const rate = rates[vehicleType] || 7;

  const results = db.findMandis().map(m => {
    const prices = db.findMarketPrices({ mandiId: m.id, commodity, limit: 1 });
    const price = prices[0]?.modalPrice || 2300;
    const dist = db.haversineDistance(farmerLat, farmerLon, m.latitude, m.longitude);
    const transport = Math.round(dist * rate * +quantityQtl / 100);
    const gross = price * +quantityQtl;
    const mandiFee = Math.round(gross * m.fee / 100);
    const net = gross - transport - mandiFee;
    return {
      mandiId: m.id, mandiName: m.name, modalPrice: price,
      distanceKm: dist, transportCost: transport, mandiFee,
      grossRevenue: gross, netReturn: net, feePercent: m.fee
    };
  }).sort((a, b) => b.netReturn - a.netReturn);

  return sendSuccess(res, { results, bestMandi: results[0] || null, commodity, quantityQtl: +quantityQtl }, 'Mandi comparison complete.');
});

module.exports = router;

