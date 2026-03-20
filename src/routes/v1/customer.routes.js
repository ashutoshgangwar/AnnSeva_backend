const express = require('express');
const { createSeedCustomer, getCustomer } = require('../../controllers/customer.controller');
const { getCustomerOrders, getCustomerOrderPayment, submitCustomerRating } = require('../../controllers/order.controller');

const router = express.Router();

router.post('/customers/dummy', createSeedCustomer);
router.get('/customers/:customerId', getCustomer);
router.get('/customers/:customerId/orders', getCustomerOrders);
router.get('/customers/:customerId/orders/:orderId/payment-details', getCustomerOrderPayment);
router.post('/customers/:customerId/orders/:orderId/rating', submitCustomerRating);

module.exports = router;
