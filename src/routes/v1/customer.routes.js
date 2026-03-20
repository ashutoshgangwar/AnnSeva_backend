const express = require('express');
const { createSeedCustomer, getCustomer } = require('../../controllers/customer.controller');
const { getCustomerOrders, getCustomerOrderPayment, submitCustomerRating } = require('../../controllers/order.controller');
const { authenticate, authorizeRoles, requireOwnedProfileParam } = require('../../middlewares/auth');

const router = express.Router();

router.post('/customers/dummy', createSeedCustomer);
router.get(
	'/customers/:customerId',
	authenticate,
	authorizeRoles('customer'),
	requireOwnedProfileParam('customerId'),
	getCustomer
);
router.get(
	'/customers/:customerId/orders',
	authenticate,
	authorizeRoles('customer'),
	requireOwnedProfileParam('customerId'),
	getCustomerOrders
);
router.get(
	'/customers/:customerId/orders/:orderId/payment-details',
	authenticate,
	authorizeRoles('customer'),
	requireOwnedProfileParam('customerId'),
	getCustomerOrderPayment
);
router.post(
	'/customers/:customerId/orders/:orderId/rating',
	authenticate,
	authorizeRoles('customer'),
	requireOwnedProfileParam('customerId'),
	submitCustomerRating
);

module.exports = router;
