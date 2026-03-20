const jwt = require('jsonwebtoken');
const env = require('../config/env');

const extractBearerToken = (authorizationHeader) => {
  const raw = String(authorizationHeader || '').trim();

  if (!raw.startsWith('Bearer ')) {
    return null;
  }

  return raw.slice(7).trim();
};

const authenticate = (req, res, next) => {
  if (!env.jwtSecret) {
    const error = new Error('JWT secret is missing. Please set JWT_SECRET in .env.');
    error.statusCode = 500;
    return next(error);
  }

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    const error = new Error('Authorization token is required. Use Bearer <token>.');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      profileId: payload.profileId || null,
      profileModel: payload.profileModel || null,
      email: payload.email || null,
      name: payload.name || null,
    };

    next();
  } catch (error) {
    error.statusCode = 401;
    error.message = 'Invalid or expired authorization token.';
    next(error);
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    const error = new Error('User authentication is required.');
    error.statusCode = 401;
    return next(error);
  }

  if (!allowedRoles.includes(req.user.role)) {
    const error = new Error('You are not allowed to access this resource.');
    error.statusCode = 403;
    return next(error);
  }

  next();
};

const requireOwnedProfileParam = (paramKey) => (req, res, next) => {
  if (!req.user) {
    const error = new Error('User authentication is required.');
    error.statusCode = 401;
    return next(error);
  }

  if (!req.user.profileId) {
    return next();
  }

  const requestedProfileId = String(req.params[paramKey] || '').trim();

  if (requestedProfileId && requestedProfileId !== String(req.user.profileId)) {
    const error = new Error('You can only access your own profile resources.');
    error.statusCode = 403;
    return next(error);
  }

  next();
};

module.exports = {
  authenticate,
  authorizeRoles,
  requireOwnedProfileParam,
};
