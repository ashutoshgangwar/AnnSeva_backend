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

const validateHalwaiOnboarding = (req, res, next) => {
  const {
    halwaiName,
    shopName,
    location,
    phoneNumber,
    alternatePhoneNumber,
    gstNumber,
    licenseNumber,
  } = req.body;

  const sanitizedBody = {
    halwaiName: String(halwaiName || '').trim(),
    shopName: String(shopName || '').trim(),
    location: String(location || '').trim(),
    phoneNumber: String(phoneNumber || '').trim(),
    alternatePhoneNumber: sanitizeOptionalField(alternatePhoneNumber),
    gstNumber: sanitizeOptionalField(gstNumber),
    licenseNumber: sanitizeOptionalField(licenseNumber),
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

  req.body = sanitizedBody;
  return next();
};

module.exports = {
  validateHalwaiOnboarding,
};
