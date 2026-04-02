const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const {
  createOrder,
  getOrderById,
  getCustomerOrdersSummary,
  getCustomerOrderPaymentDetails,
  submitHalwaiRating,
  getIncomingOrders,
  getActiveOrders,
  respondToOrder,
  completeOrderByCustomer,
  getOrderPaymentDetails,
  markPaymentReceived,
} = require('../services/order.service');

const createIncomingOrder = asyncHandler(async (req, res) => {
  if (req.user?.role === 'customer') {
    req.body.userId = req.user.userId;
    if (!req.body.customerName) {
      req.body.customerName = req.user.name;
    }
  }

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

const listActiveOrders = asyncHandler(async (req, res) => {
  const orders = await getActiveOrders();

  res.status(200).json({
    success: true,
    message: 'Active orders fetched successfully.',
    data: orders,
  });
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error('Order id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const order = await getOrderById(orderId);

  if (!order) {
    const error = new Error('Order not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Order details fetched successfully.',
    data: order,
  });
});

const getCustomerOrders = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.isValidObjectId(customerId)) {
    const error = new Error('Customer id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const summary = await getCustomerOrdersSummary(customerId);

  if (!summary) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Customer orders fetched successfully.',
    data: summary,
  });
});

const getCustomerOrderPayment = asyncHandler(async (req, res) => {
  const { customerId, orderId } = req.params;

  if (!mongoose.isValidObjectId(customerId)) {
    const error = new Error('Customer id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error('Order id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const result = await getCustomerOrderPaymentDetails(customerId, orderId);

  if (!result) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!result.paymentDetails) {
    const error = new Error('Order not found for this customer.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Customer order payment details fetched successfully.',
    data: result.paymentDetails,
  });
});

const submitCustomerRating = asyncHandler(async (req, res) => {
  const { customerId, orderId } = req.params;

  if (!mongoose.isValidObjectId(customerId)) {
    const error = new Error('Customer id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error('Order id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const review = await submitHalwaiRating(customerId, orderId, req.body);

  res.status(201).json({
    success: true,
    message: 'Rating submitted successfully.',
    data: review,
  });
});

const decideIncomingOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error('Order id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const halwaiId = req.user?.profileId || req.user?.userId;

  if (!halwaiId) {
    const error = new Error('Halwai profile not linked to this account. Please complete your profile setup.');
    error.statusCode = 403;
    throw error;
  }

  const order = await respondToOrder(orderId, { ...req.body, halwaiId });

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

const completeOrder = asyncHandler(async (req, res) => {
  const result = await completeOrderByCustomer(req.body);

  if (!result) {
    const error = new Error('Order not found for provided order id and customer name.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Order marked as completed successfully.',
    data: {
      order: result.order,
      paymentId: result.paymentId,
    },
  });
});

const getOrderPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error('Order id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const paymentDetails = await getOrderPaymentDetails(orderId);

  if (!paymentDetails) {
    const error = new Error('Order not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Order payment details fetched successfully.',
    data: paymentDetails,
  });
});

const receiveOrderPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error('Order id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const payment = await markPaymentReceived(orderId, req.body.paymentId);

  if (!payment) {
    const error = new Error('Order not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Payment marked as received successfully.',
    data: payment,
  });
});

module.exports = {
  createIncomingOrder,
  listIncomingOrders,
  listActiveOrders,
  getOrderDetails,
  getCustomerOrders,
  getCustomerOrderPayment,
  submitCustomerRating,
  decideIncomingOrder,
  completeOrder,
  getOrderPayment,
  receiveOrderPayment,
};
