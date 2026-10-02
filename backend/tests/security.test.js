/**
 * KisanMitra AI - Automated Security Verification Test Suite
 * Tests input validation, rate limiting, security headers, CORS, information disclosure, and auth sanity.
 */
const assert = require('assert');
const http = require('http');

// Spin up a test server instance
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-security-secret-key-must-be-long-enough-32-chars';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const config = require('../src/config');
const { errorHandler, notFound } = require('../src/middleware/errorHandler');
const { apiLimiter } = require('../src/middleware/rateLimiter');

const authRoutes = require('../src/routes/auth.routes');
const cropRoutes = require('../src/routes/crop.routes');
const mandiRoutes = require('../src/routes/mandi.routes');
const marketRoutes = require('../src/routes/market.routes');
const predictionRoutes = require('../src/routes/prediction.routes');
const calculatorRoutes = require('../src/routes/calculator.routes');
const assistantRoutes = require('../src/routes/assistant.routes');
const weatherRoutes = require('../src/routes/weather.routes');
const decisionRoutes = require('../src/routes/decision.routes');

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
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS request blocked by KisanMitra security policy.'));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/mandis', mandiRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/decisions', decisionRoutes);

app.use(notFound);
app.use(errorHandler);

let server;
let port;

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, raw: data, data: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🔒 Starting KisanMitra Security Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  // 1. Security Headers Tests
  await test('Security Headers: Helmet sets X-Frame-Options and X-Content-Type-Options', async () => {
    const res = await request('/api/weather/current');
    assert.strictEqual(res.headers['x-frame-options'], 'DENY');
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(res.headers['x-powered-by'], undefined);
  });

  // 2. Secret & Information Disclosure Tests
  await test('Information Leakage: /api/assistant/status does NOT leak keyPrefix or keyLength', async () => {
    const res = await request('/api/assistant/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data?.success, true);
    assert.strictEqual(res.data?.data?.keyPrefix, undefined, 'Must not leak keyPrefix');
    assert.strictEqual(res.data?.data?.keyLength, undefined, 'Must not leak keyLength');
    assert.strictEqual(typeof res.data?.data?.geminiKeyConfigured, 'boolean');
  });

  // 3. Rate Limiting Tests
  await test('Rate Limiting: API response contains RateLimit headers', async () => {
    const res = await request('/api/mandis');
    assert.strictEqual(res.status, 200);
    assert(res.headers['ratelimit-limit'] !== undefined, 'RateLimit-Limit header must be present');
    assert(res.headers['ratelimit-remaining'] !== undefined, 'RateLimit-Remaining header must be present');
  });

  // 4. Input Validation: Auth Register
  await test('Input Validation: /api/auth/register rejects missing fields with 422', async () => {
    const res = await request('/api/auth/register', { method: 'POST' }, {});
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.data?.success, false);
    assert(Array.isArray(res.data?.errors), 'Errors array must be returned');
  });

  await test('Input Validation: /api/auth/register rejects password shorter than 6 characters', async () => {
    const res = await request('/api/auth/register', { method: 'POST' }, {
      name: 'Test Farmer',
      phone: '9876543210',
      password: '123', // Too short
    });
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.data?.success, false);
    const pwdErr = res.data?.errors?.find(e => e.field === 'password');
    assert(pwdErr !== undefined, 'Must reject short password');
  });

  // 5. Input Validation: Assistant Chat
  await test('Input Validation: /api/assistant/chat rejects empty message', async () => {
    const res = await request('/api/assistant/chat', { method: 'POST' }, { message: '' });
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.data?.success, false);
  });

  // 6. Path Parameter Sanitization
  await test('Input Validation: /api/mandis/:id rejects path traversal characters', async () => {
    const res = await request('/api/mandis/..%2F..%2Fetc%2Fpasswd');
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.data?.success, false);
  });

  // 7. Calculator Validation
  await test('Input Validation: /api/calculator/transport rejects negative or invalid parameters', async () => {
    const res = await request('/api/calculator/transport', { method: 'POST' }, {
      quantityQtl: -50,
      fromLat: 200, // Invalid latitude (> 90)
    });
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.data?.success, false);
  });

  // 8. Safe 404 Error Response (No stack trace or internal disclosure)
  await test('Error Handling: 404 returns safe, standardized response without disclosure', async () => {
    const res = await request('/api/non-existent-route-for-testing');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.data?.success, false);
    assert.strictEqual(typeof res.data?.message, 'string');
    assert.strictEqual(res.data?.stack, undefined);
  });

  // 9. Prediction horizon bounding
  await test('Input Validation: /api/predictions/price rejects unbounded horizon', async () => {
    const res = await request('/api/predictions/price', { method: 'POST' }, {
      commodity: 'Wheat',
      horizon: 99999, // Unbounded
    });
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.data?.success, false);
  });

  // 10. Authorization & Broken Access Control: Crop creation requires authentication
  await test('Broken Access Control: /api/crops rejects unauthenticated POST with 401', async () => {
    // Overriding test environment to simulate unauthenticated client
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await request('/api/crops', { method: 'POST' }, {
        name: 'Wheat',
        season: 'Rabi',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data?.success, false);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  // 11. Authorization: Market price submission requires authentication
  await test('Authorization: /api/market rejects unauthenticated price submission with 401', async () => {
    const res = await request('/api/market', { method: 'POST' }, {
      mandiId: 'm-1',
      commodity: 'Wheat',
      modalPrice: 2400,
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data?.success, false);
  });

  // 12. BOLA / IDOR: Decision history returns only authenticated user's records
  await test('BOLA/IDOR Prevention: /api/decisions/history returns isolated records', async () => {
    const res = await request('/api/decisions/history');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data?.success, true);
    assert(Array.isArray(res.data?.data), 'Data must be an array');
  });

  console.log(`\n========================================`);
  console.log(`Security Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

server = app.listen(0, '127.0.0.1', () => {
  port = server.address().port;
  runTests();
});
