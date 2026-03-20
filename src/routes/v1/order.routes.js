const express = require('express');
const {
  createIncomingOrder,
  listIncomingOrders,
  listActiveOrders,
  getOrderDetails,
  decideIncomingOrder,
  completeOrder,
  getOrderPayment,
  receiveOrderPayment,
} = require('../../controllers/order.controller');
const {
  validateCreateOrder,
  validateOrderDecision,
  validateCompleteOrderByCustomer,
  validateReceivePayment,
} = require('../../validators/order.validator');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

router.post('/orders', authenticate, authorizeRoles('customer'), validateCreateOrder, createIncomingOrder);
router.post('/orders/customer-request', authenticate, authorizeRoles('customer'), validateCreateOrder, createIncomingOrder);
router.get('/orders/incoming', authenticate, authorizeRoles('halwai'), listIncomingOrders);
router.get('/orders/active', authenticate, authorizeRoles('halwai'), listActiveOrders);
router.get('/orders/:orderId', getOrderDetails);
router.post('/orders/complete', authenticate, authorizeRoles('customer'), validateCompleteOrderByCustomer, completeOrder);
router.get('/orders/:orderId/payment', authenticate, authorizeRoles('halwai'), getOrderPayment);
router.post('/orders/:orderId/payment/receive', authenticate, authorizeRoles('halwai'), validateReceivePayment, receiveOrderPayment);
router.post('/orders/:orderId/status', authenticate, authorizeRoles('halwai'), validateOrderDecision, decideIncomingOrder);
router.patch('/orders/:orderId/decision', authenticate, authorizeRoles('halwai'), validateOrderDecision, decideIncomingOrder);

module.exports = router;
