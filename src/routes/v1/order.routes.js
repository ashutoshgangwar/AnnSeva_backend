const express = require('express');
const {
  createIncomingOrder,
  listIncomingOrders,
  listActiveOrders,
  decideIncomingOrder,
} = require('../../controllers/order.controller');
const { validateCreateOrder, validateOrderDecision } = require('../../validators/order.validator');

const router = express.Router();

router.post('/orders', validateCreateOrder, createIncomingOrder);
router.get('/orders/incoming', listIncomingOrders);
router.get('/orders/active', listActiveOrders);
router.post('/orders/:orderId/status', validateOrderDecision, decideIncomingOrder);
router.patch('/orders/:orderId/decision', validateOrderDecision, decideIncomingOrder);

module.exports = router;
