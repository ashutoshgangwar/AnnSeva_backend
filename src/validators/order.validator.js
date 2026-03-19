const mongoose = require('mongoose');

const PRIORITIES = ['high', 'medium', 'low'];
const ORDER_STATUS_UPDATES = ['accept', 'reject', 'reached', 'completed'];
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const sanitizeString = (value) => String(value || '').trim();

const sanitizeMenu = (menu) => {
  if (!Array.isArray(menu)) {
    return [];
  }

  return menu
    .map((item) => {
      if (typeof item === 'string') {
        return { itemName: item.trim() };
      }

      if (item && typeof item === 'object') {
        return { itemName: sanitizeString(item.itemName) };
      }

      return { itemName: '' };
    })
    .filter((item) => item.itemName.length > 0);
};

const validateCreateOrder = (req, res, next) => {
  const customerName = sanitizeString(req.body.customerName);
  const phoneNumber = sanitizeString(req.body.phoneNumber);
  const priority = sanitizeString(req.body.priority || 'medium').toLowerCase();
  const customerAddress = sanitizeString(req.body.customerAddress);
  const numberOfGuests = Number(req.body.numberOfGuests);
  const eventDate = new Date(req.body.eventDate);
  const menu = sanitizeMenu(req.body.menu);

  if (!customerName) {
    return next(createValidationError('Customer name is required.'));
  }

  if (!phoneNumber) {
    return next(createValidationError('Phone number is required.'));
  }

  if (!PHONE_REGEX.test(phoneNumber)) {
    return next(createValidationError('Phone number must be valid and include 10 to 15 digits.'));
  }

  if (!PRIORITIES.includes(priority)) {
    return next(createValidationError('Priority must be one of high, medium, or low.'));
  }

  if (!customerAddress) {
    return next(createValidationError('Customer address is required.'));
  }

  if (Number.isNaN(eventDate.getTime())) {
    return next(createValidationError('Event date must be a valid date.'));
  }

  if (!Number.isInteger(numberOfGuests) || numberOfGuests < 1) {
    return next(createValidationError('Number of guests must be a positive integer.'));
  }

  if (menu.length === 0) {
    return next(createValidationError('Menu must contain at least one item name.'));
  }

  req.body = {
    customerName,
    phoneNumber,
    priority,
    customerAddress,
    eventDate,
    numberOfGuests,
    menu,
  };

  return next();
};

const validateOrderDecision = (req, res, next) => {
  const decisionInput = sanitizeString(req.body.decision || req.body.status).toLowerCase();
  const normalizedDecision =
    decisionInput === 'accepted'
      ? 'accept'
      : decisionInput === 'rejected'
      ? 'reject'
      : decisionInput;

  if (!ORDER_STATUS_UPDATES.includes(normalizedDecision)) {
    return next(
      createValidationError('Status must be one of: accept, reject, reached, completed.')
    );
  }

  const halwaiId = sanitizeString(req.body.halwaiId);

  if (!halwaiId) {
    return next(createValidationError('Halwai id is required.'));
  }

  if (!mongoose.isValidObjectId(halwaiId)) {
    return next(createValidationError('Halwai id must be a valid MongoDB ObjectId.'));
  }

  req.body = {
    decision: normalizedDecision,
    halwaiId,
  };

  return next();
};

module.exports = {
  validateCreateOrder,
  validateOrderDecision,
};
