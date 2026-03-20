const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const {
  createHalwai,
  getHalwaiById,
  getHalwaiOverview,
  searchHalwaiListings,
  getHalwaiReviews,
} = require('../services/halwai.service');
const { attachHalwaiProfileToAuthUser } = require('../services/auth.service');

const onboardHalwai = asyncHandler(async (req, res) => {
  if (req.user?.profileId) {
    const error = new Error('Your account is already linked to a halwai profile.');
    error.statusCode = 409;
    throw error;
  }

  const halwai = await createHalwai(req.body);

  if (req.user?.userId) {
    await attachHalwaiProfileToAuthUser(req.user.userId, halwai._id);
  }

  res.status(201).json({
    success: true,
    message: 'Halwai onboarded successfully.',
    data: halwai,
  });
});

const getHalwai = asyncHandler(async (req, res) => {
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

  res.status(200).json({
    success: true,
    message: 'Halwai fetched successfully.',
    data: halwai,
  });
});

const listNearbyHalwais = asyncHandler(async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const guests = req.query.guests ? Number(req.query.guests) : undefined;
  const maxDistanceKm = req.query.maxDistanceKm ? Number(req.query.maxDistanceKm) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    const error = new Error('Latitude query parameter is required and must be between -90 and 90.');
    error.statusCode = 400;
    throw error;
  }

  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    const error = new Error('Longitude query parameter is required and must be between -180 and 180.');
    error.statusCode = 400;
    throw error;
  }

  if (guests !== undefined && (!Number.isInteger(guests) || guests < 1)) {
    const error = new Error('Guests query parameter must be a positive integer.');
    error.statusCode = 400;
    throw error;
  }

  if (maxDistanceKm !== undefined && (Number.isNaN(maxDistanceKm) || maxDistanceKm <= 0)) {
    const error = new Error('maxDistanceKm must be a positive number.');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    const error = new Error('limit must be an integer between 1 and 100.');
    error.statusCode = 400;
    throw error;
  }

  const listings = await searchHalwaiListings({
    latitude,
    longitude,
    guests,
    foodType: req.query.foodType,
    specialization: req.query.specialization,
    maxDistanceKm,
    limit,
  });

  res.status(200).json({
    success: true,
    message: 'Nearby halwai listings fetched successfully.',
    data: listings,
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

const listHalwaiReviews = asyncHandler(async (req, res) => {
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

  const reviewsData = await getHalwaiReviews(halwaiId);

  res.status(200).json({
    success: true,
    message: 'Halwai reviews fetched successfully.',
    data: {
      halwaiId,
      halwaiName: halwai.halwaiName,
      averageRating: reviewsData.averageRating,
      reviewCount: reviewsData.reviewCount,
      reviews: reviewsData.reviews,
    },
  });
});

module.exports = {
  onboardHalwai,
  getHalwai,
  listNearbyHalwais,
  getHalwaiOrderOverview,
  listHalwaiReviews,
};
