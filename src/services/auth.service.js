const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
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

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
};

const signup = async ({ email, phoneNumber, password, role, name }) => {
  assertDatabaseConnected();
  assertJwtConfigured();

  if ((!email && !phoneNumber) || !password || !role || !name) {
    const error = new Error('Email or phone number, password, role, and name are required.');
    error.statusCode = 400;
    throw error;
  }

  if (!['customer', 'halwai'].includes(role)) {
    const error = new Error('Role must be either customer or halwai.');
    error.statusCode = 400;
    throw error;
  }

  let trimmedEmail = null;
  let trimmedPhone = null;

  if (email) {
    trimmedEmail = String(email).toLowerCase().trim();
    if (!validateEmail(trimmedEmail)) {
      const error = new Error('Please provide a valid email address.');
      error.statusCode = 400;
      throw error;
    }
  }

  if (phoneNumber) {
    trimmedPhone = String(phoneNumber).replace(/\D/g, '').trim();
    if (!validatePhoneNumber(trimmedPhone)) {
      const error = new Error('Please provide a valid 10-digit phone number.');
      error.statusCode = 400;
      throw error;
    }
  }

  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const query = {};
  if (trimmedEmail) query.email = trimmedEmail;
  if (trimmedPhone) query.phoneNumber = trimmedPhone;

  const existingUser = await AuthUser.findOne({ $or: Object.keys(query).map(key => ({ [key]: query[key] })) });

  if (existingUser) {
    const error = new Error(
      `You are already registered as ${existingUser.role}.`
    );
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcryptjs.hash(password, 10);

  const authUser = await AuthUser.create({
    email: trimmedEmail,
    phoneNumber: trimmedPhone,
    password: hashedPassword,
    name: String(name).trim(),
    role,
    lastLoginAt: new Date(),
  });

  const token = issueAccessToken(authUser);

  return {
    token,
    user: toAuthResponseUser(authUser),
  };
};

const login = async ({ email, phoneNumber, password }) => {
  assertDatabaseConnected();
  assertJwtConfigured();

  if ((!email && !phoneNumber) || !password) {
    const error = new Error('Email or phone number and password are required.');
    error.statusCode = 400;
    throw error;
  }

  if (email && phoneNumber) {
    const error = new Error('Please provide either email or phone number, not both.');
    error.statusCode = 400;
    throw error;
  }

  let query = {};

  if (email) {
    const trimmedEmail = String(email).toLowerCase().trim();
    if (!validateEmail(trimmedEmail)) {
      const error = new Error('Please provide a valid email address.');
      error.statusCode = 400;
      throw error;
    }
    query = { email: trimmedEmail };
  }

  if (phoneNumber) {
    const trimmedPhone = String(phoneNumber).replace(/\D/g, '').trim();
    if (!validatePhoneNumber(trimmedPhone)) {
      const error = new Error('Please provide a valid 10-digit phone number.');
      error.statusCode = 400;
      throw error;
    }
    query = { phoneNumber: trimmedPhone };
  }

  const authUser = await AuthUser.findOne(query).select('+password');

  if (!authUser) {
    const error = new Error('Invalid email/phone number or password.');
    error.statusCode = 401;
    throw error;
  }

  if (!authUser.password) {
    const error = new Error(
      'This account was created with Google Sign-In. Please login with Google.'
    );
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcryptjs.compare(password, authUser.password);

  if (!isPasswordValid) {
    const error = new Error('Invalid email/phone number or password.');
    error.statusCode = 401;
    throw error;
  }

  authUser.lastLoginAt = new Date();
  await authUser.save();

  const token = issueAccessToken(authUser);
  const hasProfileId = Boolean(authUser.profileId);

  return {
    token,
    user: {
      userId: authUser._id,
      name: authUser.name,
      email: authUser.email,
      phoneNumber: authUser.phoneNumber,
      role: authUser.role,
      profileId: authUser.role === 'halwai' ? hasProfileId : authUser.profileId,
      hasProfileId,
      profileModel: authUser.profileModel,
      picture: authUser.picture,
    },
  };
};

module.exports = {
  loginWithGoogle,
  getAuthUserById,
  linkAuthProfile,
  attachHalwaiProfileToAuthUser,
  signup,
  login,
};
