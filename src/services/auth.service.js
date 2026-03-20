const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const AuthUser = require('../models/authUser.model');
const Customer = require('../models/customer.model');
const Halwai = require('../models/halwai.model');

const googleClient = new OAuth2Client(env.googleClientId || undefined);

const assertDatabaseConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database is not connected. Please set MONGO_URI and restart server.');
    error.statusCode = 503;
    throw error;
  }
};

const assertJwtConfigured = () => {
  if (!env.jwtSecret) {
    const error = new Error('JWT secret is missing. Please set JWT_SECRET in .env.');
    error.statusCode = 500;
    throw error;
  }
};

const verifyGoogleIdToken = async (idToken) => {
  if (!idToken) {
    const error = new Error('Google idToken is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!env.googleClientId) {
    const error = new Error('Google client id is missing. Please set GOOGLE_CLIENT_ID in .env.');
    error.statusCode = 500;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload?.email) {
    const error = new Error('Invalid Google token payload.');
    error.statusCode = 401;
    throw error;
  }

  return payload;
};

const toAuthResponseUser = (authUser) => ({
  userId: authUser._id,
  name: authUser.name,
  email: authUser.email,
  role: authUser.role,
  profileId: authUser.profileId,
  profileModel: authUser.profileModel,
  picture: authUser.picture,
});

const issueAccessToken = (authUser) => {
  assertJwtConfigured();

  return jwt.sign(
    {
      userId: String(authUser._id),
      role: authUser.role,
      profileId: authUser.profileId ? String(authUser.profileId) : null,
      profileModel: authUser.profileModel || null,
      email: authUser.email,
      name: authUser.name,
    },
    env.jwtSecret,
    {
      expiresIn: '7d',
    }
  );
};

const loginWithGoogle = async ({ idToken, role }) => {
  assertDatabaseConnected();

  if (!['customer', 'halwai'].includes(role)) {
    const error = new Error('Role must be either customer or halwai.');
    error.statusCode = 400;
    throw error;
  }

  const googlePayload = await verifyGoogleIdToken(idToken);
  const googleId = String(googlePayload.sub);
  const email = String(googlePayload.email).toLowerCase();
  const name = String(googlePayload.name || email).trim();
  const picture = String(googlePayload.picture || '').trim();

  let authUser = await AuthUser.findOne({
    $or: [{ googleId }, { email }],
  });

  if (!authUser) {
    authUser = await AuthUser.create({
      googleId,
      email,
      name,
      picture,
      role,
      lastLoginAt: new Date(),
    });
  } else {
    if (authUser.role !== role) {
      const error = new Error(`This account is already registered as ${authUser.role}.`);
      error.statusCode = 409;
      throw error;
    }

    authUser.googleId = googleId;
    authUser.name = name;
    authUser.picture = picture;
    authUser.lastLoginAt = new Date();
    await authUser.save();
  }

  const token = issueAccessToken(authUser);

  return {
    token,
    user: toAuthResponseUser(authUser),
  };
};

const getAuthUserById = async (userId) => {
  assertDatabaseConnected();
  return AuthUser.findById(userId);
};

const linkAuthProfile = async ({ userId, role, profileId }) => {
  assertDatabaseConnected();

  if (!mongoose.isValidObjectId(profileId)) {
    const error = new Error('profileId must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const authUser = await AuthUser.findById(userId);

  if (!authUser) {
    const error = new Error('Authenticated user not found.');
    error.statusCode = 404;
    throw error;
  }

  if (authUser.role !== role) {
    const error = new Error('Requested role does not match authenticated user role.');
    error.statusCode = 403;
    throw error;
  }

  if (role === 'customer') {
    const customer = await Customer.findById(profileId);
    if (!customer) {
      const error = new Error('Customer profile not found.');
      error.statusCode = 404;
      throw error;
    }

    authUser.profileId = customer._id;
    authUser.profileModel = 'Customer';
  }

  if (role === 'halwai') {
    const halwai = await Halwai.findById(profileId);
    if (!halwai) {
      const error = new Error('Halwai profile not found.');
      error.statusCode = 404;
      throw error;
    }

    authUser.profileId = halwai._id;
    authUser.profileModel = 'Halwai';
  }

  await authUser.save();

  const token = issueAccessToken(authUser);

  return {
    token,
    user: toAuthResponseUser(authUser),
  };
};

const attachHalwaiProfileToAuthUser = async (userId, halwaiId) => {
  assertDatabaseConnected();

  const authUser = await AuthUser.findById(userId);

  if (!authUser) {
    return null;
  }

  if (authUser.role !== 'halwai') {
    const error = new Error('Only halwai users can be linked to halwai profile.');
    error.statusCode = 403;
    throw error;
  }

  authUser.profileId = halwaiId;
  authUser.profileModel = 'Halwai';
  await authUser.save();

  return authUser;
};

module.exports = {
  loginWithGoogle,
  getAuthUserById,
  linkAuthProfile,
  attachHalwaiProfileToAuthUser,
};
