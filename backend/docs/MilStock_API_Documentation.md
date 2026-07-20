# MilStock API Documentation

MilStock is a Smart Inventory and Warehouse Management System backed by Node.js, Express, MongoDB Atlas, and JWT authentication. This document is intended for the Mobile Team and Testing Team.

## Base URLs

| Environment | URL |
| --- | --- |
| Local | `http://localhost:5001/api` |
| Production | `[ADD_RENDER_BACKEND_URL_HERE]/api` |

## Module Summary

Counts below are based on the actual mounted Express routes in `backend/app.js`. Compatibility aliases are listed in notes and are not double-counted unless they expose a different path group.

| Module | Endpoint Count | Auth Required | Notes |
| --- | ---: | --- | --- |
| Health | 2 | No | `/api/health`, `/` |
| Auth | 3 | Mixed | Login/register are public; `/me` requires JWT |
| Users | 8 | Yes | Admin management; supplier listing allowed for authenticated users |
| Products | 7 | Yes | Includes product-specific alert settings |
| Warehouses | 6 | Yes | Includes warehouse dashboard endpoint |
| Suppliers | 6 | Yes | Supplier business records and supplier user list |
| Supplier Orders | 3 | Yes | Supplier role only |
| Requests / Orders | 9 | Yes | Warehouse and supplier request flows |
| Order Items | 5 | Yes | Mounted at `/api/order-items` and `/api/orders/items` |
| Product Warehouse Stock | 5 | Yes | Mounted at `/api/product-warehouses` and `/api/inventory/product-warehouses` |
| Movement Logs | 6 | Yes | Mounted at `/api/movements` and `/api/inventory` |
| Consumption | 5 | Yes | Consumption CRUD |
| Notifications | 9 | Yes | Includes expiration checks and read actions |
| Audit Logs | 2 | Yes | Admin read; authenticated frontend audit create |

## Authentication

MilStock uses JWT bearer tokens. After login, store the returned token and send it with every protected API request.

```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Roles

| Role | Description |
| --- | --- |
| `admin` | Full management access to users, warehouses, inventory, orders, movements, suppliers, audit logs, and settings. |
| `unit` | Kitchen/unit user. Can create requests and view data scoped to their `assigned_warehouse`. |
| `supplier` | Supplier user. Can log in and manage only supplier requests assigned to them. |

## Standard Responses

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Status Codes

| Code | Meaning |
| ---: | --- |
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request / validation error |
| 401 | Unauthorized or missing/invalid token |
| 403 | Forbidden for current role |
| 404 | Resource not found |
| 409 | Conflict, such as duplicate user email |
| 500 | Server error |

## Role Access Matrix

| Endpoint Group | Admin | Unit | Supplier | Auth Required |
| --- | --- | --- | --- | --- |
| Auth login/register | Yes | Yes | Yes | No |
| Auth `/me` | Yes | Yes | Yes | Yes |
| Users management | Yes | No | No | Yes |
| Supplier user list | Yes | Yes | Yes | Yes |
| Inventory/products view | All | Assigned warehouse only where warehouse-scoped | No by business rule; route may authenticate only | Yes |
| Product alert settings update | Yes | No | No | Yes |
| Warehouses view | All | Assigned warehouse only on dashboard | No dashboard access | Yes |
| Warehouse dashboard | All | Assigned warehouse only | No | Yes |
| Requests/orders list | All | Own/assigned warehouse scope | Own supplier orders through supplier routes | Yes |
| Admin approve/reject requests | Yes | No | No | Yes |
| Complete transfer from Movement Logs | Yes | No | No | Yes |
| Supplier orders | No | No | Own assigned supplier requests only | Yes |
| Notifications | Own/authenticated | Own/authenticated | Own/authenticated | Yes |
| Audit logs read | Yes | No | No | Yes |

## Common IDs Used in Examples

```json
{
  "user_id": "64f000000000000000000001",
  "warehouse_id": "64f000000000000000000002",
  "product_id": "64f000000000000000000003",
  "order_id": "64f000000000000000000004",
  "supplier_id": "64f000000000000000000005",
  "movement_id": "64f000000000000000000006"
}
```

## Health

### API Health
Method: `GET`  
URL: `/api/health`  
Auth: No  
Description: Confirms backend is running.

Success Response:

```json
{
  "status": "ok",
  "service": "MilStock API"
}
```

Testing Notes:
- Use as a smoke test before authenticated requests.

### Root
Method: `GET`  
URL: `/`  
Auth: No  
Description: Root service status.

## Auth APIs

### Register
Method: `POST`  
URL: `/api/auth/register`  
Auth: No  
Allowed roles: Public  
Description: Creates a new user and returns a token. Role defaults to `unit` if omitted.

Request Body:

```json
{
  "name": "Unit User",
  "email": "unit@milstock.local",
  "password": "Password123!",
  "phone": "+966550000000",
  "military_number": "EMP-001",
  "role": "unit"
}
```

Success Response:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "_id": "64f000000000000000000001",
    "name": "Unit User",
    "email": "unit@milstock.local",
    "role": "unit",
    "status": "active",
    "assigned_warehouse": null
  },
  "data": {}
}
```

