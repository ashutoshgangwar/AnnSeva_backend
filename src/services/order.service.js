const mongoose = require('mongoose');
const Order = require('../models/order.model');

const assertDatabaseConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database is not connected. Please set MONGO_URI and restart server.');
    error.statusCode = 503;
    throw error;
  }
};

const createOrder = async (payload) => {
  assertDatabaseConnected();
  return Order.create(payload);
};

const getIncomingOrders = async () => {
  assertDatabaseConnected();
  return Order.find({ status: 'pending' }).sort({ priority: 1, eventDate: 1, createdAt: -1 });
};

const respondToOrder = async (orderId, payload) => {
  assertDatabaseConnected();

  const order = await Order.findById(orderId);

  if (!order) {
    return null;
  }

  if (order.status !== 'pending') {
    const error = new Error('Order is already processed by halwai.');
    error.statusCode = 409;
    throw error;
  }

  order.status = payload.decision;
  order.halwaiDecisionAt = new Date();

  if (payload.halwaiId) {
    order.halwaiId = payload.halwaiId;
  }

  return order.save();
};

module.exports = {
  createOrder,
  getIncomingOrders,
  respondToOrder,
};
