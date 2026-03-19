const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { createOrder, getIncomingOrders, respondToOrder } = require('../services/order.service');

const createIncomingOrder = asyncHandler(async (req, res) => {
  const order = await createOrder(req.body);

  res.status(201).json({
    success: true,
    message: 'Order created successfully.',
    data: order,
  });
});

const listIncomingOrders = asyncHandler(async (req, res) => {
  const orders = await getIncomingOrders();

  res.status(200).json({
    success: true,
    message: 'Incoming orders fetched successfully.',
    data: orders,
  });
});

const decideIncomingOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error('Order id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const order = await respondToOrder(orderId, req.body);

  if (!order) {
    const error = new Error('Order not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: `Order ${order.status} by halwai successfully.`,
    data: order,
  });
});

module.exports = {
  createIncomingOrder,
  listIncomingOrders,
  decideIncomingOrder,
};