Testing Notes:
- Test duplicate email.
- Test invalid email.
- Test short password.

### Login
Method: `POST`  
URL: `/api/auth/login`  
Auth: No  
Allowed roles: Public  
Description: Authenticates a user and returns JWT plus sanitized user data.

Request Body:

```json
{
  "email": "admin@milstock.local",
  "password": "Password123!"
}
```

Success Response:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "_id": "64f000000000000000000001",
    "name": "Admin",
    "email": "admin@milstock.local",
    "role": "admin",
    "status": "active",
    "assigned_warehouse": null
  },
  "data": {}
}
```

Testing Notes:
- Test invalid password.
- Test missing email/password.
- Test role-based mobile navigation from `user.role`.

### Current User
Method: `GET`  
URL: `/api/auth/me`  
Auth: Yes  
Allowed roles: `admin`, `unit`, `supplier`  
Description: Returns the currently authenticated user.

Success Response:

```json
{
  "success": true,
  "user": {
    "_id": "64f000000000000000000001",
    "name": "Admin",
    "email": "admin@milstock.local",
    "role": "admin",
    "assigned_warehouse": {
      "_id": "64f000000000000000000002",
      "name": "Dry Goods Warehouse",
      "location": "Main Storage Zone A"
    }
  },
  "data": {}
}
```

## Users APIs

Base path: `/api/users`

### Get Users
Method: `GET`  
URL: `/api/users`  
Auth: Yes  
Allowed roles: `admin`; authenticated users may call `?role=supplier` for active supplier list.  
Query params: `role`, `status`, other direct model fields.

Example:

```http
GET /api/users?role=supplier&status=active
```

Success Response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "64f000000000000000000005",
      "name": "Fresh Food Supplier",
      "email": "supplier.food@milstock.local",
      "role": "supplier",
      "status": "active"
    }
  ]
}
```

Mobile Notes:
- Use `GET /api/users?role=supplier&status=active` if supplier users are the source of the Supplier Request dropdown.

Testing Notes:
- Non-admin access without `role=supplier` should be `403`.

### Create User
Method: `POST`  
URL: `/api/users`  
Auth: Yes  
Allowed roles: `admin`  
Description: Creates admin, unit, or supplier user.

Request Body:

```json
{
  "name": "Cold Kitchen",
  "email": "cold.kitchen@milstock.local",
  "password": "Password123!",
  "phone": "+966550000001",
  "military_number": "UNIT-001",
  "role": "unit",
  "status": "active",
  "assigned_warehouse": "64f000000000000000000002"
}
```

Notes:
- `assigned_warehouse` is required for `unit`.
- `assigned_warehouse` can be null for `admin` and `supplier`.

### Get User By ID
Method: `GET`  
URL: `/api/users/:id`  
Auth: Yes  
Allowed roles: `admin`

### Update User
Method: `PUT` or `PATCH`  
URL: `/api/users/:id`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "name": "Updated Unit User",
  "role": "unit",
  "assigned_warehouse": "64f000000000000000000002",
  "status": "active"
}
```

### Delete User
Method: `DELETE`  
URL: `/api/users/:id`  
Auth: Yes  
Allowed roles: `admin`  
Success: `204 No Content`

### Activate / Deactivate User
Method: `PATCH`  
URL: `/api/users/:id/status`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "status": "inactive"
}
```

