const express = require('express');
const { loginGoogle, getMe, linkMyProfile } = require('../../controllers/auth.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

router.post('/auth/google', loginGoogle);
router.get('/auth/me', authenticate, getMe);
router.patch('/auth/me/profile-link', authenticate, linkMyProfile);

module.exports = router;
