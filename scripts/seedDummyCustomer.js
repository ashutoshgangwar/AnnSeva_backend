const mongoose = require('mongoose');
const env = require('../src/config/env');
const connectDatabase = require('../src/config/db');
const { createDummyCustomer } = require('../src/services/customer.service');

const seedDummyCustomer = async () => {
  try {
    if (!env.mongoUri) {
      throw new Error('MONGO_URI is not set. Add it to .env before seeding a dummy customer.');
    }

    await connectDatabase();
    const result = await createDummyCustomer();

    console.log(
      JSON.stringify(
        {
          success: true,
          created: result.created,
          customerId: result.customer._id,
          data: result.customer,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

seedDummyCustomer();