### Reset User Password
Method: `PATCH`  
URL: `/api/users/:id/password`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "password": "Password123!"
}
```

## Products / Inventory APIs

Base path: `/api/products`

### Get Products
Method: `GET`  
URL: `/api/products`  
Auth: Yes  
Allowed roles: authenticated users, with warehouse scoping where applicable.  
Query params: direct product fields such as `warehouse_id`, `category`, `status`.

Success Response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "64f000000000000000000003",
      "name": "Bread",
      "unit": "piece",
      "category": "Food",
      "quantity": 120,
      "alert_settings": {
        "low_stock_threshold": 50,
        "critical_stock_threshold": 10,
        "expiration_warning_days": 30,
        "critical_expiration_days": 7
      }
    }
  ]
}
```

### Create Product
Method: `POST`  
URL: `/api/products`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "name": "Bread",
  "quantity": 100,
  "unit": "piece",
  "category": "Food",
  "min_quantity": 20,
  "warehouse_id": "64f000000000000000000002",
  "expiry_date": "2026-12-31T00:00:00.000Z"
}
```

### Get Product By ID
Method: `GET`  
URL: `/api/products/:id`  
Auth: Yes

### Update Product
Method: `PUT`  
URL: `/api/products/:id`  
Auth: Yes  
Allowed roles: `admin`

### Delete Product
Method: `DELETE`  
URL: `/api/products/:id`  
Auth: Yes  
Allowed roles: `admin`

### Get Product Alert Settings
Method: `GET`  
URL: `/api/products/:id/alert-settings`  
Auth: Yes  
Allowed roles: authenticated users  
Description: Returns product-specific stock and expiration thresholds.

Success Response:

```json
{
  "success": true,
  "data": {
    "product_id": "64f000000000000000000003",
    "product_name": "Bread",
    "unit": "piece",
    "low_stock_threshold": 50,
    "critical_stock_threshold": 10,
    "expiration_warning_days": 30,
    "critical_expiration_days": 7
  }
}
```

### Update Product Alert Settings
Method: `PATCH`  
URL: `/api/products/:id/alert-settings`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "low_stock_threshold": 50,
  "critical_stock_threshold": 10,
  "expiration_warning_days": 30,
  "critical_expiration_days": 7
}
```

Validation:
- Values cannot be negative.
- `critical_stock_threshold <= low_stock_threshold`.
- `critical_expiration_days <= expiration_warning_days`.

Testing Notes:
- Confirm inventory and warehouse dashboards use product-specific thresholds, not global percentages.

## Product Warehouse Stock APIs

Canonical base path: `/api/product-warehouses`  
Alias: `/api/inventory/product-warehouses`

### List Product Warehouse Rows
Method: `GET`  
URL: `/api/product-warehouses`  
Auth: Yes  
Query params: `product_id`, `warehouse_id`

### Create Product Warehouse Row
Method: `POST`  
URL: `/api/product-warehouses`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "product_id": "64f000000000000000000003",
  "warehouse_id": "64f000000000000000000002",
  "quantity": 100
}
```

### Get / Update / Delete Product Warehouse Row
Methods: `GET`, `PUT`, `DELETE`  
URL: `/api/product-warehouses/:id`  
Auth: Yes  
Allowed roles: `admin` for update/delete.

## Warehouses APIs

Base path: `/api/warehouses`

### Get Warehouses
Method: `GET`  
URL: `/api/warehouses`  
Auth: Yes  
Allowed roles: authenticated users  
Query params: `status`, `name`, `code`

Success Response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "64f000000000000000000002",
      "name": "Dry Goods Warehouse",
      "code": "WH-DRY",
      "location": "Main Storage Zone A",
      "capacity": 50000,
      "status": "active"
    }
  ]
}
```

