const mongoose = require('mongoose');
const env = require('./env');

const connectDatabase = async () => {
  if (!env.mongoUri) {
    console.warn('MONGO_URI is not set. Skipping database connection.');
    return;
  }

  await mongoose.connect(env.mongoUri);
  console.info('MongoDB connected successfully.');
};

module.exports = connectDatabase;
