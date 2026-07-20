# MilStock

MilStock is a bilingual smart food inventory and warehouse management system for tracking food supplies, warehouse stock, supply requests, users, notifications, and operational reports.

The project uses a React/Vite frontend, a Node.js/Express backend, and MongoDB Atlas through Mongoose. The frontend must remain React.

## Project Overview

MilStock is focused only on food inventory management. The demo data, labels, tables, dropdowns, reports, and workflows use food supply examples such as rice, pasta, sugar, flour, cooking oil, milk, cheese, beans, lentils, canned food, frozen food, vegetables, fruits, bread, and water bottles.

The app supports:

- English LTR interface
- Arabic RTL interface
- Admin dashboard
- Kitchen/unit user dashboard
- Desktop and mobile layouts
- Real MongoDB data through API endpoints
- Role-based route protection
- CSV exports with Arabic Excel support

## Tech Stack

Frontend:

- React
- Vite
- JavaScript
- React Router
- Lucide icons
- Recharts
- Radix UI components

Backend:

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT authentication
- bcrypt password hashing
- express-validator
- CORS, Helmet, Morgan

Deployment targets:

- Netlify for frontend
- Render for backend
- MongoDB Atlas for database

## Folder Structure

```text
.
|-- backend/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- scripts/
|   |-- seed/
|   |-- utils/
|   |-- app.js
|   `-- server.js
|-- front-end/
|   |-- public/
|   `-- src/app/
|       |-- components/
|       |-- lib/
|       |-- pages/
|       `-- routes.js
|-- qa-output/
|-- scripts/
|-- netlify.toml
|-- package.json
`-- README.md
```

## Main Features

Authentication and authorization:

- Login and registration API
- JWT authentication
- Password hashing with bcrypt
- Protected routes
- Role-based access control
- Admin role
- Unit/kitchen user role
- Frontend test admin login:
  - `testadmin@milstock.local`
  - password: `123`

Role-based routing:

- Admin users stay in `/admin/*`
- Kitchen/unit users stay in `/user/*`
- Arabic admin users stay in `/ar/admin/*`
- Arabic kitchen/unit users stay in `/ar/user/*`
- Unauthorized routes redirect only when the current path is not allowed
- Refreshing an admin page such as `/admin/users` keeps the admin on that page

Inventory:

- Inventory list from MongoDB
- Search by item name or item ID
- Category and status filters
- Food-only product data
- Add inventory item
- Edit inventory item
- Delete inventory item with confirmation modal
- Item details page
- Warehouse assignment
- Storage section
- Expiration date
- Manufacturing date
- Batch number
- Serial number
- Description and notes
- Low stock and expiration status badges

Warehouse management:

- Warehouse list/cards
- Warehouse location
- Warehouse manager
- Capacity utilization
- Product warehouse stock records
- Stock distribution by category
- Warehouse alerts

Requests and orders:

- Admin requests list
- User requests list
- Clickable request rows/cards
- Request details page using real MongoDB data
- Order items loaded from API
- Supplier relation
- Requester/user relation
- Approve request
- Reject/cancel request
- Mark request as delivered/completed
- Status logs for order transitions
- Admin-only request actions

User management:

- Users table from MongoDB
- Add user
- View user details
- Edit user
- Activate user
- Deactivate user
- Reset password
- Delete user
- Three-dot row action menu
- Confirmation modals
- Password is never returned by API

Notifications:

- Notifications list
- Unread indicators
- Mark all read behavior
- Notification export
- Arabic notification page

Reports and audit:

- Reports and analytics page
- Consumption trends
- Waste analysis
- KPI cards
- Audit logs page
- Exportable report datasets

CSV export:

- Reusable CSV export helper
- Exports currently visible filtered data
- UTF-8 BOM for Arabic text in Excel
- Handles commas, quotes, multiline text, null and undefined values
- Empty export message:
  - `No data available to export.`

Arabic/RTL support:

- Arabic login
- Arabic admin dashboard
- Arabic user dashboard
- Arabic inventory pages
- Arabic request pages
- Arabic users pages
- Arabic settings/profile/not found/access denied
- RTL sidebars, navbars, forms, tables, and cards
- Arabic CSV export support

Responsive UI:

