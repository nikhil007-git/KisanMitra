const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination } = require('../utils/calculations');

/**
 * GET /api/crops
 * Get all crops for authenticated farmer
 */
const getCrops = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { skip, take } = getPagination(page, limit);

    const [crops, total] = await Promise.all([
      prisma.crop.findMany({
        where: { userId: req.user.id, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.crop.count({ where: { userId: req.user.id, isActive: true } }),
    ]);

    return sendPaginated(res, crops, total, page || 1, take, 'Crops fetched successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/crops/:id
 */
const getCropById = async (req, res, next) => {
  try {
    const crop = await prisma.crop.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });
    if (!crop) return sendError(res, 'Crop not found.', 404);
    return sendSuccess(res, crop, 'Crop fetched successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/crops
 */
const createCrop = async (req, res, next) => {
  try {
    const {
      name, nameHindi, variety, sowingDate, harvestDate, growthStage,
      areaAcres, soilType, irrigationType, expectedYield, notes,
    } = req.body;

    const crop = await prisma.crop.create({
      data: {
        userId: req.user.id,
        name,
        nameHindi: nameHindi || null,
        variety: variety || null,
        sowingDate: sowingDate ? new Date(sowingDate) : null,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        growthStage: growthStage || 'SOWING',
        areaAcres: parseFloat(areaAcres),
        soilType: soilType || null,
        irrigationType: irrigationType || null,
        expectedYield: expectedYield ? parseFloat(expectedYield) : null,
        notes: notes || null,
      },
    });

    return sendSuccess(res, crop, 'Crop added successfully!', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/crops/:id
 */
const updateCrop = async (req, res, next) => {
  try {
    const existing = await prisma.crop.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return sendError(res, 'Crop not found.', 404);

    const {
      name, nameHindi, variety, sowingDate, harvestDate,
      growthStage, areaAcres, soilType, irrigationType, expectedYield, notes,
    } = req.body;

    const updated = await prisma.crop.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(nameHindi !== undefined && { nameHindi }),
        ...(variety !== undefined && { variety }),
        ...(sowingDate !== undefined && { sowingDate: sowingDate ? new Date(sowingDate) : null }),
        ...(harvestDate !== undefined && { harvestDate: harvestDate ? new Date(harvestDate) : null }),
        ...(growthStage && { growthStage }),
        ...(areaAcres !== undefined && { areaAcres: parseFloat(areaAcres) }),
        ...(soilType !== undefined && { soilType }),
        ...(irrigationType !== undefined && { irrigationType }),
        ...(expectedYield !== undefined && { expectedYield: parseFloat(expectedYield) }),
        ...(notes !== undefined && { notes }),
      },
    });

    return sendSuccess(res, updated, 'Crop updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/crops/:id (soft delete)
 */
const deleteCrop = async (req, res, next) => {
  try {
    const existing = await prisma.crop.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return sendError(res, 'Crop not found.', 404);

    await prisma.crop.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return sendSuccess(res, null, 'Crop deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getCrops, getCropById, createCrop, updateCrop, deleteCrop };
