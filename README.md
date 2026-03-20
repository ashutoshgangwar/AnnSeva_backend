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
- `POST /api/v1/auth/google`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/me/profile-link`
- `POST /api/v1/halwai/onboard`
- `GET /api/v1/halwai/search`
- `GET /api/v1/halwai/:halwaiId`
- `GET /api/v1/halwai/:halwaiId/overview`
- `GET /api/v1/halwai/:halwaiId/reviews`
- `POST /api/v1/customers/dummy`
- `GET /api/v1/customers/:customerId`
- `GET /api/v1/customers/:customerId/orders`
- `GET /api/v1/customers/:customerId/orders/:orderId/payment-details`
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

### Google authentication

Use `POST /api/v1/auth/google` with Google ID token and role:

```json
{
  "idToken": "GOOGLE_ID_TOKEN_FROM_CLIENT",
  "role": "customer"
}
```

or

```json
{
  "idToken": "GOOGLE_ID_TOKEN_FROM_CLIENT",
  "role": "halwai"
}
```

Response returns:
- `data.token` (JWT access token)
- `data.user.role`
- `data.user.profileId` (null until linked)

### Link logged-in user to existing profile

Use `PATCH /api/v1/auth/me/profile-link` with bearer token:

```json
{
  "profileId": "PASTE_CUSTOMER_OR_HALWAI_ID"
}
```

### Authorization header

For protected APIs, pass JWT in header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Role-based access

- Customer-only: `POST /api/v1/orders`, `POST /api/v1/orders/customer-request`, `POST /api/v1/orders/complete`, customer profile/orders/payment/rating endpoints.
- Halwai-only: `POST /api/v1/halwai/onboard`, `GET /api/v1/orders/incoming`, `GET /api/v1/orders/active`, order decision/payment receive endpoints, and halwai overview.
- Public: `GET /api/v1/health`, `GET /api/v1/halwai/search`, `GET /api/v1/halwai/:halwaiId`, `GET /api/v1/halwai/:halwaiId/reviews`, `GET /api/v1/orders/:orderId`, `POST /api/v1/customers/dummy`.

### Halwai onboarding payload

```json
{
  "halwaiName": "Ramesh Sweets",
  "shopName": "Ramesh Mithai Bhandar",
  "location": "Noida Sector 62",
  "phoneNumber": "+919876543210",
  "foodTypes": ["veg", "sweets"],
  "specializations": ["North Indian", "Punjabi"],
  "yearsOfExperience": 12,
  "locationDetails": {
    "latitude": 28.6139,
    "longitude": 77.209,
    "physicalAddress": "Shop 22, Sector 62, Noida"
  },
  "minGuestsCapacity": 50,
  "maxGuestsCapacity": 1000,
  "pricePerPlate": 220,
  "alternatePhoneNumber": "+919123456789",
  "gstNumber": "07ABCDE1234F1Z5",
  "licenseNumber": "FSSAI-998877"
}
```

Required fields: `halwaiName`, `shopName`, `location`, `phoneNumber`

Profile listing fields supported: `foodTypes`, `specializations`, `yearsOfExperience`, `locationDetails.latitude`, `locationDetails.longitude`, `locationDetails.physicalAddress`, `minGuestsCapacity`, `maxGuestsCapacity`, `pricePerPlate`

### Search nearby halwais

Use `GET /api/v1/halwai/search` to find nearby halwais for a customer.

Required query params:
- `latitude`
- `longitude`

Optional query params:
- `guests`
- `foodType`
- `specialization`
- `maxDistanceKm`
- `limit`

Example:

```bash
curl "http://localhost:3000/api/v1/halwai/search?latitude=28.5449&longitude=77.3916&guests=180&foodType=veg&specialization=Punjabi&maxDistanceKm=30&limit=10"
```

Each listing returns: `halwaiId`, `halwaiName`, `shopName`, `foodTypes`, `specializations`, `yearsOfExperience`, `locationDetails`, `minGuestsCapacity`, `maxGuestsCapacity`, `pricePerPlate`, `averageRating`, `reviewCount`, `distanceInKm`

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

### Customer orders summary API

Use `GET /api/v1/customers/:customerId/orders` to fetch how many orders a customer has created and the details of each order.

Response includes:
- `totalOrdersCreated`
- `statusSummary.submitted`
- `statusSummary.accepted`
- `statusSummary.reject`
- `statusSummary.reached`
- `statusSummary.completed`
- `orders[].customerLocation`
- `orders[].estimatedCost`
- `orders[].eventDate`
- `orders[].numberOfGuests`
- `orders[].menuItems`
- `orders[].status`

Example:

```bash
curl http://localhost:3000/api/v1/customers/PASTE_CUSTOMER_ID/orders
```

### Customer order payment details API

Use `GET /api/v1/customers/:customerId/orders/:orderId/payment-details` to fetch payment details for one specific order belonging to that customer.

Response includes:
- `totalAmount`
- `paymentStatus`
- `location`
- `eventDate`
- `guestNumbers`
- `pricePerPlate`
- `totalPlates`
- `status`
- `menuItems`

Example:

```bash
curl http://localhost:3000/api/v1/customers/PASTE_CUSTOMER_ID/orders/PASTE_ORDER_ID/payment-details
```

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

### Halwai reviews API

`GET /api/v1/halwai/:halwaiId/reviews` returns:
- `averageRating`
- `reviewCount`
- `reviews`

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

---

## Complete auth-to-rating API flow (single reference)

Base URL:

`http://localhost:3000/api/v1`