### Create Warehouse
Method: `POST`  
URL: `/api/warehouses`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "name": "Cold Storage Warehouse",
  "code": "WH-COLD",
  "location": "Refrigerated Zone B",
  "capacity": 20000,
  "status": "active",
  "user_id": "64f000000000000000000001"
}
```

### Get Warehouse By ID
Method: `GET`  
URL: `/api/warehouses/:id`  
Auth: Yes

### Update Warehouse
Method: `PUT`  
URL: `/api/warehouses/:id`  
Auth: Yes  
Allowed roles: `admin`

### Delete Warehouse
Method: `DELETE`  
URL: `/api/warehouses/:id`  
Auth: Yes  
Allowed roles: `admin`

### Warehouse Dashboard
Method: `GET`  
URL: `/api/warehouses/:id/dashboard`  
Auth: Yes  
Allowed roles: `admin`; `unit` only for assigned warehouse; `supplier` forbidden.  
Description: Returns warehouse-scoped stats, stock distribution, inventory, movements, requests, low stock, and expiring items.

Success Response:

```json
{
  "success": true,
  "data": {
    "warehouse": {
      "_id": "64f000000000000000000002",
      "name": "Cold Storage Warehouse",
      "location": "Refrigerated Zone B",
      "manager": "Warehouse Supervisor",
      "capacity": 20000,
      "status": "active"
    },
    "stats": {
      "totalItems": 120,
      "totalQuantity": 1910,
      "lowStockItems": 5,
      "expiringSoonItems": 3,
      "pendingRequests": 4,
      "completedMovements": 18,
      "capacityUtilization": 38
    },
    "stockDistribution": [],
    "inventory": [],
    "recentMovements": [],
    "recentRequests": [],
    "expiringItems": [],
    "lowStockItems": []
  }
}
```

Testing Notes:
- Unit user requesting another warehouse dashboard should receive `403`.
- Supplier user should receive `403`.

## Suppliers APIs

Base path: `/api/suppliers`

### Get Active Supplier Users
Method: `GET`  
URL: `/api/suppliers/users`  
Auth: Yes  
Allowed roles: authenticated users  
Description: Returns active users with role `supplier`.

Alternative:

```http
GET /api/users?role=supplier&status=active
```

### Get Supplier Records
Method: `GET`  
URL: `/api/suppliers`  
Auth: Yes  
Allowed roles: authenticated users  
Description: Returns active supplier business records from the suppliers collection.

### Create Supplier Record
Method: `POST`  
URL: `/api/suppliers`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "name": "Fresh Food Supplier",
  "code": "SUP-001",
  "email": "supplier.food@milstock.local",
  "phone": "+966550010001",
  "category": "Food",
  "status": "active"
}
```

### Get / Update / Delete Supplier Record
Methods: `GET`, `PUT`, `DELETE`  
URL: `/api/suppliers/:id`  
Auth: Yes  
Allowed roles: `admin` for update/delete.

## Requests / Orders APIs

Base path: `/api/orders`

### Get Orders
Method: `GET`  
URL: `/api/orders`  
Auth: Yes  
Allowed roles: `admin`, `unit`, `supplier` by authenticated route; data is scoped by warehouse utilities where supported.  
Query params: `request_type`, `status`, `source_warehouse`, `destination_warehouse`, `supplier_id`.

### Create Request
Method: `POST`  
URL: `/api/orders`  
Auth: Yes  
Allowed roles: `admin`, `unit`  
Description: Creates either a warehouse request or supplier request. Unit users automatically use their assigned warehouse as destination.

Warehouse Request Body:

```json
{
  "request_type": "warehouse_request",
  "source_warehouse": "64f000000000000000000002",
  "destination_warehouse": "64f000000000000000000009",
  "items": [
    {
      "product_id": "64f000000000000000000003",
      "quantity": 10
    }
  ],
  "notes": "Need stock for kitchen"
}
```

Supplier Request Body:

```json
{
  "request_type": "supplier_request",
  "supplier_id": "64f000000000000000000005",
  "destination_warehouse": "64f000000000000000000002",
  "items": [
    {
      "product_id": "64f000000000000000000003",
      "quantity": 10
    }
  ],
  "notes": "Please deliver this week"
}
```

Notes:
- Backend calculates `unit_price` and `total_price` from product data.
- Warehouse requests start as `pending`; stock is not moved on create.
- Supplier requests start as `pending`.

### Get Order By ID
Method: `GET`  
URL: `/api/orders/:id`  
Auth: Yes

