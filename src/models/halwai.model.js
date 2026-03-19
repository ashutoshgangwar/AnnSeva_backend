const mongoose = require('mongoose');

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
  },
  {
    timestamps: true,
  }
);

const Halwai = mongoose.model('Halwai', halwaiSchema);

module.exports = Halwai;
