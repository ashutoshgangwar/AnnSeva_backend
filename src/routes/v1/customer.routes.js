const express = require('express');
const { createSeedCustomer, getCustomer } = require('../../controllers/customer.controller');
const { getCustomerOrders } = require('../../controllers/order.controller');

const router = express.Router();

router.post('/customers/dummy', createSeedCustomer);
router.get('/customers/:customerId', getCustomer);
router.get('/customers/:customerId/orders', getCustomerOrders);

module.exports = router;
