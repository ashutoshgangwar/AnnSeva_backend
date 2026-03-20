const mongoose = require('mongoose');

const halwaiReviewSchema = new mongoose.Schema(
  {
    halwaiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Halwai',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    menuServed: {
      type: [String],
      default: [],
    },
    reviewText: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const HalwaiReview = mongoose.model('HalwaiReview', halwaiReviewSchema);

module.exports = HalwaiReview;