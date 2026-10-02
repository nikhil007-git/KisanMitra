/**
 * Utility helper to extract JWT token from Authorization header or HttpOnly Cookie
 */
const extractToken = (req) => {
  // 1. Check Bearer Authorization Header
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // 2. Check HttpOnly Cookie 'km_token'
  const cookieHeader = req.headers?.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)km_token=([^;]*)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
};

/**
 * Standard cookie configuration options
 */
const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Inaccessible to client-side JS (immune to XSS token theft)
    secure: isProd, // Only transmitted over HTTPS in production
    sameSite: isProd ? 'none' : 'lax', // 'none' needed for cross-origin frontend-backend deployments
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

const getClearCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
};

module.exports = {
  extractToken,
  getCookieOptions,
  getClearCookieOptions,
};

