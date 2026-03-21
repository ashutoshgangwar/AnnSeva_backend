const mongoose = require('mongoose');

const PRIORITIES = ['high', 'medium', 'low'];
const ORDER_STATUS_UPDATES = ['accept', 'reject', 'reached', 'completed'];
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;
const EVENT_TYPES = ['bhandara', 'langar', 'poojan', 'others'];
const SERVING_STYLES = ['plate-service', 'counter'];
const MENU_OPTIONS = {
  'dal makhani': 'Dal Makhani',
  dalmakkani: 'Dal Makhani',
  chole: 'Chole',
  'jeera rice': 'Jeera Rice',
  pulao: 'Pulao',
  roti: 'Roti',
  boondi: 'Boondi Raita',
  'boondi raita': 'Boondi Raita',
  bondhiratita: 'Boondi Raita',
  'gulab jamun': 'Gulab Jamun',
  'gualb jamun': 'Gulab Jamun',
  kheer: 'Kheer',
  halwa: 'Halwa',
  puri: 'Puri',
};

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const sanitizeString = (value) => String(value || '').trim();

const normalizeLookupValue = (value) =>
  sanitizeString(value)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const sanitizeMenu = (menu) => {
  if (!Array.isArray(menu)) {
    return [];
  }

  return menu
    .map((item) => {
      const rawValue =
        typeof item === 'string' ? item : item && typeof item === 'object' ? item.itemName : '';
      const normalizedValue = normalizeLookupValue(rawValue);

      if (typeof item === 'string') {
        return { itemName: MENU_OPTIONS[normalizedValue] || '' };
      }

      if (item && typeof item === 'object') {
        return { itemName: MENU_OPTIONS[normalizedValue] || '' };
      }

      return { itemName: '' };
    })
    .filter((item) => item.itemName.length > 0);
};

const sanitizeEventType = (value) => {
  const normalizedValue = normalizeLookupValue(value);

  if (normalizedValue === 'lnagar') {
    return 'langar';
  }

  if (['poojam', 'pooja', 'poojan'].includes(normalizedValue)) {
    return 'poojan';
  }

  return normalizedValue;
};

const sanitizeServingStyle = (value) => {
  const normalizedValue = normalizeLookupValue(value);

  if (['plate service', 'plate-service', 'plat swervice', 'plat service'].includes(normalizedValue)) {
    return 'plate-service';
  }

  return normalizedValue;
};

const sanitizeCurrentLocation = (value) => {
  const latitude = Number(value?.latitude ?? value?.lat);
  const longitude = Number(value?.longitude ?? value?.lng ?? value?.long);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
};

const validateCreateOrder = (req, res, next) => {
  const customerName = sanitizeString(
    req.body.customerName || (req.user?.role === 'customer' ? req.user.name : '')
  );
  const userId = sanitizeString(
    req.body.userId || (req.user?.role === 'customer' ? req.user.userId : '')
  );
  const phoneNumber = sanitizeString(req.body.phoneNumber);
  const priority = sanitizeString(req.body.priority || 'medium').toLowerCase();
  const customerAddress = sanitizeString(req.body.customerAddress);
  const currentLocation = sanitizeCurrentLocation(req.body.currentLocation || req.body.location);
  const numberOfGuests = Number(req.body.numberOfGuests);
  const totalBill =
    req.body.totalBill === undefined || req.body.totalBill === null || req.body.totalBill === ''
      ? 0
      : Number(req.body.totalBill);
  const eventDate = new Date(req.body.eventDate);
  const menu = sanitizeMenu(req.body.menu);
  const eventType = sanitizeEventType(req.body.eventType);
  const servingStyle = sanitizeServingStyle(req.body.servingStyle);
  const additionalNote = sanitizeString(req.body.additionalNote);

  if (!customerName) {
    return next(createValidationError('Customer name is required.'));
  }

  if (!userId) {
    return next(createValidationError('User id is required.'));
  }

  if (!mongoose.isValidObjectId(userId)) {
    return next(createValidationError('User id must be a valid MongoDB ObjectId.'));
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

  if (!currentLocation) {
    return next(
      createValidationError('Current location with latitude and longitude is required.')
    );
  }

  if (currentLocation.latitude < -90 || currentLocation.latitude > 90) {
    return next(createValidationError('Latitude must be between -90 and 90.'));
  }

  if (currentLocation.longitude < -180 || currentLocation.longitude > 180) {
    return next(createValidationError('Longitude must be between -180 and 180.'));
  }

  if (Number.isNaN(eventDate.getTime())) {
    return next(createValidationError('Event date must be a valid date.'));
  }

  if (!Number.isInteger(numberOfGuests) || numberOfGuests < 1) {
    return next(createValidationError('Number of guests must be a positive integer.'));
  }

  if (Number.isNaN(totalBill) || totalBill < 0) {
    return next(createValidationError('Total bill must be a non-negative number.'));
  }

  if (menu.length === 0) {
    return next(
      createValidationError(
        'Menu must contain at least one valid item: Dal Makhani, Chole, Jeera Rice, Pulao, Roti, Boondi Raita, Gulab Jamun, Kheer, Halwa, or Puri.'
      )
    );
  }

  if (!EVENT_TYPES.includes(eventType)) {
    return next(createValidationError('Event type must be one of: bhandara, langar, poojan, others.'));
  }

  if (!SERVING_STYLES.includes(servingStyle)) {
    return next(createValidationError('Serving style must be one of: plate-service or counter.'));
  }

  req.body = {
    customerName,
    userId,
    phoneNumber,
    priority,
    customerAddress,
    currentLocation,
    eventDate,
    numberOfGuests,
    eventType,
    servingStyle,
    additionalNote,
    totalBill,
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

const validateCompleteOrderByCustomer = (req, res, next) => {
  const orderId = sanitizeString(req.body.orderId);
  const customerName = sanitizeString(req.body.customerName);

  if (!orderId) {
    return next(createValidationError('Order id is required.'));
  }

  if (!mongoose.isValidObjectId(orderId)) {
    return next(createValidationError('Order id must be a valid MongoDB ObjectId.'));
  }

  if (!customerName) {
    return next(createValidationError('Customer name is required.'));
  }

  req.body = {
    orderId,
    customerName,
  };

  return next();
};

const validateReceivePayment = (req, res, next) => {
  const paymentId = sanitizeString(req.body.paymentId);

  if (!paymentId) {
    return next(createValidationError('Payment id is required.'));
  }

  if (!mongoose.isValidObjectId(paymentId)) {
    return next(createValidationError('Payment id must be a valid MongoDB ObjectId.'));
  }

  req.body = {
    paymentId,
  };

  return next();
};

module.exports = {
  validateCreateOrder,
  validateOrderDecision,
  validateCompleteOrderByCustomer,
  validateReceivePayment,
};
