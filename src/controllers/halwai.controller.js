const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const { createHalwai, getHalwaiById, getHalwaiOverview } = require('../services/halwai.service');

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

const getHalwaiOrderOverview = asyncHandler(async (req, res) => {
  const { halwaiId } = req.params;

  if (!mongoose.isValidObjectId(halwaiId)) {
    const error = new Error('Halwai id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const halwai = await getHalwaiById(halwaiId);

  if (!halwai) {
    const error = new Error('Halwai not found.');
    error.statusCode = 404;
    throw error;
  }

  const overview = await getHalwaiOverview(halwaiId);

  res.status(200).json({
    success: true,
    message: 'Halwai order overview fetched successfully.',
    data: {
      halwaiId: halwai._id,
      halwaiName: halwai.halwaiName,
      activeOrders: overview.activeOrders,
      totalGuestsServed: overview.totalGuestsServed,
      totalCompletedBookings: overview.totalCompletedBookings,
    },
  });
});

module.exports = {
  onboardHalwai,
  getHalwai,
  getHalwaiOrderOverview,
};
