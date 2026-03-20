const express = require('express');
const {
	onboardHalwai,
	getHalwai,
	listNearbyHalwais,
	getHalwaiOrderOverview,
	listHalwaiReviews,
} = require('../../controllers/halwai.controller');
const { validateHalwaiOnboarding } = require('../../validators/halwai.validator');
const { authenticate, authorizeRoles, requireOwnedProfileParam } = require('../../middlewares/auth');

const router = express.Router();

router.post('/halwai/onboard', authenticate, authorizeRoles('halwai'), validateHalwaiOnboarding, onboardHalwai);
router.get('/halwai/search', listNearbyHalwais);
router.get('/halwai/:halwaiId', getHalwai);
router.get(
	'/halwai/:halwaiId/overview',
	authenticate,
	authorizeRoles('halwai'),
	requireOwnedProfileParam('halwaiId'),
	getHalwaiOrderOverview
);
router.get('/halwai/:halwaiId/reviews', listHalwaiReviews);

module.exports = router;
