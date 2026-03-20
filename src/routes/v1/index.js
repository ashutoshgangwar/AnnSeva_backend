const express = require('express');
const healthRoutes = require('./health.routes');
const halwaiRoutes = require('./halwai.routes');
const orderRoutes = require('./order.routes');
const customerRoutes = require('./customer.routes');

const router = express.Router();

router.use('/', healthRoutes);
router.use('/', halwaiRoutes);
router.use('/', customerRoutes);
router.use('/', orderRoutes);

module.exports = router;
