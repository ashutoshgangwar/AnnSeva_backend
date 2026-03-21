const express = require('express');
const { loginGoogle, getMe, linkMyProfile, signupUser, loginUser } = require('../../controllers/auth.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

router.post('/auth/signup', signupUser);
router.post('/auth/login', loginUser);
router.post('/auth/google', loginGoogle);
router.get('/auth/me', authenticate, getMe);
router.patch('/auth/me/profile-link', authenticate, linkMyProfile);

module.exports = router;
