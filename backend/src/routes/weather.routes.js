const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const db = require('../data/mockData');

router.get('/current', (req, res) => {
  return sendSuccess(res, db.weatherData.current, 'Current weather fetched.');
});

router.get('/forecast', (req, res) => {
  return sendSuccess(res, db.weatherData.forecast, '7-day forecast fetched.');
});

router.get('/alerts', (req, res) => {
  return sendSuccess(res, db.weatherData.alerts, 'Weather alerts fetched.');
});

module.exports = router;