Protected APIs require header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Step 1: Customer Google login

**POST** `/api/v1/auth/google`

Request:

```json
{
  "idToken": "GOOGLE_ID_TOKEN_FROM_CLIENT",
  "role": "customer"
}
```

Response:

```json
{
  "success": true,
  "message": "Google login successful.",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "userId": "67f...",
      "name": "Ashutosh",
      "email": "ashu@example.com",
      "role": "customer",
      "profileId": null,
      "profileModel": null,
      "picture": "https://..."
    }
  }
}
```

### Step 2: Create or get customer profile

**POST** `/api/v1/customers/dummy`

Response:

```json
{
  "success": true,
  "message": "Dummy customer created successfully.",
  "data": {
    "_id": "67a1234567890abcdef12345",
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
}
```

### Step 3: Link customer auth user with customer profile

**PATCH** `/api/v1/auth/me/profile-link`

Request:

```json
{
  "profileId": "67a1234567890abcdef12345"
}
```

Response:

```json
{
  "success": true,
  "message": "Profile linked successfully.",
  "data": {
    "token": "NEW_CUSTOMER_JWT",
    "user": {
      "userId": "67f...",
      "name": "Ashutosh",
      "email": "ashu@example.com",
      "role": "customer",
      "profileId": "67a1234567890abcdef12345",
      "profileModel": "Customer",
      "picture": "https://..."
    }
  }
}
```

### Step 4: Halwai Google login

**POST** `/api/v1/auth/google`

Request:

```json
{
  "idToken": "GOOGLE_ID_TOKEN_FROM_CLIENT",
  "role": "halwai"
}
```

Response:

```json
{
  "success": true,
  "message": "Google login successful.",
  "data": {
    "token": "HALWAI_JWT",
    "user": {
      "userId": "67hAuth...",
      "name": "Halwai Owner",
      "email": "halwai@example.com",
      "role": "halwai",
      "profileId": null,
      "profileModel": null,
      "picture": "https://..."
    }
  }
}
```

### Step 5: Halwai onboarding

**POST** `/api/v1/halwai/onboard`

Request:

```json
{
  "halwaiName": "Ramesh Sweets",
  "shopName": "Ramesh Mithai Bhandar",
  "location": "Noida Sector 62",
  "phoneNumber": "+919876543210",
  "foodTypes": ["veg", "sweets"],
  "specializations": ["North Indian", "Punjabi"],
  "yearsOfExperience": 12,
  "locationDetails": {
    "latitude": 28.6139,
    "longitude": 77.209,
    "physicalAddress": "Shop 22, Sector 62, Noida"
  },
  "minGuestsCapacity": 50,
  "maxGuestsCapacity": 1000,
  "pricePerPlate": 220
}
```

