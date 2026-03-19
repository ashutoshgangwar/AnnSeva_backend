const express = require('express');
const { onboardHalwai, getHalwai } = require('../../controllers/halwai.controller');
const { validateHalwaiOnboarding } = require('../../validators/halwai.validator');

const router = express.Router();

router.post('/halwai/onboard', validateHalwaiOnboarding, onboardHalwai);
router.get('/halwai/:halwaiId', getHalwai);

module.exports = router;
