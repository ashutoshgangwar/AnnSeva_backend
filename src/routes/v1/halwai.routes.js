const express = require('express');
const {
	onboardHalwai,
	getHalwai,
	listNearbyHalwais,
	getHalwaiOrderOverview,
	listHalwaiReviews,
} = require('../../controllers/halwai.controller');
const { validateHalwaiOnboarding } = require('../../validators/halwai.validator');

const router = express.Router();

router.post('/halwai/onboard', validateHalwaiOnboarding, onboardHalwai);
router.get('/halwai/search', listNearbyHalwais);
router.get('/halwai/:halwaiId', getHalwai);
router.get('/halwai/:halwaiId/overview', getHalwaiOrderOverview);
router.get('/halwai/:halwaiId/reviews', listHalwaiReviews);

module.exports = router;
