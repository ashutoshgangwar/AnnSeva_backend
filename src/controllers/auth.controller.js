const asyncHandler = require('../utils/asyncHandler');
const {
  loginWithGoogle,
  getAuthUserById,
  linkAuthProfile,
} = require('../services/auth.service');

const loginGoogle = asyncHandler(async (req, res) => {
  const { idToken, role } = req.body;
  const result = await loginWithGoogle({ idToken, role });

  res.status(200).json({
    success: true,
    message: 'Google login successful.',
    data: result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const authUser = await getAuthUserById(req.user.userId);

  if (!authUser) {
    const error = new Error('Authenticated user not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Authenticated user fetched successfully.',
    data: {
      userId: authUser._id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      profileId: authUser.profileId,
      profileModel: authUser.profileModel,
      picture: authUser.picture,
    },
  });
});

const linkMyProfile = asyncHandler(async (req, res) => {
  const result = await linkAuthProfile({
    userId: req.user.userId,
    role: req.user.role,
    profileId: req.body.profileId,
  });

  res.status(200).json({
    success: true,
    message: 'Profile linked successfully.',
    data: result,
  });
});

module.exports = {
  loginGoogle,
  getMe,
  linkMyProfile,
};
