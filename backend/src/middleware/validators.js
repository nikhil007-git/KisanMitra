const { body, param, query } = require('express-validator');
const { validate } = require('./errorHandler');

// Allowed languages in the application
const ALLOWED_LANGUAGES = ['en', 'hi', 'pa', 'gu', 'mr', 'ta', 'te', 'kn', 'bn'];

// Sanitized text validator (disallow raw control characters)
const sanitizeText = (field, min = 1, max = 255) =>
  body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`)
    .escape();

// Auth validators
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]{10,15}$/).withMessage('Valid phone number required (10-15 digits)'),
  body('password')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Valid email address required')
    .normalizeEmail(),
  body('language')
    .optional()
    .isIn(ALLOWED_LANGUAGES).withMessage(`Language must be one of: ${ALLOWED_LANGUAGES.join(', ')}`),
  body('farmSizeAcres')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100000 }).withMessage('Farm size must be a non-negative number up to 100,000 acres'),
  body('state')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('State name must not exceed 100 characters'),
  body('district')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('District name must not exceed 100 characters'),
  body('village')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Village name must not exceed 100 characters'),
  validate,
];

const validateLogin = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 5, max: 20 }).withMessage('Invalid phone number format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Password exceeds maximum length'),
  validate,
];

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('language')
    .optional()
    .isIn(ALLOWED_LANGUAGES).withMessage(`Language must be one of: ${ALLOWED_LANGUAGES.join(', ')}`),
  body('farmSizeAcres')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100000 }).withMessage('Farm size must be between 0 and 100,000'),
  body('state').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('district').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('village').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('latitude')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  validate,
];

// Assistant validators
const validateChat = [
  body('message')
    .isString().withMessage('Message is required')
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
  body('language').optional().isString().isLength({ max: 10 }),
  body('cropContext').optional().isString().isLength({ max: 100 }),
  body('location').optional().isString().isLength({ max: 150 }),
  body('farmerName').optional().isString().isLength({ max: 100 }),
  body('crops').optional().isString().isLength({ max: 200 }),
  body('land').optional().isString().isLength({ max: 50 }),
  validate,
];

const validateDiagnose = [
  body('description')
    .optional()
    .isString().trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  body('crop')
    .optional()
    .isString().trim()
    .isLength({ max: 100 }).withMessage('Crop name must not exceed 100 characters'),
  validate,
];

// Crop validators
const validateAddCrop = [
  body('name')
    .trim()
    .notEmpty().withMessage('Crop name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Crop name must be 2-100 characters'),
  body('season')
    .trim()
    .notEmpty().withMessage('Season is required')
    .isLength({ min: 2, max: 50 }).withMessage('Season must be 2-50 characters'),
  body('area')
    .optional()
    .isFloat({ min: 0.01, max: 100000 }).withMessage('Area must be a positive number'),
  body('areaUnit')
    .optional()
    .isString().isLength({ max: 20 }),
  body('soilType')
    .optional()
    .isString().isLength({ max: 50 }),
  body('waterAvailability')
    .optional()
    .isString().isLength({ max: 50 }),
  body('variety')
    .optional({ nullable: true })
    .isString().isLength({ max: 100 }),
  body('notes')
    .optional({ nullable: true })
    .isString().isLength({ max: 1000 }),
  validate,
];

// Calculator validators
const validateTransportCalc = [
  body('fromLat').optional().isFloat({ min: -90, max: 90 }),
  body('fromLon').optional().isFloat({ min: -180, max: 180 }),
  body('toLat').optional().isFloat({ min: -90, max: 90 }),
  body('toLon').optional().isFloat({ min: -180, max: 180 }),
  body('quantityQtl')
    .optional()
    .isFloat({ min: 0.1, max: 100000 }).withMessage('Quantity must be between 0.1 and 100,000 quintals'),
  body('vehicleType')
    .optional()
    .isIn(['small', 'medium', 'large']).withMessage('Vehicle type must be small, medium, or large'),
  body('distanceKm')
    .optional()
    .isFloat({ min: 0.1, max: 10000 }).withMessage('Distance must be a positive number'),
  validate,
];

const validateProfitCalc = [
  body('quantityQtl').optional().isFloat({ min: 0.1, max: 100000 }),
  body('modalPricePerQtl').optional().isFloat({ min: 0, max: 1000000 }),
  body('transportCostTotal').optional().isFloat({ min: 0, max: 1000000 }),
  body('mandiFeePercent').optional().isFloat({ min: 0, max: 100 }),
  body('bagCostPerQtl').optional().isFloat({ min: 0, max: 10000 }),
  body('labourCostPerQtl').optional().isFloat({ min: 0, max: 10000 }),
  body('otherCosts').optional().isFloat({ min: 0, max: 1000000 }),
  validate,
];

// Prediction & Decision validators
const validatePricePrediction = [
  body('commodity').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('mandiId').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('horizon')
    .optional()
    .isInt({ min: 1, max: 90 }).withMessage('Prediction horizon must be between 1 and 90 days'),
  validate,
];

const validateDecision = [
  body('commodity').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('mandiId').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('quantityQtl')
    .optional()
    .isFloat({ min: 0.1, max: 100000 }).withMessage('Quantity must be between 0.1 and 100,000 quintals'),
  validate,
];

// Parameter validators
const validateIdParam = [
  param('id')
    .isString().trim()
    .isLength({ min: 1, max: 100 }).withMessage('Invalid ID parameter')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('ID contains invalid characters'),
  validate,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChat,
  validateDiagnose,
  validateAddCrop,
  validateTransportCalc,
  validateProfitCalc,
  validatePricePrediction,
  validateDecision,
  validateIdParam,
};
