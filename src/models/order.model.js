const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      required: true,
    },
    customerAddress: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    menu: {
      type: [menuItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Menu must contain at least one item.',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'accept', 'reject', 'reached', 'completed'],
      default: 'pending',
    },
    halwaiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Halwai',
      default: null,
    },
    halwaiDecisionAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