### Update Order
Method: `PUT`  
URL: `/api/orders/:id`  
Auth: Yes  
Allowed roles: `admin`  
Notes:
- Warehouse transfer completion is blocked here; use Movement Logs completion endpoint.

### Delete Order
Method: `DELETE`  
URL: `/api/orders/:id`  
Auth: Yes  
Allowed roles: `admin`

### Admin Update Order Status
Method: `PATCH`  
URL: `/api/orders/:id/status`  
Auth: Yes  
Allowed roles: `admin`

Request Body:

```json
{
  "status": "approved",
  "note": "Approved by admin"
}
```

### Admin Approve / Reject Warehouse Request
Method: `PATCH`  
URL: `/api/orders/:id/admin-decision`  
Auth: Yes  
Allowed roles: `admin`  
Description: Approves or rejects pending warehouse requests. Approval creates pending Movement Logs records but does not change stock.

Request Body:

```json
{
  "decision": "approve",
  "note": "Approved for transfer"
}
```

Success Response:

```json
{
  "success": true,
  "data": {
    "_id": "64f000000000000000000004",
    "request_type": "warehouse_request",
    "status": "approved"
  },
  "movements": [
    {
      "_id": "64f000000000000000000006",
      "order_id": "64f000000000000000000004",
      "status": "pending",
      "movement_type": "warehouse_transfer"
    }
  ]
}
```

Testing Notes:
- Reject should not create movement rows.
- Approve should not change source or destination stock.
- Only `pending` warehouse requests can use this endpoint.

### Get Order Status Logs
Method: `GET`  
URL: `/api/orders/:id/status-logs`  
Auth: Yes  
Allowed roles: users who can access the order.

## Supplier Order APIs

Canonical base path: `/api/supplier`  
Compatibility alias: `/api/providers`

### Get My Supplier Orders
Method: `GET`  
URL: `/api/supplier/orders`  
Auth: Yes  
Allowed roles: `supplier`  
Description: Returns supplier requests assigned to the current supplier user.

### Get My Supplier Order By ID
Method: `GET`  
URL: `/api/supplier/orders/:id`  
Auth: Yes  
Allowed roles: `supplier`

### Update Supplier Order Status
Method: `PATCH`  
URL: `/api/supplier/orders/:id/status`  
Auth: Yes  
Allowed roles: `supplier`

Request Body:

```json
{
  "status": "accepted",
  "note": "Order accepted"
}
```

Allowed transitions:
- `pending -> accepted`
- `pending -> rejected`
- `accepted -> in_delivery`
- `in_delivery -> delivered`

Testing Notes:
- Supplier cannot access orders assigned to another supplier.
- Supplier cannot update warehouse requests.

## Order Items APIs

Canonical base path: `/api/order-items`  
Alias: `/api/orders/items`

### Get Order Items
Method: `GET`  
URL: `/api/order-items`  
Auth: Yes  
Query params: `order_id`, `product_id`

### Create Order Item
Method: `POST`  
URL: `/api/order-items`  
Auth: Yes

Request Body:

```json
{
  "order_id": "64f000000000000000000004",
  "product_id": "64f000000000000000000003",
  "quantity": 10,
  "unit_price": 5,
  "total_price": 50
}
```

### Get / Update / Delete Order Item
Methods: `GET`, `PUT`, `DELETE`  
URL: `/api/order-items/:id`  
Auth: Yes  
Allowed roles: `admin` for update/delete.

## Movement Logs APIs

Canonical base path: `/api/movements`  
Alias: `/api/inventory`

### Get Movement Logs
Method: `GET`  
URL: `/api/movements`  
Auth: Yes  
Query params: `status`, `movement_type`, `order_id`, `from_warehouse`, `to_warehouse`, `product_id`

Example:

```http
GET /api/movements?status=pending&movement_type=warehouse_transfer
```

### Create Movement
Method: `POST`  
URL: `/api/movements`  
Auth: Yes  
Allowed roles: `admin`

### Get Movement By ID
Method: `GET`  
URL: `/api/movements/:id`  
Auth: Yes

### Update Movement
Method: `PUT`  
URL: `/api/movements/:id`  
Auth: Yes  
Allowed roles: `admin`

### Delete Movement
Method: `DELETE`  
URL: `/api/movements/:id`  
Auth: Yes  
Allowed roles: `admin`

