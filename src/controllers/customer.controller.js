const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { createDummyCustomer, getCustomerById } = require('../services/customer.service');

const createSeedCustomer = asyncHandler(async (req, res) => {
  const result = await createDummyCustomer();

  res.status(result.created ? 201 : 200).json({
    success: true,
    message: result.created
      ? 'Dummy customer created successfully.'
      : 'Dummy customer already exists.',
    data: result.customer,
  });
});

const getCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.isValidObjectId(customerId)) {
    const error = new Error('Customer id must be a valid MongoDB ObjectId.');
    error.statusCode = 400;
    throw error;
  }

  const customer = await getCustomerById(customerId);

  if (!customer) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Customer fetched successfully.',
    data: customer,
  });
});

module.exports = {
  createSeedCustomer,
  getCustomer,
};