Response:

```json
{
  "success": true,
  "message": "Halwai onboarded successfully.",
  "data": {
    "_id": "67halwai...",
    "halwaiName": "Ramesh Sweets",
    "shopName": "Ramesh Mithai Bhandar",
    "location": "Noida Sector 62",
    "phoneNumber": "+919876543210",
    "pricePerPlate": 220
  }
}
```

### Step 6: Customer searches halwai

**GET** `/api/v1/halwai/search?latitude=28.5449&longitude=77.3916&guests=180&limit=10`

Response (example):

```json
{
  "success": true,
  "message": "Nearby halwai listings fetched successfully.",
  "data": [
    {
      "halwaiId": "67halwai...",
      "halwaiName": "Ramesh Sweets",
      "averageRating": 4.5,
      "reviewCount": 12,
      "distanceInKm": 2.2,
      "pricePerPlate": 220
    }
  ]
}
```

### Step 7: Customer creates order

**POST** `/api/v1/orders/customer-request`

Request:

```json
{
  "userId": "67a1234567890abcdef12345",
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
    { "itemName": "Chole" }
  ]
}
```

Response:

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "_id": "67order...",
    "status": "pending",
    "paymentStatus": "pending"
  }
}
```

### Step 8: Halwai sees incoming orders

**GET** `/api/v1/orders/incoming`

### Step 9: Halwai accepts order

**PATCH** `/api/v1/orders/:orderId/decision`

Request:

```json
{
  "decision": "accept",
  "halwaiId": "67halwai..."
}
```

Response:

```json
{
  "success": true,
  "message": "Order accept by halwai successfully.",
  "data": {
    "_id": "67order...",
    "status": "accept",
    "halwaiId": "67halwai..."
  }
}
```

### Step 10: Customer marks order complete

**POST** `/api/v1/orders/complete`

Request:

```json
{
  "orderId": "67order...",
  "customerName": "Anita Sharma"
}
```

Response:

```json
{
  "success": true,
  "message": "Order marked as completed successfully.",
  "data": {
    "order": {
      "_id": "67order...",
      "status": "completed"
    },
    "paymentId": "67payment..."
  }
}
```

### Step 11: Halwai checks payment

**GET** `/api/v1/orders/:orderId/payment`

Response fields include:
- `paymentId`
- `totalBill`
- `userName`
- `address`
- `phoneNumber`
- `guests`
- `paymentStatus`
- `menu`

### Step 12: Halwai receives payment

**POST** `/api/v1/orders/:orderId/payment/receive`

Request:

```json
{
  "paymentId": "67payment..."
}
```

Response:

```json
{
  "success": true,
  "message": "Payment marked as received successfully.",
  "data": {
    "orderId": "67order...",
    "paymentId": "67payment...",
    "paymentStatus": "received",
    "paymentReceivedAt": "2026-03-21T13:15:00.000Z"
  }
}
```

### Step 13: Customer checks payment details

**GET** `/api/v1/customers/:customerId/orders/:orderId/payment-details`

Response fields include:
- `totalAmount`
- `paymentStatus`
- `location`
- `eventDate`
- `guestNumbers`
- `pricePerPlate`
- `totalPlates`
- `status`
- `menuItems`

### Step 14: Customer submits rating (final)

**POST** `/api/v1/customers/:customerId/orders/:orderId/rating`

Request:

```json
{
  "rating": 4,
  "menuServed": ["Paneer Tikka", "Biryani", "Naan"],
  "reviewText": "Excellent service and delicious food!"
}
```

Response:

```json
{
  "success": true,
  "message": "Rating submitted successfully.",
  "data": {
    "reviewId": "67review...",
    "halwaiId": "67halwai...",
    "halwaiName": "Ramesh Sweets",
    "rating": 4,
    "createdAt": "2026-03-21T14:00:00.000Z"
  }
}
```

### Step 15: Verify rating appears

**GET** `/api/v1/halwai/:halwaiId/reviews`

Response includes:
- `averageRating`
- `reviewCount`
- `reviews[]`

