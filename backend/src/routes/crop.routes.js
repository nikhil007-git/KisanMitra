const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('../data/mockData');
const config = require('../config');
const { sendSuccess, sendError } = require('../utils/response');
const { extractToken } = require('../utils/token');
const { validateAddCrop, validateIdParam } = require('../middleware/validators');

const JWT_SECRET = config.jwt?.secret || process.env.JWT_SECRET || 'kisanmitra-secret-dev-2025';

function resolveUser(req) {
  try {
    const token = extractToken(req);
    if (token) {
      if (token.startsWith('local_token_') && process.env.NODE_ENV !== 'production') {
        return db.users[0];
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      return db.findUser(decoded.userId) || null;
    }
  } catch {}
  return null;
}

router.get('/', (req, res) => {
  const user = resolveUser(req);
  const userId = user ? user.id : (process.env.NODE_ENV === 'production' ? null : db.users[0]?.id);
  if (!userId) return sendSuccess(res, [], 'Crops fetched successfully.');
  const crops = db.findCrops(userId);
  return sendSuccess(res, crops, 'Crops fetched successfully.');
});

router.post('/', validateAddCrop, (req, res) => {
  const user = resolveUser(req);
  const userId = user ? user.id : (process.env.NODE_ENV === 'production' ? null : db.users[0]?.id);
  if (!userId) return sendError(res, 'Authentication required to add crops.', 401);

  const { name, season, area, areaUnit, soilType, waterAvailability, sowingDate, variety, expectedHarvestDate, mandiId, notes, latitude, longitude } = req.body;
  if (!name || !season) return sendError(res, 'Crop name and season are required.', 400);

  const crop = {
    id: uuidv4(), userId, name, season, area: area ? +area : 1,
    areaUnit: areaUnit || 'Acre', soilType: soilType || 'Loamy',
    waterAvailability: waterAvailability || 'Medium',
    sowingDate: sowingDate ? new Date(sowingDate) : new Date(),
    expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : null,
    variety: variety || null, currentStage: 'Sowing', stageNumber: 1, totalStages: 6, stageProgress: 10,
    healthStatus: 'Good', mandiId: mandiId || null, notes: notes || '',
    isActive: true, latitude: latitude ? +latitude : (user?.latitude || 31.634),
    longitude: longitude ? +longitude : (user?.longitude || 74.872), createdAt: new Date(),
  };
  db.addCrop(crop);
  return sendSuccess(res, crop, 'Crop added successfully.', 201);
});

router.get('/:id', validateIdParam, (req, res) => {
  const user = resolveUser(req);
  const userId = user ? user.id : (process.env.NODE_ENV === 'production' ? null : db.users[0]?.id);
  if (!userId) return sendError(res, 'Authentication required.', 401);

  const crop = db.findCrop(req.params.id, userId);
  if (!crop) return sendError(res, 'Crop not found.', 404);
  return sendSuccess(res, crop, 'Crop fetched.');
});

router.put('/:id', validateIdParam, (req, res) => {
  const user = resolveUser(req);
  const userId = user ? user.id : (process.env.NODE_ENV === 'production' ? null : db.users[0]?.id);
  if (!userId) return sendError(res, 'Authentication required to update crops.', 401);

  const updated = db.updateCrop(req.params.id, userId, req.body);
  if (!updated) return sendError(res, 'Crop not found.', 404);
  return sendSuccess(res, updated, 'Crop updated.');
});

router.delete('/:id', validateIdParam, (req, res) => {
  const user = resolveUser(req);
  const userId = user ? user.id : (process.env.NODE_ENV === 'production' ? null : db.users[0]?.id);
  if (!userId) return sendError(res, 'Authentication required to delete crops.', 401);

  const deleted = db.deleteCrop(req.params.id, userId);
  if (!deleted) return sendError(res, 'Crop not found.', 404);
  return sendSuccess(res, null, 'Crop deleted.');
});

router.get('/meta/recommendations', (req, res) => {
  return sendSuccess(res, db.cropRecommendations, 'Crop recommendations fetched.');
});

module.exports = router;
