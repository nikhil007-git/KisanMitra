const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/market/prices
 * Fetch daily market prices with filters
 * Query: commodity, mandiId, state, fromDate, toDate, limit
 */
const getMarketPrices = async (req, res, next) => {
  try {
    const { commodity, mandiId, state, fromDate, toDate, limit = 30 } = req.query;

    const where = {
      ...(commodity && { commodity: { equals: commodity, mode: 'insensitive' } }),
      ...(mandiId && { mandiId }),
      ...(fromDate || toDate
        ? {
            priceDate: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {}),
      ...(state && { mandi: { state } }),
    };

    const prices = await prisma.marketPrice.findMany({
      where,
      include: {
        mandi: {
          select: { id: true, name: true, state: true, district: true, city: true },
        },
      },
      orderBy: { priceDate: 'desc' },
      take: Math.min(parseInt(limit, 10), 200),
    });

    return sendSuccess(res, prices, 'Market prices fetched successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/market/prices/latest
 * Get latest price for each mandi for a given commodity
 */
const getLatestPrices = async (req, res, next) => {
  try {
    const { commodity } = req.query;
    if (!commodity) return sendError(res, 'commodity query param is required.', 400);

    const prices = await prisma.marketPrice.findMany({
      where: { commodity: { equals: commodity, mode: 'insensitive' } },
      orderBy: { priceDate: 'desc' },
      distinct: ['mandiId'],
      include: {
        mandi: {
          select: { id: true, name: true, state: true, district: true, city: true },
        },
      },
    });

    return sendSuccess(res, prices, `Latest ${commodity} prices fetched.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/market/prices/trend
 * Get 90-day price trend for a commodity at a specific mandi
 * Query: commodity, mandiId, days (default 90)
 */
const getPriceTrend = async (req, res, next) => {
  try {
    const { commodity, mandiId, days = 90 } = req.query;
    if (!commodity || !mandiId) {
      return sendError(res, 'commodity and mandiId are required.', 400);
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days, 10));

    const trend = await prisma.marketPrice.findMany({
      where: {
        mandiId,
        commodity: { equals: commodity, mode: 'insensitive' },
        priceDate: { gte: fromDate },
      },
      orderBy: { priceDate: 'asc' },
      select: {
        priceDate: true,
        minPrice: true,
        maxPrice: true,
        modalPrice: true,
        arrivalTonnes: true,
      },
    });

    // Calculate statistics
    if (trend.length > 0) {
      const modals = trend.map((t) => t.modalPrice);
      const avg = modals.reduce((a, b) => a + b, 0) / modals.length;
      const min = Math.min(...modals);
      const max = Math.max(...modals);
      const latest = modals[modals.length - 1];
      const oldest = modals[0];
      const changePercent = (((latest - oldest) / oldest) * 100).toFixed(1);

      return sendSuccess(
        res,
        {
          trend,
          stats: {
            avgModalPrice: Math.round(avg),
            minModalPrice: min,
            maxModalPrice: max,
            currentModalPrice: latest,
            priceChangePercent: parseFloat(changePercent),
            dataPoints: trend.length,
          },
        },
        `${days}-day price trend fetched.`
      );
    }

    return sendSuccess(res, { trend: [], stats: null }, 'No price data available for this period.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/market/commodities
 * Get list of all distinct commodities in database
 */
const getCommodities = async (req, res, next) => {
  try {
    const result = await prisma.marketPrice.findMany({
      distinct: ['commodity'],
      select: { commodity: true },
      orderBy: { commodity: 'asc' },
    });
    const commodities = result.map((r) => r.commodity);
    return sendSuccess(res, commodities, 'Commodities list fetched.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/market/prices (admin - add price record)
 */
const addMarketPrice = async (req, res, next) => {
  try {
    const { mandiId, commodity, variety, priceDate, minPrice, maxPrice, modalPrice, arrivalTonnes, source } = req.body;

    const price = await prisma.marketPrice.create({
      data: {
        mandiId,
        commodity,
        variety: variety || null,
        priceDate: new Date(priceDate),
        minPrice: parseFloat(minPrice),
        maxPrice: parseFloat(maxPrice),
        modalPrice: parseFloat(modalPrice),
        arrivalTonnes: arrivalTonnes ? parseFloat(arrivalTonnes) : null,
        source: source || 'manual',
      },
    });

    return sendSuccess(res, price, 'Market price added.', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMarketPrices, getLatestPrices, getPriceTrend, getCommodities, addMarketPrice };
