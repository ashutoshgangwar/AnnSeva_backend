const mongoose = require('mongoose');

const authUserSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    picture: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'halwai'],
      required: true,
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    profileModel: {
      type: String,
      enum: ['Customer', 'Halwai', null],
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AuthUser = mongoose.model('AuthUser', authUserSchema);

module.exports = AuthUser;
