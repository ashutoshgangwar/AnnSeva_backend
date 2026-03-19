const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');

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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const calculateDaysLeft = (eventDate) => {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  const millisecondsInDay = 1000 * 60 * 60 * 24;
  return Math.ceil((eventDateTime.getTime() - now.getTime()) / millisecondsInDay);
};

const ensurePaymentForOrder = async (order) => {
  const existingPayment = await Payment.findOne({ orderId: order._id });

  if (existingPayment) {
    return existingPayment;
  }

  return Payment.create({
    orderId: order._id,
    customerName: order.customerName,
    totalBill: order.totalBill,
  });
};

const getOrCreatePaymentForCompletedOrder = async (order) => {
  const existingPayment = await Payment.findOne({ orderId: order._id });

  if (existingPayment) {
    return existingPayment;
  }

  if (order.status !== 'completed') {
    return null;
  }

  return ensurePaymentForOrder(order);
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

const completeOrderByCustomer = async (payload) => {
  assertDatabaseConnected();

  const order = await Order.findOne({
    _id: payload.orderId,
    customerName: { $regex: `^${escapeRegex(payload.customerName)}$`, $options: 'i' },
  });

  if (!order) {
    return null;
  }

  if (order.status === 'completed') {
    const error = new Error('Order is already completed.');
    error.statusCode = 409;
    throw error;
  }

  if (order.status === 'reject') {
    const error = new Error('Rejected order cannot be marked as completed.');
    error.statusCode = 409;
    throw error;
  }

  order.status = 'completed';
  const updatedOrder = await order.save();
  const payment = await ensurePaymentForOrder(updatedOrder);

  return {
    order: updatedOrder,
    paymentId: payment._id,
  };
};

const getOrderPaymentDetails = async (orderId) => {
  assertDatabaseConnected();

  const order = await Order.findById(orderId);

  if (!order) {
    return null;
  }

  const payment = await getOrCreatePaymentForCompletedOrder(order);

  if (!payment) {
    const error = new Error('Payment id is not generated yet. Complete the order first.');
    error.statusCode = 409;
    throw error;
  }

  return {
    orderId: order._id,
    paymentId: payment._id,
    totalBill: order.totalBill,
    userName: order.customerName,
    address: order.customerAddress,
    phoneNumber: order.phoneNumber,
    guests: order.numberOfGuests,
    paymentStatus: payment.status,
    menu: order.menu,
  };
};

const markPaymentReceived = async (orderId, paymentId) => {
  assertDatabaseConnected();

  const order = await Order.findById(orderId);

  if (!order) {
    return null;
  }

  const payment = await Payment.findOne({
    _id: paymentId,
    orderId: order._id,
  });

  if (!payment) {
    const error = new Error('Payment not found for provided order id and payment id.');
    error.statusCode = 404;
    throw error;
  }

  if (payment.status === 'received') {
    const error = new Error('Payment is already marked as received.');
    error.statusCode = 409;
    throw error;
  }

  payment.status = 'received';
  payment.receivedAt = new Date();

  order.paymentStatus = 'received';
  order.paymentReceivedAt = payment.receivedAt;

  await order.save();
  const updatedPayment = await payment.save();

  return {
    orderId: order._id,
    paymentId: updatedPayment._id,
    paymentStatus: updatedPayment.status,
    paymentReceivedAt: updatedPayment.receivedAt,
  };
};

module.exports = {
  createOrder,
  getIncomingOrders,
  getActiveOrders,
  respondToOrder,
  completeOrderByCustomer,
  getOrderPaymentDetails,
  markPaymentReceived,
};
