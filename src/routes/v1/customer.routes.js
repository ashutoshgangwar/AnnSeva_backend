const express = require('express');
const { createSeedCustomer, getCustomer } = require('../../controllers/customer.controller');

const router = express.Router();

router.post('/customers/dummy', createSeedCustomer);
router.get('/customers/:customerId', getCustomer);

module.exports = router;
