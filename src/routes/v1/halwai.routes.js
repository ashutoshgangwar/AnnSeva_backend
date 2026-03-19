const express = require('express');
const {
	onboardHalwai,
	getHalwai,
	getHalwaiOrderOverview,
} = require('../../controllers/halwai.controller');
const { validateHalwaiOnboarding } = require('../../validators/halwai.validator');

const router = express.Router();

router.post('/halwai/onboard', validateHalwaiOnboarding, onboardHalwai);
router.get('/halwai/:halwaiId', getHalwai);
router.get('/halwai/:halwaiId/overview', getHalwaiOrderOverview);

module.exports = router;
