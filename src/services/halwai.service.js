const mongoose = require('mongoose');
const Halwai = require('../models/halwai.model');

const assertDatabaseConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database is not connected. Please set MONGO_URI and restart server.');
    error.statusCode = 503;
    throw error;
  }
};

const createHalwai = async (payload) => {
  assertDatabaseConnected();
  return Halwai.create(payload);
};

const getHalwaiById = async (halwaiId) => {
  assertDatabaseConnected();
  return Halwai.findById(halwaiId);
};

module.exports = {
  createHalwai,
  getHalwaiById,
};
