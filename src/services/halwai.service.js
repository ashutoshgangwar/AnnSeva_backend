const mongoose = require('mongoose');
const Halwai = require('../models/halwai.model');
const Order = require('../models/order.model');

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

const getHalwaiOverview = async (halwaiId) => {
  assertDatabaseConnected();

  const objectId = new mongoose.Types.ObjectId(halwaiId);

  const [overview] = await Order.aggregate([
    {
      $match: {
        halwaiId: objectId,
      },
    },
    {
      $group: {
        _id: null,
        activeOrders: {
          $sum: {
            $cond: [{ $in: ['$status', ['accept', 'reached']] }, 1, 0],
          },
        },
        totalGuestsServed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$numberOfGuests', 0],
          },
        },
        totalCompletedBookings: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
          },
        },
      },
    },
  ]);

  return {
    activeOrders: overview?.activeOrders || 0,
    totalGuestsServed: overview?.totalGuestsServed || 0,
    totalCompletedBookings: overview?.totalCompletedBookings || 0,
  };
};

module.exports = {
  createHalwai,
  getHalwaiById,
  getHalwaiOverview,
};
