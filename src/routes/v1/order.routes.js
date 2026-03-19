const express = require('express');
const {
  createIncomingOrder,
  listIncomingOrders,
  listActiveOrders,
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

const router = express.Router();

router.post('/orders', validateCreateOrder, createIncomingOrder);
router.get('/orders/incoming', listIncomingOrders);
router.get('/orders/active', listActiveOrders);
router.post('/orders/complete', validateCompleteOrderByCustomer, completeOrder);
router.get('/orders/:orderId/payment', getOrderPayment);
router.post('/orders/:orderId/payment/receive', validateReceivePayment, receiveOrderPayment);
router.post('/orders/:orderId/status', validateOrderDecision, decideIncomingOrder);
router.patch('/orders/:orderId/decision', validateOrderDecision, decideIncomingOrder);

module.exports = router;
