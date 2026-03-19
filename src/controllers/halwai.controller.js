const asyncHandler = require('../utils/asyncHandler');
const { createHalwai, getHalwaiById } = require('../services/halwai.service');

const onboardHalwai = asyncHandler(async (req, res) => {
  const halwai = await createHalwai(req.body);

  res.status(201).json({
    success: true,
    message: 'Halwai onboarded successfully.',
    data: halwai,
  });
});

const getHalwai = asyncHandler(async (req, res) => {
  const { halwaiId } = req.params;
  const halwai = await getHalwaiById(halwaiId);

  if (!halwai) {
    const error = new Error('Halwai not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Halwai fetched successfully.',
    data: halwai,
  });
});

module.exports = {
  onboardHalwai,
  getHalwai,
};
