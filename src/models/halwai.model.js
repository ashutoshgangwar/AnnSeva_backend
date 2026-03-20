const mongoose = require('mongoose');

const halwaiLocationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      default: null,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      default: null,
    },
    physicalAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: false,
  }
);

const halwaiSchema = new mongoose.Schema(
  {
    halwaiName: {
      type: String,
      required: true,
      trim: true,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    gstNumber: {
      type: String,
      trim: true,
      default: null,
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: null,
    },
    foodTypes: {
      type: [String],
      default: [],
    },
    specializations: {
      type: [String],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    locationDetails: {
      type: halwaiLocationSchema,
      default: () => ({}),
    },
    minGuestsCapacity: {
      type: Number,
      min: 1,
      default: 1,
    },
    maxGuestsCapacity: {
      type: Number,
      min: 1,
      default: 1,
    },
    pricePerPlate: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Halwai = mongoose.model('Halwai', halwaiSchema);

module.exports = Halwai;
