require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const config = require('./src/config');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const { apiLimiter } = require('./src/middleware/rateLimiter');

// Route imports
const authRoutes       = require('./src/routes/auth.routes');
const cropRoutes       = require('./src/routes/crop.routes');
const mandiRoutes      = require('./src/routes/mandi.routes');
const marketRoutes     = require('./src/routes/market.routes');
const predictionRoutes = require('./src/routes/prediction.routes');
const calculatorRoutes = require('./src/routes/calculator.routes');
const assistantRoutes  = require('./src/routes/assistant.routes');
const weatherRoutes    = require('./src/routes/weather.routes');
const decisionRoutes   = require('./src/routes/decision.routes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  xContentTypeOptions: true,
}));
app.use(compression());

const allowedOrigins = [
  config.cors?.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && origin.includes('localhost'))
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS request blocked by KisanMitra security policy.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use('/api', apiLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'KisanMitra AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiProvider: 'Google Gemini 2.0 Flash (Free Tier)',
    database: 'PostgreSQL (Prisma ORM)',
  });
});

// Mount Routes
app.use('/api/auth',        authRoutes);
app.use('/api/crops',       cropRoutes);
app.use('/api/mandis',      mandiRoutes);
app.use('/api/market',      marketRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/calculator',  calculatorRoutes);
app.use('/api/assistant',   assistantRoutes);
app.use('/api/weather',     weatherRoutes);
app.use('/api/decisions',   decisionRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = config.server.port || 5000;
app.listen(PORT, () => {
  console.log(`🌾 KisanMitra Backend running on http://localhost:${PORT}`);
});

module.exports = app;
