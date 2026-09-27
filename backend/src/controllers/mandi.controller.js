const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { haversineDistance, getPagination } = require('../utils/calculations');

/**
 * GET /api/mandis
 * List all mandis with optional state/commodity filter
 */
const getMandis = async (req, res, next) => {
  try {
    const { state, district, search, page, limit } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {
      isActive: true,
      ...(state && { state }),
      ...(district && { district }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [mandis, total] = await Promise.all([
      prisma.mandi.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.mandi.count({ where }),
    ]);

    return sendPaginated(res, mandis, total, page || 1, take, 'Mandis fetched successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mandis/nearby
 * Find mandis within radius km from farmer's GPS coordinates
 * Query: lat, lon, radiusKm (default 100), commodity
 */
const getNearbyMandis = async (req, res, next) => {
  try {
    const { lat, lon, radiusKm = 100, commodity } = req.query;

    if (!lat || !lon) {
      return sendError(res, 'Latitude and longitude are required.', 400);
    }

    const farmerLat = parseFloat(lat);
    const farmerLon = parseFloat(lon);
    const radius = parseFloat(radiusKm);

    // Fetch all active mandis
    const allMandis = await prisma.mandi.findMany({
      where: { isActive: true },
    });

    // Calculate distance for each and filter by radius
    const nearbyMandis = allMandis
      .map((mandi) => ({
        ...mandi,
        distanceKm: haversineDistance(farmerLat, farmerLon, mandi.latitude, mandi.longitude),
      }))
      .filter((m) => m.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // If commodity requested, attach latest price
    if (commodity && nearbyMandis.length > 0) {
      const mandiIds = nearbyMandis.map((m) => m.id);
      const latestPrices = await prisma.marketPrice.findMany({
        where: {
          mandiId: { in: mandiIds },
          commodity: { equals: commodity, mode: 'insensitive' },
        },
        orderBy: { priceDate: 'desc' },
        distinct: ['mandiId'],
      });

      const priceMap = new Map(latestPrices.map((p) => [p.mandiId, p]));

      const result = nearbyMandis.map((m) => ({
        ...m,
        latestPrice: priceMap.get(m.id) || null,
      }));

      return sendSuccess(res, result, 'Nearby mandis with prices fetched.');
    }

    return sendSuccess(res, nearbyMandis, 'Nearby mandis fetched successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mandis/:id
 */
const getMandiById = async (req, res, next) => {
  try {
    const mandi = await prisma.mandi.findUnique({
      where: { id: req.params.id },
      include: {
        marketPrices: {
          orderBy: { priceDate: 'desc' },
          take: 30,
        },
      },
    });
    if (!mandi) return sendError(res, 'Mandi not found.', 404);
    return sendSuccess(res, mandi, 'Mandi details fetched.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getMandis, getNearbyMandis, getMandiById };
