# MilStock

MilStock is a React inventory dashboard with a Node.js, Express, MongoDB, and Mongoose backend.

## Requirements

- Node.js 18+
- npm
- MongoDB, either local or hosted

## Frontend Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The React app runs on `http://localhost:5173` by default.

Frontend environment variables:

- `VITE_API_BASE_URL`: backend API base URL, for example `http://localhost:5001/api`

## Backend Setup

```bash
cd ../backend
npm install
cp .env.example .env
npm run dev
```

The backend runs on `http://localhost:5001` by default.

Backend environment variables:

- `NODE_ENV`: `development` or `production`
- `PORT`: API port
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: long random secret for signing JWTs
- `JWT_EXPIRES_IN`: JWT lifetime, for example `7d`
- `CLIENT_URL`: frontend origin for CORS

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `/api/users`
- `/api/products`
- `/api/warehouses`
- `/api/suppliers`
- `/api/orders`
- `/api/order-items`
- `/api/inventory`
- `/api/product-warehouses`
- `/api/consumption`
- `/api/notifications`

Most routes require a `Bearer` token. Admin-only mutations are protected with role authorization. User roles follow the existing schema values: `admin` and `kitchen`.

## Development

Run the frontend and backend in separate terminals:

```bash
npm run dev:frontend
npm run dev:backend
```

From the project root, a new device can create env files, install dependencies, and load public demo data with:

```bash
npm run setup:demo
```

Seed MongoDB with ERD-aligned sample data:

```bash
npm run seed
```

Seeded demo credentials:

- `admin@milstock.local` / `Password123!`
- `kitchen@milstock.local` / `Password123!`

The frontend remains React and uses the existing Vite project structure. Arabic routes under `/ar` set `dir="rtl"` and the dashboard sidebar remains sticky on desktop while mobile navigation stays fixed.
