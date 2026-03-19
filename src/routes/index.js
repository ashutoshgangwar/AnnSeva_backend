const express = require('express');
const env = require('../config/env');
const v1Routes = require('./v1');

const router = express.Router();

router.use(`${env.apiPrefix}/v1`, v1Routes);

module.exports = router;