### Complete Warehouse Transfer
Method: `PATCH`  
URL: `/api/movements/complete-transfer/:orderId`  
Alias: `/api/inventory/complete-transfer/:orderId`  
Auth: Yes  
Allowed roles: `admin`  
Description: Completes approved warehouse transfer from Movement Logs. This is the only endpoint that moves stock for warehouse requests.

Request Body:

```json
{
  "note": "Transfer completed from movement logs"
}
```

Rules:
- Order must be `warehouse_request` or legacy `warehouse_transfer`.
- Order status must be `approved` or `in_transfer`.
- Pending movement rows must exist.
- Source warehouse must have enough stock.
- Uses MongoDB transaction.
- Blocks double completion with `Movement already completed`.

Success Response:

```json
{
  "success": true,
  "data": {
    "_id": "64f000000000000000000004",
    "status": "completed",
    "request_type": "warehouse_request"
  }
}
```

Testing Notes:
- Verify source stock decreases and destination stock increases only after this call.
- Repeat the same call; expect error and no second stock movement.

## Notifications APIs

Base path: `/api/notifications`

### Get Notifications
Method: `GET`  
URL: `/api/notifications`  
Auth: Yes  
Query params: `user_id`, `type`, `read`, direct model fields.

### Create Notification
Method: `POST`  
URL: `/api/notifications`  
Auth: Yes

Request Body:

```json
{
  "title": "New warehouse request",
  "message": "A new warehouse request is pending approval.",
  "type": "warehouse_request",
  "user_id": "64f000000000000000000001",
  "metadata": {
    "order_id": "64f000000000000000000004"
  }
}
```

### Expiration Notifications
Method: `GET`  
URLs: `/api/notifications/expiration`, `/api/notifications/expiration/check`  
Auth: Yes  
Description: Returns or generates expiration-related notifications.

### Mark All Read
Method: `PATCH`  
URL: `/api/notifications/read-all`  
Auth: Yes

### Mark One Read
Method: `PATCH`  
URL: `/api/notifications/:id/read`  
Auth: Yes

### Get / Update / Delete Notification
Methods: `GET`, `PUT`, `DELETE`  
URL: `/api/notifications/:id`  
Auth: Yes

## Audit Logs APIs

Base path: `/api/audit-logs`

### Get Audit Logs
Method: `GET`  
URL: `/api/audit-logs`  
Auth: Yes  
Allowed roles: `admin`  
Query params: `user_id`, `module`, `action`, date fields/direct model filters.

### Create Frontend Audit Log
Method: `POST`  
URL: `/api/audit-logs`  
Auth: Yes  
Allowed roles: authenticated users  
Description: Allows frontend to record an audit log with required `action` and `module`.

Request Body:

```json
{
  "action": "view_dashboard",
  "module": "dashboard",
  "description": "User opened dashboard"
}
```

## Consumption APIs

Base path: `/api/consumption`

### List Consumption Records
Method: `GET`  
URL: `/api/consumption`  
Auth: Yes

### Create Consumption Record
Method: `POST`  
URL: `/api/consumption`  
Auth: Yes

### Get / Update / Delete Consumption Record
Methods: `GET`, `PUT`, `DELETE`  
URL: `/api/consumption/:id`  
Auth: Yes

## Compatibility Aliases

| Canonical | Alias | Notes |
| --- | --- | --- |
| `/api/supplier/orders` | `/api/providers/orders` | Existing provider naming retained for backward compatibility. UI/business term should be supplier. |
| `/api/supplier/orders/:id` | `/api/providers/orders/:id` | Supplier role only. |
| `/api/supplier/orders/:id/status` | `/api/providers/orders/:id/status` | Supplier role only. |
| `/api/suppliers/users` | `/api/providers` | Returns active supplier users. |
| `/api/order-items` | `/api/orders/items` | Same router. |
| `/api/product-warehouses` | `/api/inventory/product-warehouses` | Same router. |
| `/api/movements` | `/api/inventory` | Same inventory movement router. |

## Missing / Needs Implementation

These were requested in product requirements but are not present as dedicated routes in the inspected backend:

