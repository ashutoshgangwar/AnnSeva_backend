const mongoose = require('mongoose');
const Customer = require('../models/customer.model');

const DUMMY_CUSTOMER_PAYLOAD = {
  fullName: 'Anita Sharma',
  phoneNumber: '8810270935',
  email: 'anita.sharma@example.com',
  address: 'Sector 45, Noida',
  currentLocation: {
    latitude: 28.5449,
    longitude: 77.3916,
  },
  isDummy: true,
};

const assertDatabaseConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database is not connected. Please set MONGO_URI and restart server.');
    error.statusCode = 503;
    throw error;
  }
};

const createDummyCustomer = async () => {
  assertDatabaseConnected();

  const existingCustomer = await Customer.findOne({
    phoneNumber: DUMMY_CUSTOMER_PAYLOAD.phoneNumber,
  });

  if (existingCustomer) {
    return {
      customer: existingCustomer,
      created: false,
    };
  }

  const customer = await Customer.create(DUMMY_CUSTOMER_PAYLOAD);

  return {
    customer,
    created: true,
  };
};

const getCustomerById = async (customerId) => {
  assertDatabaseConnected();
  return Customer.findById(customerId);
};

module.exports = {
  DUMMY_CUSTOMER_PAYLOAD,
  createDummyCustomer,
  getCustomerById,
};
