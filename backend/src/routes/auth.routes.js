const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/mockData');
const { sendSuccess, sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'kisanmitra-secret-dev-2025';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, language, state, district, village, farmSizeAcres } = req.body;
    if (!name || !phone || !password) return sendError(res, 'Name, phone and password are required.', 400);

    if (db.findUserByPhone(phone)) return sendError(res, 'Phone number already registered. Please login.', 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(), name, phone, email: email || null, passwordHash,
      language: language || 'en', state: state || null, district: district || null,
      village: village || null, farmSizeAcres: farmSizeAcres ? +farmSizeAcres : null,
      latitude: 31.634, longitude: 74.872, createdAt: new Date(),
    };
    db.addUser(user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const { passwordHash: _, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser, token }, 'Registration successful! Welcome to KisanMitra.', 201);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return sendError(res, 'Phone and password are required.', 400);

    const user = db.findUserByPhone(phone);
    if (!user) return sendError(res, 'Phone number not registered. Please sign up.', 404);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return sendError(res, 'Incorrect password.', 401);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const { passwordHash: _, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser, token }, 'Login successful!');
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return sendError(res, 'Access token required.', 401);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUser(decoded.userId);
    if (!user) return sendError(res, 'User not found.', 404);
    const { passwordHash: _, ...safeUser } = user;
    return sendSuccess(res, safeUser, 'Profile fetched.');
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 'Session expired. Please login again.', 401);
    return sendError(res, 'Invalid token.', 401);
  }
});

router.put('/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return sendError(res, 'Access token required.', 401);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUser(decoded.userId);
    if (!user) return sendError(res, 'User not found.', 404);

    const allowed = ['name', 'email', 'language', 'state', 'district', 'village', 'farmSizeAcres', 'latitude', 'longitude'];
    allowed.forEach(k => { if (req.body[k] !== undefined) user[k] = req.body[k]; });
    const { passwordHash: _, ...safeUser } = user;
    return sendSuccess(res, safeUser, 'Profile updated.');
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