- Desktop fixed/sticky sidebar
- Mobile top and bottom navigation
- Responsive cards and tables
- Buttons wrap on small screens
- No intentional horizontal scrolling

QA artifacts:

- Generated QA workbook:
  - `qa-output/MilStock_Test_Cases.xlsx`
- Includes functional, API, regression, smoke, UAT, responsive, security, and database testing sheets

## Frontend Routes

English:

- `/`
- `/login`
- `/403`
- `/admin/dashboard`
- `/admin/inventory`
- `/admin/inventory/add`
- `/admin/inventory/logs`
- `/admin/inventory/expiration`
- `/admin/inventory/warehouses`
- `/admin/inventory/:id`
- `/admin/inventory/:id/edit`
- `/admin/requests`
- `/admin/requests/pending`
- `/admin/requests/:id`
- `/admin/notifications`
- `/admin/reports`
- `/admin/audit-logs`
- `/admin/users`
- `/admin/users/new`
- `/admin/users/:id`
- `/admin/users/:id/edit`
- `/admin/settings`
- `/user/dashboard`
- `/user/inventory`
- `/user/requests`
- `/user/requests/create`
- `/user/requests/:id`
- `/user/notifications`
- `/profile`

Arabic:

- `/ar/login`
- `/ar/403`
- `/ar/admin/dashboard`
- `/ar/admin/inventory`
- `/ar/admin/inventory/add`
- `/ar/admin/inventory/logs`
- `/ar/admin/inventory/expiration`
- `/ar/admin/inventory/warehouses`
- `/ar/admin/inventory/:id`
- `/ar/admin/inventory/:id/edit`
- `/ar/admin/requests`
- `/ar/admin/requests/pending`
- `/ar/admin/requests/:id`
- `/ar/admin/notifications`
- `/ar/admin/reports`
- `/ar/admin/audit-logs`
- `/ar/admin/users`
- `/ar/admin/users/new`
- `/ar/admin/users/:id`
- `/ar/admin/users/:id/edit`
- `/ar/admin/settings`
- `/ar/user/dashboard`
- `/ar/user/inventory`
- `/ar/user/requests`
- `/ar/user/requests/create`
- `/ar/user/requests/:id`
- `/ar/user/notifications`
- `/ar/profile`

## Backend API

Base URL:

```text
http://localhost:5001/api
```

Health:

- `GET /api/health`

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Users:

- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `PATCH /api/users/:id`
- `PATCH /api/users/:id/status`
- `PATCH /api/users/:id/password`
- `DELETE /api/users/:id`

Products:

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Warehouses:

- `GET /api/warehouses`
- `POST /api/warehouses`
- `GET /api/warehouses/:id`
- `PUT /api/warehouses/:id`
- `DELETE /api/warehouses/:id`

Suppliers:

- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/suppliers/:id`
- `PUT /api/suppliers/:id`
- `DELETE /api/suppliers/:id`

Orders:

- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id`
- `DELETE /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `GET /api/orders/:id/status-logs`

Order items:

- `GET /api/order-items`
- `POST /api/order-items`
- `GET /api/order-items/:id`
- `PUT /api/order-items/:id`
- `DELETE /api/order-items/:id`
- Alias: `/api/orders/items`

Inventory movements:

- `GET /api/inventory`
- `POST /api/inventory`
- `GET /api/inventory/:id`
- `PUT /api/inventory/:id`
- `DELETE /api/inventory/:id`

Product warehouse stock:

- `GET /api/product-warehouses`
- `POST /api/product-warehouses`
- `GET /api/product-warehouses/:id`
- `PUT /api/product-warehouses/:id`
- `DELETE /api/product-warehouses/:id`
- Alias: `/api/inventory/product-warehouses`

Consumption:

- `GET /api/consumption`
- `POST /api/consumption`
- `GET /api/consumption/:id`
- `PUT /api/consumption/:id`
- `DELETE /api/consumption/:id`

Notifications:

- `GET /api/notifications`
- `POST /api/notifications`
- `GET /api/notifications/:id`
- `PUT /api/notifications/:id`
- `DELETE /api/notifications/:id`

## MongoDB Collections

The backend uses these Mongoose models:

- User
- Warehouse
- Product
- ProductWarehouse
- Supplier
- Order
- OrderItem
- InventoryMovement
- Consumption
- Notification
- OrderStatusLog

Important relationships:

- Users create orders
- Orders belong to users and suppliers
- Orders have order items
- Order items reference products
- Products are stored in warehouses
- ProductWarehouse connects products and warehouses
- Consumption references user, product, and warehouse
- InventoryMovement references product and user
- Notifications reference users
- OrderStatusLog references orders and optionally users/admins

## Demo Data

MongoDB data is not stored in Git. The seed script creates public demo data on any device:

```bash
npm run seed
```

Seed location:

```text
backend/seed/seed.js
```

Seeded data includes:

- Admin and kitchen users
- Food products
- Food categories
- Units
- Warehouses
- Suppliers
- Orders
- Order items
- Product warehouse stock
- Consumption records
- Inventory movements
- Notifications
- Order status logs

## Demo Credentials

Backend-backed users:

```text
admin@milstock.local / Password123!
kitchen@milstock.local / Password123!
```

Frontend-only test admin:

```text
testadmin@milstock.local / 123
```

## Environment Variables

Backend `.env`:

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb+srv://amal:rE0p6RBsLOSxCR8A@cluster0.9wcceti.mongodb.net/milstock?appName=Cluster0
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

For production, set real secrets in Render/Netlify environment variables instead of committing them to Git.

## Installation

From the project root:

```bash
npm run setup:demo
```

This command:

- Creates env files from examples when missing
- Installs backend dependencies
- Installs frontend dependencies
- Seeds MongoDB with demo food data

Manual setup:

```bash
npm run init:env
npm run install:all
npm run seed
```

## Running in Development

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:frontend
```

Local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5001
Health:   http://localhost:5001/api/health
```

## Scripts

Root scripts:

- `npm run init:env`
- `npm run install:all`
- `npm run setup:demo`
- `npm run seed`
- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run start:backend`
- `npm run build:frontend`

Backend scripts:

- `npm --prefix backend run dev`
- `npm --prefix backend start`
- `npm --prefix backend run seed`
- `npm --prefix backend run migrate:items-fields`
- `npm --prefix backend run migrate:users-status`

Frontend scripts:

- `npm --prefix front-end run dev`
- `npm --prefix front-end run build`

## Migrations

Item field migration:

```bash
npm --prefix backend run migrate:items-fields
```

Backfills product fields:

- `warehouse_id`
- `warehouse_name`
- `storage_section`
- `expiration_date`
- `manufacturing_date`
- `batch_number`
- `serial_number`
- `description`
- `notes`

User status migration:

```bash
npm --prefix backend run migrate:users-status
```

Backfills old users with:

```text
status = active
```

## Deployment

Netlify frontend config:

```toml
[build]
  base = "front-end"
  command = "npm run build"
  publish = "dist"
```

The frontend should set:

```env
VITE_API_BASE_URL=https://your-render-backend-url/api
```

Render backend should set:

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-netlify-site.netlify.app
```

## Security Notes

- Passwords are hashed with bcrypt
- JWT is required for protected backend routes
- Admin-only actions are protected on backend routes
- Frontend route guards prevent role navigation mistakes
- Passwords are not returned in API responses
- `.env`, `node_modules`, and `dist` should not be committed

## QA Documentation

A complete QA workbook was generated for the testing team:

```text
qa-output/MilStock_Test_Cases.xlsx
```

It includes:

- Test Cases
- API Testing
- Bug Report
- Regression Testing
- Smoke Testing
- UAT
- Responsive Testing
- Security Testing
- Database Testing
- Summary

## Build Verification

Run:

```bash
npm --prefix front-end run build
```

Expected result:

- Vite production build completes successfully
- The app compiles with React/Vite
- No TypeScript migration is required

## Notes for Developers

- Keep frontend as React/Vite
- Keep code in JavaScript, not TypeScript
- Do not rename schema fields unless the ERD requires it
- Use MongoDB `_id` values in dropdown submissions
- Keep English and Arabic screens connected to the same backend data
- Keep all data food-inventory related
- Do not add medicine, weapons, military items, dangerous substances, or unrelated inventory examples
