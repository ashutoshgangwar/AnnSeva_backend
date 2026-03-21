/**
 * One-time fix script: drops the old non-sparse 'google_1' index on the
 * authusers collection so that Mongoose can recreate it correctly as a
 * sparse unique index (allowing multiple documents with googleId: null).
 *
 * Run once with:  node scripts/fixGoogleIdIndex.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set in .env');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected to MongoDB');

    const collection = mongoose.connection.collection('authusers');

    // List current indexes so we can see what exists
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map((i) => i.name));

    const badIndexNames = ['google_1', 'googleId_1'];

    for (const indexName of badIndexNames) {
      const exists = indexes.some((i) => i.name === indexName);
      if (exists) {
        await collection.dropIndex(indexName);
        console.log(`✅  Dropped index: ${indexName}`);
      } else {
        console.log(`ℹ️   Index not found (already removed or never existed): ${indexName}`);
      }
    }

    console.log('✅  Done. Restart the server — Mongoose will recreate the correct sparse index automatically.');
  } catch (err) {
    console.error('❌  Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
