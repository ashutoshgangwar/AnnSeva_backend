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
- `GET /api/v1/halwai/:halwaiId/overview`
- `POST /api/v1/customers/dummy`
- `GET /api/v1/customers/:customerId`
- `POST /api/v1/orders`
- `POST /api/v1/orders/customer-request`
- `GET /api/v1/orders/incoming`
- `GET /api/v1/orders/active`
- `GET /api/v1/orders/:orderId`
- `POST /api/v1/orders/complete`
- `GET /api/v1/orders/:orderId/payment`
- `POST /api/v1/orders/:orderId/payment/receive`
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

### Dummy customer API

Use `POST /api/v1/customers/dummy` to create a reusable dummy customer in MongoDB.

If the dummy customer already exists, the same record is returned.

Default dummy customer values:

```json
{
  "fullName": "Anita Sharma",
  "phoneNumber": "8810270935",
  "email": "anita.sharma@example.com",
  "address": "Sector 45, Noida",
  "currentLocation": {
    "latitude": 28.5449,
    "longitude": 77.3916
  },
  "isDummy": true
}
```

Use `GET /api/v1/customers/:customerId` to fetch the saved customer record.

### Verify Halwai data saved in DB

1. `POST /api/v1/halwai/onboard` and copy `data._id` from response.
2. Call `GET /api/v1/halwai/:halwaiId` with that same id.
3. If the same record is returned, data is saved in MongoDB.

If MongoDB is not connected, Halwai APIs return `503`.

### Halwai overview API

`GET /api/v1/halwai/:halwaiId/overview` returns:
- `activeOrders`
- `totalGuestsServed`
- `totalCompletedBookings`

### Create incoming order payload

```json
{
  "userId": "PASTE_CUSTOMER_ID_FROM_DUMMY_API",
  "customerName": "Anita Sharma",
  "phoneNumber": "+919876543210",
  "priority": "high",
  "customerAddress": "Sector 45, Noida",
  "currentLocation": {
    "latitude": 28.5449,
    "longitude": 77.3916
  },
  "eventDate": "2026-04-15T18:30:00.000Z",
  "numberOfGuests": 180,
  "eventType": "bhandara",
  "servingStyle": "plate-service",
  "additionalNote": "Need evening dinner setup with sweet counter.",
  "totalBill": 0,
  "menu": [
    { "itemName": "Dal Makhani" },
    { "itemName": "Chole" },
    { "itemName": "Jeera Rice" },
    { "itemName": "Gulab Jamun" }
  ]
}
```

Required fields: `userId`, `customerName`, `phoneNumber`, `customerAddress`, `currentLocation`, `eventDate`, `numberOfGuests`, `eventType`, `servingStyle`, `menu`

Priority values: `high`, `medium`, `low`

Event type values: `bhandara`, `langar`, `poojan`, `others`

Serving style values: `plate-service`, `counter`

Allowed menu options: `Dal Makhani`, `Chole`, `Jeera Rice`, `Pulao`, `Roti`, `Boondi Raita`, `Gulab Jamun`, `Kheer`, `Halwa`, `Puri`

### Halwai accepts/rejects order payload

```json
{
  "decision": "accepted",
  "halwaiId": "65f4a9f8c98df8f5823f1abc"
}
```

Status update values: `accept`, `reject`, `reached`, `completed`.

Allowed flow: `pending -> accept/reject -> reached -> completed`.

`GET /api/v1/orders/incoming` only returns `pending` orders, so accept/reject/reached/completed orders are not shown there.

`GET /api/v1/orders/active` returns active orders with: `orderId`, `customerName`, `phoneNumber`, `address`, `eventDate`, `numberOfGuests`, `daysLeft`, `selectedMenu`, and `tag` (`active`).

### Get customer order details

Use `GET /api/v1/orders/:orderId` to fetch the full customer request by order id.

Example response fields:
- `_id`
- `userId`
- `customerName`
- `phoneNumber`
- `priority`
- `customerAddress`
- `currentLocation`
- `eventDate`
- `numberOfGuests`
- `menu`
- `eventType`
- `servingStyle`
- `additionalNote`
- `totalBill`
- `status`
- `paymentStatus`
- `paymentId`
- `paymentReceivedAt`
- `halwaiId`
- `halwaiDecisionAt`
- `createdAt`
- `updatedAt`

### Seed dummy customer from terminal

```bash
npm run seed:customer
```

### Mark order completed payload

```json
{
  "orderId": "65f4a9f8c98df8f5823f1def",
  "customerName": "Anita Sharma"
}
```

Use `POST /api/v1/orders/complete` to mark an order as completed using only `orderId` and `customerName`.

When order is marked `completed`, a record is created in a separate `payments` collection and `paymentId` is the payment document MongoDB `_id`.

### Payment APIs

- `GET /api/v1/orders/:orderId/payment` returns payment bill details:
  `paymentId`, `totalBill`, `userName`, `address`, `phoneNumber`, `guests`, `paymentStatus`, `menu`.
- `POST /api/v1/orders/:orderId/payment/receive` marks payment as received and returns `paymentId`.

Receive payment payload:

```json
{
  "paymentId": "69bc35c5f1de024b590e8600"
}
```

For receive payment API, both values are required:
- `orderId` in URL
- `paymentId` in request body