| Requested API | Current Status / Alternative |
| --- | --- |
| `/api/settings` system settings group | Not mounted. Product thresholds are implemented at `/api/products/:id/alert-settings`. |
| User notification preferences endpoint | Not present. Notifications CRUD exists. |
| Dedicated nested order items route `/api/orders/:id/items` | Not present. Use `/api/order-items?order_id=:id`. |
| Dedicated pending movements route `/api/movements/pending` | Not present. Use `/api/movements?status=pending&movement_type=warehouse_transfer`. |
| Dedicated movement history route `/api/movements/history` | Not present. Use `/api/movements?status=completed`. |
| Explicit pagination metadata | CRUD list endpoints return `{ success, count, data }`; `page` and `limit` query fields are stripped and not applied. |

## Mobile Integration Notes

Base URL:
- Local development: `http://localhost:5001/api`
- Production: `[ADD_RENDER_BACKEND_URL_HERE]/api`

JWT storage:
- Store the token in secure device storage, such as Keychain/Keystore-backed storage.
- Do not store tokens in plain AsyncStorage if avoidable.

Required headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Login flow:
1. Call `POST /api/auth/login`.
2. Save `token`.
3. Save `user.role` and `user.assigned_warehouse`.
4. Navigate by role:
   - `admin` -> admin dashboard
   - `unit` -> unit dashboard
   - `supplier` -> supplier dashboard

Role-based navigation:
- Admin can browse all warehouses, users, requests, movement logs, settings, notifications, and audit logs.
- Unit users should show their assigned warehouse and avoid exposing selectors for other warehouses.
- Supplier users should show only `/api/supplier/orders` data.

Dates and time:
- MongoDB timestamps are returned as ISO strings.
- Render dates in the user locale. Keep ISO strings in API payloads.

Errors:
- Treat `401` as logout/reauth required.
- Treat `403` as role or warehouse-scope denial.
- Display `message` from error response when available.

Offline considerations:
- Cache read-only lists such as warehouses and products with a refresh timestamp.
- Do not queue stock-changing operations offline unless the product owner approves conflict rules.

Arabic/English:
- API fields are English keys.
- UI should translate labels client-side.

## API Testing Checklist

Smoke tests:
- `GET /api/health` returns OK.
- `POST /api/auth/login` returns token.
- `GET /api/auth/me` works with token.

Auth tests:
- Missing token returns `401`.
- Invalid token returns `401`.
- Wrong password returns `401`.
- Role redirects are based on `user.role`.

Users:
- Admin creates admin/unit/supplier.
- Unit without assigned warehouse is rejected.
- Duplicate email or military number returns `409`.
- Non-admin cannot access user management.

Products and alert settings:
- Admin creates product.
- Product alert settings save and reload.
- Negative thresholds fail.
- Critical stock threshold greater than low threshold fails.
- Critical expiration greater than warning expiration fails.

Warehouses:
- Active warehouses load.
- Warehouse dashboard filters by selected warehouse.
- Unit can access only assigned warehouse dashboard.
- Supplier cannot access warehouse dashboard.

Requests:
- Unit creates warehouse request.
- Unit creates supplier request.
- Supplier request calculates prices from product data.
- Warehouse request source cannot equal destination.

Warehouse transfer workflow:
1. Create warehouse request.
2. Confirm stock does not change.
3. Admin approves request.
4. Confirm pending movement rows exist.
5. Confirm stock still does not change.
6. Admin completes transfer from `/api/movements/complete-transfer/:orderId`.
7. Confirm source stock decreases and destination stock increases.
8. Repeat completion; expect `Movement already completed`.
9. Test insufficient stock; expect no partial movement.

Supplier workflow:
- Supplier sees only own orders.
- Supplier accepts.
- Supplier marks `in_delivery`.
- Supplier marks `delivered`.
- Supplier rejects another pending order.
- Supplier cannot skip `pending -> delivered`.

Notifications:
- Warehouse request creates admin notification.
- Approval/rejection notifies requester.
- Supplier status changes notify requester.
- Mark one/all read.

Audit logs:
- Admin can list audit logs.
- Non-admin cannot list audit logs.
- Sensitive data such as passwords should not appear.

Basic performance:
- List endpoints should respond quickly with seeded data.
- Dashboard endpoints should be tested with larger inventory and movement data volumes.
