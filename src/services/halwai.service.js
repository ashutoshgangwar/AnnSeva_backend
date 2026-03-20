const mongoose = require('mongoose');
const Halwai = require('../models/halwai.model');
const Order = require('../models/order.model');
const HalwaiReview = require('../models/halwaiReview.model');

const assertDatabaseConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database is not connected. Please set MONGO_URI and restart server.');
    error.statusCode = 503;
    throw error;
  }
};

const createHalwai = async (payload) => {
  assertDatabaseConnected();
  return Halwai.create(payload);
};

const toRoundedRating = (value) => Number((value || 0).toFixed(1));

const normalizeSearchToken = (value) => String(value || '').trim().toLowerCase();

const calculateDistanceInKm = (latitudeOne, longitudeOne, latitudeTwo, longitudeTwo) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDistance = toRadians(latitudeTwo - latitudeOne);
  const longitudeDistance = toRadians(longitudeTwo - longitudeOne);

  const a =
    Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
    Math.cos(toRadians(latitudeOne)) *
      Math.cos(toRadians(latitudeTwo)) *
      Math.sin(longitudeDistance / 2) *
      Math.sin(longitudeDistance / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const getHalwaiRatingsMap = async (halwaiIds) => {
  if (halwaiIds.length === 0) {
    return new Map();
  }

  const ratings = await HalwaiReview.aggregate([
    {
      $match: {
        halwaiId: {
          $in: halwaiIds,
        },
      },
    },
    {
      $group: {
        _id: '$halwaiId',
        averageRating: {
          $avg: '$rating',
        },
        reviewCount: {
          $sum: 1,
        },
      },
    },
  ]);

  return new Map(
    ratings.map((item) => [String(item._id), {
      averageRating: toRoundedRating(item.averageRating),
      reviewCount: item.reviewCount,
    }])
  );
};

const mapHalwaiListing = (halwai, ratingSummary, distanceInKm = null) => ({
  halwaiId: halwai._id,
  halwaiName: halwai.halwaiName,
  shopName: halwai.shopName,
  location: halwai.location,
  phoneNumber: halwai.phoneNumber,
  foodTypes: halwai.foodTypes,
  specializations: halwai.specializations,
  yearsOfExperience: halwai.yearsOfExperience,
  locationDetails: halwai.locationDetails,
  minGuestsCapacity: halwai.minGuestsCapacity,
  maxGuestsCapacity: halwai.maxGuestsCapacity,
  pricePerPlate: halwai.pricePerPlate,
  averageRating: ratingSummary.averageRating,
  reviewCount: ratingSummary.reviewCount,
  distanceInKm: distanceInKm === null ? null : Number(distanceInKm.toFixed(2)),
});

const getHalwaiById = async (halwaiId) => {
  assertDatabaseConnected();

  const halwai = await Halwai.findById(halwaiId);

  if (!halwai) {
    return null;
  }

  const ratingsMap = await getHalwaiRatingsMap([halwai._id]);
  const ratingSummary = ratingsMap.get(String(halwai._id)) || {
    averageRating: 0,
    reviewCount: 0,
  };

  return mapHalwaiListing(halwai, ratingSummary);
};

const searchHalwaiListings = async (filters) => {
  assertDatabaseConnected();

  const halwais = await Halwai.find({});
  const ratingsMap = await getHalwaiRatingsMap(halwais.map((halwai) => halwai._id));
  const maxDistanceKm = filters.maxDistanceKm || 25;

  return halwais
    .map((halwai) => {
      const ratingSummary = ratingsMap.get(String(halwai._id)) || {
        averageRating: 0,
        reviewCount: 0,
      };

      const halwaiLatitude = halwai.locationDetails?.latitude;
      const halwaiLongitude = halwai.locationDetails?.longitude;

      const distanceInKm =
        typeof halwaiLatitude === 'number' && typeof halwaiLongitude === 'number'
          ? calculateDistanceInKm(
              filters.latitude,
              filters.longitude,
              halwaiLatitude,
              halwaiLongitude
            )
          : Number.POSITIVE_INFINITY;

      return {
        halwai,
        ratingSummary,
        distanceInKm,
      };
    })
    .filter(({ halwai, distanceInKm }) => {
      if (distanceInKm > maxDistanceKm) {
        return false;
      }

      if (
        filters.guests &&
        (halwai.minGuestsCapacity > filters.guests || halwai.maxGuestsCapacity < filters.guests)
      ) {
        return false;
      }

      if (
        filters.foodType &&
        !halwai.foodTypes.some(
          (item) => normalizeSearchToken(item) === normalizeSearchToken(filters.foodType)
        )
      ) {
        return false;
      }

      if (
        filters.specialization &&
        !halwai.specializations.some(
          (item) => normalizeSearchToken(item) === normalizeSearchToken(filters.specialization)
        )
      ) {
        return false;
      }

      return true;
    })
    .sort((first, second) => {
      if (first.distanceInKm !== second.distanceInKm) {
        return first.distanceInKm - second.distanceInKm;
      }

      if (second.ratingSummary.averageRating !== first.ratingSummary.averageRating) {
        return second.ratingSummary.averageRating - first.ratingSummary.averageRating;
      }

      return first.halwai.pricePerPlate - second.halwai.pricePerPlate;
    })
    .slice(0, filters.limit)
    .map(({ halwai, ratingSummary, distanceInKm }) =>
      mapHalwaiListing(halwai, ratingSummary, distanceInKm)
    );
};

const getHalwaiReviews = async (halwaiId) => {
  assertDatabaseConnected();

  const reviews = await HalwaiReview.find({ halwaiId }).sort({ createdAt: -1 });
  const ratingsMap = await getHalwaiRatingsMap([halwaiId]);
  const ratingSummary = ratingsMap.get(String(halwaiId)) || {
    averageRating: 0,
    reviewCount: 0,
  };

  return {
    averageRating: ratingSummary.averageRating,
    reviewCount: ratingSummary.reviewCount,
    reviews,
  };
};

const getHalwaiOverview = async (halwaiId) => {
  assertDatabaseConnected();

  const objectId = new mongoose.Types.ObjectId(halwaiId);

  const [overview] = await Order.aggregate([
    {
      $match: {
        halwaiId: objectId,
      },
    },
    {
      $group: {
        _id: null,
        activeOrders: {
          $sum: {
            $cond: [{ $in: ['$status', ['accept', 'reached']] }, 1, 0],
          },
        },
        totalGuestsServed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$numberOfGuests', 0],
          },
        },
        totalCompletedBookings: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
          },
        },
      },
    },
  ]);

  return {
    activeOrders: overview?.activeOrders || 0,
    totalGuestsServed: overview?.totalGuestsServed || 0,
    totalCompletedBookings: overview?.totalCompletedBookings || 0,
  };
};

module.exports = {
  createHalwai,
  getHalwaiById,
  getHalwaiOverview,
  searchHalwaiListings,
  getHalwaiReviews,
};
