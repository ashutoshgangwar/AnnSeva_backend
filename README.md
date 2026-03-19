# AnnaSeva Backend

Clean Express + MongoDB backend structure for building AnnaSeva APIs.

## Project structure

```text
src/
  app.js
  server.js
  config/
  controllers/
  middlewares/
  models/
  routes/
    v1/
  services/
  utils/
  validators/
```

## Getting started

1. Copy `.env.example` to `.env`
2. Update `MONGO_URI`
3. Install dependencies
4. Start the development server

## Scripts

- `npm run dev` - start with nodemon
- `npm start` - start the API server
- `npm test` - no tests configured

## Default port

- The API runs on port `3000` by default.
- Override it by changing `PORT` in `.env`.

## API routes

- `GET /api/v1/health`
- `POST /api/v1/halwai/onboard`
- `GET /api/v1/halwai/:halwaiId`
- `POST /api/v1/orders`
- `GET /api/v1/orders/incoming`
- `POST /api/v1/orders/:orderId/status`
- `PATCH /api/v1/orders/:orderId/decision`

### Halwai onboarding payload

```json
{
  "halwaiName": "Ramesh Sweets",
  "shopName": "Ramesh Mithai Bhandar",
  "location": "Noida Sector 62",
  "phoneNumber": "+919876543210",
  "alternatePhoneNumber": "+919123456789",
  "gstNumber": "07ABCDE1234F1Z5",
  "licenseNumber": "FSSAI-998877"
}
```

Required fields: `halwaiName`, `shopName`, `location`, `phoneNumber`

### Verify Halwai data saved in DB

1. `POST /api/v1/halwai/onboard` and copy `data._id` from response.
2. Call `GET /api/v1/halwai/:halwaiId` with that same id.
3. If the same record is returned, data is saved in MongoDB.

If MongoDB is not connected, Halwai APIs return `503`.

### Create incoming order payload

```json
{
  "customerName": "Anita Sharma",
  "priority": "high",
  "customerAddress": "Sector 45, Noida",
  "eventDate": "2026-04-15T18:30:00.000Z",
  "numberOfGuests": 180,
  "menu": [
    { "itemName": "Paneer Butter Masala" },
    { "itemName": "Veg Biryani" },
    { "itemName": "Gulab Jamun" }
  ]
}
```

Required fields: `customerName`, `priority`, `customerAddress`, `eventDate`, `numberOfGuests`, `menu`

Priority values: `high`, `medium`, `low`

### Halwai accepts/rejects order payload

```json
{
  "decision": "accepted",
  "halwaiId": "65f4a9f8c98df8f5823f1abc"
}
```

Decision values: `accepted` or `rejected` (also supports `accept`/`reject`).

`GET /api/v1/orders/incoming` only returns `pending` orders, so accepted/rejected orders are not shown there.
