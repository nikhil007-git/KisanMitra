const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const config = require('../config');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/auth/register
 * Register a new farmer
 */
const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, language, state, district, village, farmSizeAcres } = req.body;

    // Check if phone already registered
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return sendError(res, 'Phone number already registered. Please login.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        passwordHash,
        language: language || 'hi',
        state: state || null,
        district: district || null,
        village: village || null,
        farmSizeAcres: farmSizeAcres ? parseFloat(farmSizeAcres) : null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        language: true,
        state: true,
        district: true,
        createdAt: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return sendSuccess(res, { user, token }, 'Registration successful! Welcome to KisanMitra.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login with phone + password
 */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return sendError(res, 'Phone number not registered. Please sign up.', 404);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return sendError(res, 'Incorrect password. Please try again.', 401);
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful!');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        language: true,
        state: true,
        district: true,
        village: true,
        farmSizeAcres: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        _count: { select: { crops: true, decisions: true } },
      },
    });
    return sendSuccess(res, user, 'Profile fetched successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile
 * Update farmer profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, language, state, district, village, farmSizeAcres, latitude, longitude } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(language && { language }),
        ...(state !== undefined && { state }),
        ...(district !== undefined && { district }),
        ...(village !== undefined && { village }),
        ...(farmSizeAcres !== undefined && { farmSizeAcres: parseFloat(farmSizeAcres) }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
      },
      select: {
        id: true, name: true, phone: true, email: true,
        language: true, state: true, district: true,
        village: true, farmSizeAcres: true, latitude: true, longitude: true,
      },
    });

    return sendSuccess(res, updated, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return sendError(res, 'Current password is incorrect.', 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    return sendSuccess(res, null, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
