const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('../data/mockData');
const { sendSuccess, sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'kisanmitra-secret-dev-2025';

function getUser(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return db.users[0]; // Fallback to demo user
    const decoded = jwt.verify(token, JWT_SECRET);
    return db.findUser(decoded.userId) || db.users[0];
  } catch { return db.users[0]; }
}

router.get('/', (req, res) => {
  const user = getUser(req);
  const crops = db.findCrops(user.id);
  return sendSuccess(res, crops, 'Crops fetched successfully.');
});

router.post('/', (req, res) => {
  const user = getUser(req);
  const { name, season, area, areaUnit, soilType, waterAvailability, sowingDate, variety, expectedHarvestDate, mandiId, notes, latitude, longitude } = req.body;
  if (!name || !season) return sendError(res, 'Crop name and season are required.', 400);

  const crop = {
    id: uuidv4(), userId: user.id, name, season, area: area ? +area : 1,
    areaUnit: areaUnit || 'Acre', soilType: soilType || 'Loamy',
    waterAvailability: waterAvailability || 'Medium',
    sowingDate: sowingDate ? new Date(sowingDate) : new Date(),
    expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : null,
    variety: variety || null, currentStage: 'Sowing', stageNumber: 1, totalStages: 6, stageProgress: 10,
    healthStatus: 'Good', mandiId: mandiId || null, notes: notes || '',
    isActive: true, latitude: latitude ? +latitude : user.latitude,
    longitude: longitude ? +longitude : user.longitude, createdAt: new Date(),
  };
  db.addCrop(crop);
  return sendSuccess(res, crop, 'Crop added successfully.', 201);
});

router.get('/:id', (req, res) => {
  const user = getUser(req);
  const crop = db.findCrop(req.params.id, user.id);
  if (!crop) return sendError(res, 'Crop not found.', 404);
  return sendSuccess(res, crop, 'Crop fetched.');
});

router.put('/:id', (req, res) => {
  const user = getUser(req);
  const updated = db.updateCrop(req.params.id, user.id, req.body);
  if (!updated) return sendError(res, 'Crop not found.', 404);
  return sendSuccess(res, updated, 'Crop updated.');
});

router.delete('/:id', (req, res) => {
  const user = getUser(req);
  const deleted = db.deleteCrop(req.params.id, user.id);
  if (!deleted) return sendError(res, 'Crop not found.', 404);
  return sendSuccess(res, null, 'Crop deleted.');
});

router.get('/meta/recommendations', (req, res) => {
  return sendSuccess(res, db.cropRecommendations, 'Crop recommendations fetched.');
});

module.exports = router;
