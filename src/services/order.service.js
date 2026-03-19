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

const calculateDaysLeft = (eventDate) => {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  const millisecondsInDay = 1000 * 60 * 60 * 24;
  return Math.ceil((eventDateTime.getTime() - now.getTime()) / millisecondsInDay);
};

const getIncomingOrders = async () => {
  assertDatabaseConnected();
  return Order.find({ status: 'pending' }).sort({ priority: 1, eventDate: 1, createdAt: -1 });
};

const getActiveOrders = async () => {
  assertDatabaseConnected();

  const orders = await Order.find({ status: { $ne: 'completed' } }).sort({ eventDate: 1 });

  return orders.map((order) => ({
    orderId: order._id,
    customerName: order.customerName,
    phoneNumber: order.phoneNumber,
    address: order.customerAddress,
    eventDate: order.eventDate,
    numberOfGuests: order.numberOfGuests,
    daysLeft: calculateDaysLeft(order.eventDate),
    selectedMenu: order.menu,
    tag: 'active',
  }));
};

const respondToOrder = async (orderId, payload) => {
  assertDatabaseConnected();

  const order = await Order.findById(orderId);

  if (!order) {
    return null;
  }

  const nextStatus = payload.decision;

  const isValidTransition =
    (order.status === 'pending' && ['accept', 'reject'].includes(nextStatus)) ||
    (order.status === 'accept' && ['reached', 'completed'].includes(nextStatus)) ||
    (order.status === 'reached' && nextStatus === 'completed');

  if (!isValidTransition) {
    const error = new Error(
      `Invalid status transition from ${order.status} to ${nextStatus}. Allowed flow: pending -> accept/reject -> reached -> completed.`
    );
    error.statusCode = 409;
    throw error;
  }

  order.status = nextStatus;
  order.halwaiDecisionAt = new Date();

  if (payload.halwaiId) {
    order.halwaiId = payload.halwaiId;
  }

  return order.save();
};

module.exports = {
  createOrder,
  getIncomingOrders,
  getActiveOrders,
  respondToOrder,
};
