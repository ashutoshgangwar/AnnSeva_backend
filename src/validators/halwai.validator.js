const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;
const GST_REGEX = /^[0-9A-Z]{15}$/i;

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const sanitizeOptionalField = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const sanitized = String(value).trim();
  return sanitized.length > 0 ? sanitized : undefined;
};

const sanitizeStringList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0);
};

const sanitizeLocationDetails = (value) => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const latitude =
    value.latitude === undefined || value.latitude === null || value.latitude === ''
      ? null
      : Number(value.latitude);
  const longitude =
    value.longitude === undefined || value.longitude === null || value.longitude === ''
      ? null
      : Number(value.longitude);
  const physicalAddress = String(value.physicalAddress || '').trim();

  return {
    latitude,
    longitude,
    physicalAddress,
  };
};

const validateHalwaiOnboarding = (req, res, next) => {
  const {
    halwaiName,
    shopName,
    location,
    phoneNumber,
    alternatePhoneNumber,
    gstNumber,
    licenseNumber,
    foodTypes,
    specializations,
    yearsOfExperience,
    locationDetails,
    minGuestsCapacity,
    maxGuestsCapacity,
    pricePerPlate,
  } = req.body;

  const sanitizedBody = {
    halwaiName: String(halwaiName || '').trim(),
    shopName: String(shopName || '').trim(),
    location: String(location || '').trim(),
    phoneNumber: String(phoneNumber || '').trim(),
    alternatePhoneNumber: sanitizeOptionalField(alternatePhoneNumber),
    gstNumber: sanitizeOptionalField(gstNumber),
    licenseNumber: sanitizeOptionalField(licenseNumber),
    foodTypes: sanitizeStringList(foodTypes),
    specializations: sanitizeStringList(specializations),
    yearsOfExperience:
      yearsOfExperience === undefined || yearsOfExperience === null || yearsOfExperience === ''
        ? 0
        : Number(yearsOfExperience),
    locationDetails: sanitizeLocationDetails(locationDetails),
    minGuestsCapacity:
      minGuestsCapacity === undefined || minGuestsCapacity === null || minGuestsCapacity === ''
        ? 1
        : Number(minGuestsCapacity),
    maxGuestsCapacity:
      maxGuestsCapacity === undefined || maxGuestsCapacity === null || maxGuestsCapacity === ''
        ? 1
        : Number(maxGuestsCapacity),
    pricePerPlate:
      pricePerPlate === undefined || pricePerPlate === null || pricePerPlate === ''
        ? 0
        : Number(pricePerPlate),
  };

  if (!sanitizedBody.halwaiName) {
    return next(createValidationError('Halwai name is required.'));
  }

  if (!sanitizedBody.shopName) {
    return next(createValidationError('Shop name is required.'));
  }

  if (!sanitizedBody.location) {
    return next(createValidationError('Location is required.'));
  }

  if (!sanitizedBody.phoneNumber) {
    return next(createValidationError('Phone number is required.'));
  }

  if (!PHONE_REGEX.test(sanitizedBody.phoneNumber)) {
    return next(
      createValidationError('Phone number must be valid and include 10 to 15 digits.')
    );
  }

  if (
    sanitizedBody.alternatePhoneNumber &&
    !PHONE_REGEX.test(sanitizedBody.alternatePhoneNumber)
  ) {
    return next(
      createValidationError(
        'Alternate phone number must be valid and include 10 to 15 digits.'
      )
    );
  }

  if (
    sanitizedBody.alternatePhoneNumber &&
    sanitizedBody.alternatePhoneNumber === sanitizedBody.phoneNumber
  ) {
    return next(
      createValidationError('Alternate phone number must be different from phone number.')
    );
  }

  if (sanitizedBody.gstNumber && !GST_REGEX.test(sanitizedBody.gstNumber)) {
    return next(createValidationError('GST number must be a valid 15-character code.'));
  }

  if (sanitizedBody.licenseNumber && sanitizedBody.licenseNumber.length < 4) {
    return next(createValidationError('License number must be at least 4 characters long.'));
  }

  if (Number.isNaN(sanitizedBody.yearsOfExperience) || sanitizedBody.yearsOfExperience < 0) {
    return next(createValidationError('Years of experience must be a non-negative number.'));
  }

  if (
    Number.isNaN(sanitizedBody.minGuestsCapacity) ||
    sanitizedBody.minGuestsCapacity < 1
  ) {
    return next(createValidationError('Minimum guest capacity must be at least 1.'));
  }

  if (
    Number.isNaN(sanitizedBody.maxGuestsCapacity) ||
    sanitizedBody.maxGuestsCapacity < sanitizedBody.minGuestsCapacity
  ) {
    return next(
      createValidationError(
        'Maximum guest capacity must be greater than or equal to minimum guest capacity.'
      )
    );
  }

  if (Number.isNaN(sanitizedBody.pricePerPlate) || sanitizedBody.pricePerPlate < 0) {
    return next(createValidationError('Price per plate must be a non-negative number.'));
  }

  if (sanitizedBody.locationDetails) {
    const { latitude, longitude } = sanitizedBody.locationDetails;

    if (latitude !== null && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) {
      return next(createValidationError('Halwai latitude must be between -90 and 90.'));
    }

    if (
      longitude !== null &&
      (Number.isNaN(longitude) || longitude < -180 || longitude > 180)
    ) {
      return next(createValidationError('Halwai longitude must be between -180 and 180.'));
    }
  }

  req.body = sanitizedBody;
  return next();
};

module.exports = {
  validateHalwaiOnboarding,
};
