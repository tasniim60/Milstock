import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputPath = path.resolve("MilStock_Test_Cases.xlsx");
const workbook = Workbook.create();

const today = "2026-06-09";
const brand = {
  dark: "#2E3A24",
  green: "#6A7B4D",
  light: "#ECEEE2",
  red: "#D4183D",
  amber: "#C9A961",
  blue: "#4B5B3A",
  border: "#D7DBC6"
};

const modules = [
  "Authentication",
  "Dashboard",
  "Inventory",
  "Add Item",
  "Edit Item",
  "Delete Item",
  "Warehouse",
  "Warehouse Transfer",
  "Requests",
  "Request Details",
  "Approve Request",
  "Reject Request",
  "Delivered Request",
  "User Management",
  "Add User",
  "Edit User",
  "Delete User",
  "Activate User",
  "Deactivate User",
  "Reset Password",
  "Notifications",
  "Reports",
  "Export",
  "Settings",
  "Language Switching",
  "Arabic Version",
  "English Version",
  "Mobile Version",
  "Responsive Tables",
  "Search",
  "Filters",
  "CSV Export",
  "Role Management",
  "Admin Actions",
  "API Integration",
  "MongoDB Integration"
];

const moduleDetails = {
  Authentication: ["Login", "JWT session", "Role redirect", "Logout"],
  Dashboard: ["Admin KPIs", "Unit dashboard", "Navigation cards", "Recent activity"],
  Inventory: ["Inventory list", "Item details", "Stock status", "Food category display"],
  "Add Item": ["Create product", "Warehouse dropdown", "Expiration fields", "Validation"],
  "Edit Item": ["Prefilled edit form", "Persist changes", "Date fields", "Warehouse changes"],
  "Delete Item": ["Header delete button", "Confirmation modal", "MongoDB delete", "List navigation"],
  Warehouse: ["Warehouse cards", "Capacity utilization", "Manager display", "Stock distribution"],
  "Warehouse Transfer": ["Inventory movement", "Source/destination", "Stock log", "Data integrity"],
  Requests: ["Requests list", "Filtered requests", "Row navigation", "User/admin routes"],
  "Request Details": ["Real order data", "Order items", "Status history", "Not found state"],
  "Approve Request": ["Admin approve", "Status transition", "Status log", "User restriction"],
  "Reject Request": ["Admin reject", "Cancelled status", "Reason/note", "Audit trail"],
  "Delivered Request": ["Completed status", "Movement logs", "No double apply", "Notification"],
  "User Management": ["Users table", "Actions menu", "Search", "Status badges"],
  "Add User": ["Create user", "Duplicate handling", "Password hashing", "Role selection"],
  "Edit User": ["Load user", "Update profile", "Role/status edit", "Validation"],
  "Delete User": ["Confirm delete", "Prevent self-delete", "Remove row", "MongoDB delete"],
  "Activate User": ["Inactive to active", "Table update", "API persistence", "Feedback"],
  "Deactivate User": ["Active to inactive", "Access impact", "Table update", "Feedback"],
  "Reset Password": ["Password modal", "Minimum length", "Hash password", "No password exposure"],
  Notifications: ["Notification list", "Unread state", "Mark all read", "Export"],
  Reports: ["Analytics cards", "Charts", "CSV reports", "Food-only labels"],
  Export: ["CSV export helper", "Visible rows only", "Empty data", "Large dataset"],
  Settings: ["Settings page", "Profile preferences", "Persistence", "Language display"],
  "Language Switching": ["English route", "Arabic route", "RTL/LTR", "Shared data"],
  "Arabic Version": ["RTL layout", "Arabic labels", "Arabic exports", "Arabic route protection"],
  "English Version": ["LTR layout", "English labels", "English exports", "English route protection"],
  "Mobile Version": ["Mobile nav", "Cards stack", "Buttons wrap", "No horizontal scroll"],
  "Responsive Tables": ["Desktop table", "Mobile cards", "Overflow handling", "Readable columns"],
  Search: ["Safe text matching", "Undefined fields", "Visible result count", "Export after search"],
  Filters: ["Status filter", "Category filter", "Date filter", "Export after filter"],
  "CSV Export": ["UTF-8 BOM", "Arabic Excel support", "Escaping", "Filename date"],
  "Role Management": ["Admin role", "Unit role", "Protected routes", "Forbidden access"],
  "Admin Actions": ["Approve/reject/deliver", "User row menu", "Inventory delete", "Error states"],
  "API Integration": ["Axios/fetch wrapper", "Wrapped responses", "Error messages", "Env base URL"],
  "MongoDB Integration": ["Atlas data", "ObjectId references", "Seed data", "Relationships"]
};

const priorityFor = (moduleName, index) => {
  if (["Authentication", "Inventory", "Requests", "User Management", "Admin Actions", "MongoDB Integration", "Role Management"].includes(moduleName)) return "High";
  return index % 3 === 0 ? "High" : index % 3 === 1 ? "Medium" : "Low";
};

const severityFor = (priority, type) => {
  if (priority === "High") return type === "UI" ? "Major" : "Critical";
  if (priority === "Medium") return "Major";
  return "Minor";
};

const testTypes = ["Functional", "Integration", "UI", "Validation", "Negative", "Security", "Responsive", "Database", "Accessibility", "Performance"];
const testCases = [];
let tc = 1;
for (const moduleName of modules) {
  const features = moduleDetails[moduleName] || ["Core feature"];
  for (let i = 0; i < features.length; i += 1) {
    const type = testTypes[(tc - 1) % testTypes.length];
    const priority = priorityFor(moduleName, i);
    testCases.push([
      `TC-${String(tc).padStart(3, "0")}`,
      moduleName,
      features[i],
      `${type} validation for ${features[i]} in ${moduleName}`,
      "MilStock app is deployed locally or in staging; MongoDB Atlas contains seeded food inventory data; tester has valid Admin and Unit credentials.",
      `1. Login with the required role.\n2. Navigate to ${moduleName}.\n3. Execute ${features[i]} workflow.\n4. Verify UI, API response, database state, and bilingual behavior where applicable.`,
      "Admin: admin@milstock.local / Password123!; Unit: kitchen@milstock.local / Password123!; Food sample: Rice, Pasta, Sugar, Milk, Cheese, Beans.",
      `${features[i]} works correctly, saves/retrieves real MongoDB data, shows meaningful feedback, and does not expose unrelated or fake data.`,
      "",
      priority,
      severityFor(priority, type),
      "Not Run",
      "",
      "",
      ""
    ]);
    tc += 1;
  }
}

const additionalNegative = [
  ["Authentication", "Invalid login", "Submit wrong password", "401 error is shown; user remains logged out."],
  ["Authentication", "Missing token", "Call protected route without Authorization header", "401 Authentication token is required."],
  ["Add User", "Invalid email", "Submit user form with malformed email", "Form/API rejects with validation message."],
  ["Add User", "Duplicate email", "Create user with existing email", "Duplicate is rejected; no duplicate MongoDB document."],
  ["Add Item", "Negative quantity", "Submit product with -5 quantity", "Validation blocks negative stock."],
  ["Add Item", "Invalid expiration date", "Use expiration date before manufacturing date", "Validation or QA defect is recorded if accepted."],
  ["Requests", "Invalid ObjectId", "Open /admin/requests/invalid-id", "Not-found/error state displays without crash."],
  ["Request Details", "Missing order items wrapper", "Return orderItems response wrapped as { data: [] }", "Details page normalizes response and does not crash."],
  ["CSV Export", "Empty export", "Filter table to zero rows and click Export", "No data available to export message appears."],
  ["CSV Export", "Arabic CSV", "Export Arabic page data containing Arabic text", "Excel opens readable UTF-8 Arabic text."],
  ["Role Management", "Unit admin URL", "Unit user opens /admin/users", "403/access denied or redirect occurs."],
  ["Admin Actions", "Double delivered", "Mark completed order as completed again", "No duplicate movement or status log is created."],
  ["Search", "Undefined fields", "Search when row fields are undefined/null", "No JavaScript crash; empty strings used."],
  ["Responsive Tables", "Small mobile viewport", "Open inventory at 360px width", "No horizontal scrolling; cards/buttons wrap."],
  ["MongoDB Integration", "Broken relationship", "Delete referenced supplier then load order", "UI uses fallback values and no crash occurs."],
  ["Security", "Injection attempt", "Submit payload with $ne operator or script tags", "Input is sanitized/rejected; no query bypass or script execution."],
  ["Password Reset", "Short password", "Reset to less than 6 characters", "API returns 400 validation error."],
  ["Notifications", "Mark read no notifications", "Click mark all read with empty list", "No crash; empty state remains stable."],
  ["Language Switching", "Switch EN to AR", "Navigate between /login and /ar/login", "Layout switches LTR/RTL and content remains accessible."],
  ["API Integration", "Server down", "Stop backend and load dashboard", "UI shows clear failed fetch/loading error states."]
];
for (const row of additionalNegative) {
  const priority = row[0] === "Security" || row[0] === "Authentication" ? "High" : "Medium";
  testCases.push([
    `TC-${String(tc).padStart(3, "0")}`,
    row[0],
    row[1],
    row[2],
    "MilStock frontend and backend are available unless the scenario explicitly tests downtime.",
    `1. Prepare the data/state for ${row[1]}.\n2. Execute the scenario.\n3. Observe UI feedback, API status, and database result.`,
    "Use real MongoDB Atlas test data and seeded food inventory records.",
    row[3],
    "",
    priority,
    severityFor(priority, "Negative"),
    "Not Run",
    "",
    "",
    ""
  ]);
  tc += 1;
}

const endpoints = [
  ["/api/health", "GET", "Public health check", "None", "200 with MilStock API running"],
  ["/", "GET", "Root API metadata", "None", "200 with MilStock API name"],
  ["/api/auth/register", "POST", "Register user", "{ name,email,password,phone,military_number,role }", "201 user without password or validation error"],
  ["/api/auth/login", "POST", "Login user", "{ email,password }", "200 JWT token and user profile"],
  ["/api/auth/me", "GET", "Get current user", "Bearer token", "200 current authenticated user"],
  ["/api/users", "GET", "List users", "Bearer admin token", "200 users array"],
  ["/api/users", "POST", "Create user", "Bearer admin token + user payload", "201 created user without password"],
  ["/api/users/:id", "GET", "Get user by id", "Bearer admin token", "200 user or 404"],
  ["/api/users/:id", "PUT", "Update user", "Bearer admin token + profile payload", "200 updated user"],
  ["/api/users/:id", "PATCH", "Patch user", "Bearer admin token + partial payload", "200 updated user"],
  ["/api/users/:id/status", "PATCH", "Activate/deactivate user", "{ status: active|inactive }", "200 updated status"],
  ["/api/users/:id/password", "PATCH", "Reset password", "{ password }", "200 Password reset successfully"],
  ["/api/users/:id", "DELETE", "Delete user", "Bearer admin token", "204/200 user removed"],
  ["/api/products", "GET", "List products", "Bearer token", "200 products array"],
  ["/api/products", "POST", "Create product", "Bearer admin token + product payload", "201 created product"],
  ["/api/products/:id", "GET", "Get product", "Bearer token", "200 product or 404"],
  ["/api/products/:id", "PUT", "Update product", "Bearer admin token", "200 updated product"],
  ["/api/products/:id", "DELETE", "Delete product", "Bearer admin token", "204/200 product removed"],
  ["/api/warehouses", "GET", "List warehouses", "Bearer token", "200 warehouses array"],
  ["/api/warehouses", "POST", "Create warehouse", "Bearer admin token", "201 created warehouse"],
  ["/api/warehouses/:id", "GET", "Get warehouse", "Bearer token", "200 warehouse or 404"],
  ["/api/warehouses/:id", "PUT", "Update warehouse", "Bearer admin token", "200 updated warehouse"],
  ["/api/warehouses/:id", "DELETE", "Delete warehouse", "Bearer admin token", "204/200 removed"],
  ["/api/suppliers", "GET", "List suppliers", "Bearer token", "200 suppliers array"],
  ["/api/suppliers", "POST", "Create supplier", "Bearer admin token", "201 created supplier"],
  ["/api/suppliers/:id", "GET", "Get supplier", "Bearer token", "200 supplier or 404"],
  ["/api/suppliers/:id", "PUT", "Update supplier", "Bearer admin token", "200 updated supplier"],
  ["/api/suppliers/:id", "DELETE", "Delete supplier", "Bearer admin token", "204/200 removed"],
  ["/api/orders", "GET", "List orders", "Bearer token", "200 orders with populated refs"],
  ["/api/orders", "POST", "Create order", "Bearer token + order payload", "201 created order"],
  ["/api/orders/:id", "GET", "Get order", "Bearer token", "200 order or 404"],
  ["/api/orders/:id/status", "PATCH", "Update status", "{ status,note } with admin token", "200 updated order and status log"],
  ["/api/orders/:id/status-logs", "GET", "Get status logs", "Bearer token", "200 logs sorted newest first"],
  ["/api/order-items", "GET", "List order items", "Bearer token", "200 order items"],
  ["/api/order-items", "POST", "Create order item", "Bearer token", "201 created order item"],
  ["/api/order-items/:id", "GET", "Get order item", "Bearer token", "200 item or 404"],
  ["/api/order-items/:id", "PUT", "Update order item", "Bearer admin token", "200 updated item"],
  ["/api/order-items/:id", "DELETE", "Delete order item", "Bearer admin token", "204/200 removed"],
  ["/api/orders/items", "GET", "Alias order items list", "Bearer token", "200 order items"],
  ["/api/inventory", "GET", "List inventory movements", "Bearer token", "200 movements"],
  ["/api/inventory", "POST", "Create inventory movement", "Bearer admin token", "201 created movement"],
  ["/api/inventory/:id", "GET", "Get movement", "Bearer token", "200 movement or 404"],
  ["/api/inventory/:id", "PUT", "Update movement", "Bearer admin token", "200 updated movement"],
  ["/api/inventory/:id", "DELETE", "Delete movement", "Bearer admin token", "204/200 removed"],
  ["/api/product-warehouses", "GET", "List product warehouse stock", "Bearer token", "200 stock rows"],
  ["/api/product-warehouses", "POST", "Create product warehouse stock", "Bearer admin token", "201 stock row"],
  ["/api/product-warehouses/:id", "GET", "Get stock row", "Bearer token", "200 row or 404"],
  ["/api/product-warehouses/:id", "PUT", "Update stock row", "Bearer admin token", "200 updated row"],
  ["/api/product-warehouses/:id", "DELETE", "Delete stock row", "Bearer admin token", "204/200 removed"],
  ["/api/inventory/product-warehouses", "GET", "Alias stock rows", "Bearer token", "200 stock rows"],
  ["/api/consumption", "GET", "List consumption records", "Bearer token", "200 records"],
  ["/api/consumption", "POST", "Create consumption", "Bearer token", "201 record"],
  ["/api/consumption/:id", "GET", "Get consumption", "Bearer token", "200 record or 404"],
  ["/api/consumption/:id", "PUT", "Update consumption", "Bearer token", "200 updated record"],
  ["/api/consumption/:id", "DELETE", "Delete consumption", "Bearer token", "204/200 removed"],
  ["/api/notifications", "GET", "List notifications", "Bearer token", "200 notifications"],
  ["/api/notifications", "POST", "Create notification", "Bearer token", "201 notification"],
  ["/api/notifications/:id", "GET", "Get notification", "Bearer token", "200 notification or 404"],
  ["/api/notifications/:id", "PUT", "Update notification", "Bearer token", "200 updated notification"],
  ["/api/notifications/:id", "DELETE", "Delete notification", "Bearer token", "204/200 removed"]
];

const apiRows = [];
let apiId = 1;
for (const endpoint of endpoints) {
  apiRows.push([`API-${String(apiId).padStart(3, "0")}`, endpoint[0], endpoint[1], endpoint[2], endpoint[3], endpoint[4], "", "Not Run", endpoint[1] === "DELETE" || endpoint[0].includes("status") ? "High" : "Medium"]);
  apiId += 1;
}
for (const statusCase of [
  ["400 Bad Request", "Send invalid/missing required body", "400 validation error"],
  ["401 Unauthorized", "Remove Authorization header", "401 token required"],
  ["403 Forbidden", "Use Unit token for admin-only operation", "403 forbidden"],
  ["404 Not Found", "Use valid-format but unknown ObjectId", "404 not found"],
  ["409 Conflict", "Submit duplicate email or military_number", "409 duplicate conflict where applicable"],
  ["500 Server Error", "Simulate database/service failure in test environment", "500 structured error response"]
]) {
  apiRows.push([`API-${String(apiId).padStart(3, "0")}`, "/api/*", "ANY", statusCase[0], statusCase[1], statusCase[2], "", "Not Run", statusCase[0].startsWith("500") ? "High" : "Medium"]);
  apiId += 1;
}

const bugRows = [
  ["BUG-001", "Request details fails when orderItems response is wrapped object", "Requests", "Critical", "High", "Chrome desktop + Render API", "Open request details when /api/order-items returns { data: [...] }", "Details page loads items", "Page error: filter is not a function", "Open", "Frontend"],
  ["BUG-002", "Reset password endpoint missing", "User Management", "Critical", "High", "API + MongoDB Atlas", "Admin opens Reset Password and submits", "PATCH /api/users/:id/password succeeds", "Route not found", "Resolved", "Backend"],
  ["BUG-003", "Arabic CSV opens as unreadable text in Excel", "CSV Export", "Major", "High", "Arabic page + Excel", "Export Arabic inventory and open in Excel", "Arabic readable", "Text appears corrupted if BOM missing", "Resolved", "Frontend"],
  ["BUG-004", "Quick Actions duplicates item details header actions", "Inventory", "Minor", "Low", "Desktop", "Open item details", "Only header actions are visible", "Duplicate action card consumes width", "Resolved", "Frontend"],
  ["BUG-005", "Unit user can see admin action buttons", "Role Management", "Critical", "High", "Unit login", "Open request details as Unit", "No approve/reject/deliver buttons", "Admin actions visible", "Open", "Frontend"],
  ["BUG-006", "Negative quantity accepted in product create", "Inventory", "Major", "High", "API", "POST product quantity -1", "400 validation error", "Product saved with invalid stock", "Open", "Backend"],
  ["BUG-007", "Mobile user table scrolls horizontally", "Responsive Tables", "Major", "Medium", "Mobile 360px", "Open users page", "Cards/scroll area usable", "Horizontal overflow", "Open", "Frontend"],
  ["BUG-008", "Completed order can create duplicate movement logs", "Delivered Request", "Critical", "High", "Admin order details", "Click Mark as Delivered twice", "Second action is blocked/no duplicate log", "Duplicate movement created", "Open", "Backend"]
];

const regressionRows = modules.map((moduleName, index) => [
  `REG-${String(index + 1).padStart(3, "0")}`,
  moduleName,
  (moduleDetails[moduleName] || ["Core workflow"])[0],
  "Not Run",
  priorityFor(moduleName, index),
  `Re-run after every release touching ${moduleName}, API routes, MongoDB schema, or bilingual UI.`
]);

const smokeRows = [
  ["SMK-001", "App loads", "Open Netlify/local URL", "Language selector or login page loads without console crash", "Not Run"],
  ["SMK-002", "English login", "Login as admin from /login", "Admin dashboard opens", "Not Run"],
  ["SMK-003", "Arabic login", "Login from /ar/login", "Arabic dashboard opens in RTL", "Not Run"],
  ["SMK-004", "Backend health", "GET /api/health", "200 MilStock API running", "Not Run"],
  ["SMK-005", "Inventory list", "Open /admin/inventory", "MongoDB food products load", "Not Run"],
  ["SMK-006", "Add item", "Create Rice product with warehouse", "Product appears in inventory", "Not Run"],
  ["SMK-007", "Item details", "Open created product details", "Stock, warehouse, expiration, details display", "Not Run"],
  ["SMK-008", "Requests list", "Open /admin/requests", "Rows are clickable and show real orders", "Not Run"],
  ["SMK-009", "Request details", "Open a request", "Real order and items display", "Not Run"],
  ["SMK-010", "Approve request", "Admin approves pending request", "Status changes to approved", "Not Run"],
  ["SMK-011", "User management", "Open /admin/users", "Users table loads with row actions", "Not Run"],
  ["SMK-012", "Add user", "Create a Unit user", "User saved in MongoDB", "Not Run"],
  ["SMK-013", "Reset password", "Reset test user password", "Login with new password works", "Not Run"],
  ["SMK-014", "CSV export", "Search inventory and export", "CSV contains visible rows only", "Not Run"],
  ["SMK-015", "Mobile nav", "Open app at 390px", "Navigation is usable", "Not Run"]
];

const uatRows = [
  ["UAT-001", "Admin adds food item to warehouse", "Admin can create Rice/Pasta item with location, dates, batch, notes; item appears in inventory.", "", "Not Run"],
  ["UAT-002", "Kitchen user creates supply request", "Unit user selects supplier/products and creates order linked to MongoDB.", "", "Not Run"],
  ["UAT-003", "Admin approves request", "Admin updates status to approved and status log is created.", "", "Not Run"],
  ["UAT-004", "Admin rejects request", "Admin updates status to cancelled/rejected and user sees status.", "", "Not Run"],
  ["UAT-005", "Admin marks request delivered", "Order status becomes completed and movement/status logs are recorded without duplication.", "", "Not Run"],
  ["UAT-006", "Warehouse manager reviews stock", "Warehouse cards show capacity, stock distribution, alerts, and food categories.", "", "Not Run"],
  ["UAT-007", "Admin exports filtered inventory", "CSV file contains only filtered visible rows and opens in Excel.", "", "Not Run"],
  ["UAT-008", "Arabic user uses full flow", "Arabic RTL login, inventory, request details, notifications, and export work correctly.", "", "Not Run"],
  ["UAT-009", "Admin manages users", "Add/edit/deactivate/reset password/delete flows persist in MongoDB.", "", "Not Run"],
  ["UAT-010", "Food domain consistency", "No medicine, weapons, military item examples, or dangerous substances appear in UI or seed data.", "", "Not Run"]
];

const responsivePages = [
  "Language Select", "Login", "Admin Dashboard", "User Dashboard", "Inventory", "Add Item", "Item Details", "Movement Logs", "Expiration Monitor", "Warehouse Locations", "Requests", "Request Details", "Notifications", "Reports", "Audit Logs", "User Management", "Add User", "Edit User", "Settings", "Profile"
].map((page) => [page, "Verify 1440px desktop layout", "Verify 1024px laptop layout", "Verify 768px tablet layout", "Verify 360/390px mobile layout", "RTL labels/icons align correctly", "LTR labels/icons align correctly", "Not Run"]);

const securityRows = [
  ["SEC-001", "Protected route without token", "401 error and no data leakage", "", "Not Run"],
  ["SEC-002", "Unit user accesses admin users API", "403 forbidden", "", "Not Run"],
  ["SEC-003", "Admin-only product create with Unit token", "403 forbidden", "", "Not Run"],
  ["SEC-004", "Password reset hashes password", "MongoDB password is hashed and not returned", "", "Not Run"],
  ["SEC-005", "Login response excludes password", "No password/password hash in response", "", "Not Run"],
  ["SEC-006", "Invalid JWT", "401 invalid token", "", "Not Run"],
  ["SEC-007", "Expired/removed token", "Session rejected and user redirected", "", "Not Run"],
  ["SEC-008", "Duplicate email attack", "Conflict/validation prevents duplicate user", "", "Not Run"],
  ["SEC-009", "NoSQL injection in login", "No authentication bypass", "", "Not Run"],
  ["SEC-010", "XSS in product notes", "Script is escaped and not executed", "", "Not Run"],
  ["SEC-011", "Invalid ObjectId probing", "404/400 without stack trace", "", "Not Run"],
  ["SEC-012", "CORS origin", "Only allowed frontend origin can send credentials", "", "Not Run"],
  ["SEC-013", "Role tampering in localStorage", "Backend authorization still protects admin endpoints", "", "Not Run"],
  ["SEC-014", "Self-delete admin prevention", "Current admin cannot delete own account", "", "Not Run"],
  ["SEC-015", "Rate/rapid login attempts", "No crash; ideally throttled or monitored", "", "Not Run"]
];

const collections = [
  "Users", "Products", "Warehouses", "ProductWarehouse", "Suppliers", "Orders", "OrderItems", "InventoryMovement", "Consumption", "Notifications", "OrderStatusLog", "Settings"
];
const dbRows = [];
for (const collection of collections) {
  for (const operation of ["Insert", "Update", "Delete", "Relationships", "Data Integrity"]) {
    dbRows.push([
      collection,
      operation,
      `${operation} operation on ${collection} should preserve schema validation, ObjectId references, timestamps, and food inventory business rules.`,
      "",
      "Not Run"
    ]);
  }
}

function getColName(index) {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function setColumnWidths(sheet, headers, rows) {
  headers.forEach((header, col) => {
    const values = rows.slice(0, 100).map((row) => row[col]);
    const maxLen = Math.max(String(header).length, ...values.map((value) => String(value ?? "").split("\n").reduce((m, line) => Math.max(m, line.length), 0)));
    const px = Math.min(Math.max(maxLen * 7 + 28, 90), col <= 3 ? 260 : 420);
    sheet.getRangeByIndexes(0, col, Math.max(rows.length + 1, 2), 1).format.columnWidthPx = px;
  });
}

function applyPriorityColor(sheet, priorityColIndex, rowsLength) {
  if (rowsLength < 1) return;
  const col = getColName(priorityColIndex);
  const range = sheet.getRange(`${col}2:${col}${rowsLength + 1}`);
  range.conditionalFormats.add("containsText", { text: "High", format: { fill: brand.red, font: { color: "#FFFFFF", bold: true } } });
  range.conditionalFormats.add("containsText", { text: "Medium", format: { fill: brand.amber, font: { color: "#1F2937", bold: true } } });
  range.conditionalFormats.add("containsText", { text: "Low", format: { fill: "#CFE3C2", font: { color: brand.dark, bold: true } } });
}

function addSheet(name, headers, rows, options = {}) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const allRows = [headers, ...rows];
  sheet.getRangeByIndexes(0, 0, allRows.length, headers.length).values = allRows;
  const used = sheet.getRangeByIndexes(0, 0, allRows.length, headers.length);
  used.format.wrapText = true;
  used.format.verticalAlignment = "Top";
  used.format.borders = { preset: "all", style: "thin", color: brand.border };
  const headerRange = sheet.getRangeByIndexes(0, 0, 1, headers.length);
  headerRange.format.fill = brand.dark;
  headerRange.format.font = { bold: true, color: "#FFFFFF" };
  headerRange.format.rowHeightPx = 34;
  sheet.freezePanes.freezeRows(1);
  setColumnWidths(sheet, headers, rows);
  const lastCol = getColName(headers.length - 1);
  const tableRange = `A1:${lastCol}${rows.length + 1}`;
  const tableName = name.replace(/[^A-Za-z0-9]/g, "") + "Table";
  const table = sheet.tables.add(tableRange, true, tableName);
  table.style = "TableStyleMedium4";
  table.showFilterButton = true;
  if (options.priorityColumn) {
    const priorityColIndex = headers.indexOf(options.priorityColumn);
    if (priorityColIndex >= 0) applyPriorityColor(sheet, priorityColIndex, rows.length);
  }
  const statusColIndex = headers.indexOf("Status");
  if (statusColIndex >= 0) {
    const col = getColName(statusColIndex);
    const range = sheet.getRange(`${col}2:${col}${rows.length + 1}`);
    range.conditionalFormats.add("containsText", { text: "Pass", format: { fill: "#CFE3C2", font: { color: brand.dark, bold: true } } });
    range.conditionalFormats.add("containsText", { text: "Fail", format: { fill: brand.red, font: { color: "#FFFFFF", bold: true } } });
    range.conditionalFormats.add("containsText", { text: "Blocked", format: { fill: brand.amber, font: { color: "#1F2937", bold: true } } });
  }
  return sheet;
}

addSheet("Test Cases", [
  "Test Case ID", "Module", "Feature", "Scenario", "Preconditions", "Test Steps", "Test Data", "Expected Result", "Actual Result", "Priority", "Severity", "Status", "Tester", "Execution Date", "Comments"
], testCases, { priorityColumn: "Priority" });

addSheet("API Testing", [
  "API ID", "Endpoint", "Method", "Scenario", "Request", "Expected Response", "Actual Response", "Status", "Priority"
], apiRows, { priorityColumn: "Priority" });

addSheet("Bug Report", [
  "Bug ID", "Title", "Module", "Severity", "Priority", "Environment", "Steps", "Expected", "Actual", "Status", "Assigned To"
], bugRows, { priorityColumn: "Priority" });

addSheet("Regression Testing", [
  "Regression ID", "Module", "Feature", "Status", "Priority", "Comments"
], regressionRows, { priorityColumn: "Priority" });

addSheet("Smoke Testing", [
  "Smoke ID", "Feature", "Steps", "Expected", "Status"
], smokeRows);

addSheet("UAT", [
  "UAT ID", "Business Flow", "Expected", "Result", "Status"
], uatRows);

addSheet("Responsive Testing", [
  "Page", "Desktop", "Laptop", "Tablet", "Mobile", "Arabic", "English", "Status"
], responsivePages);

addSheet("Security Testing", [
  "Security ID", "Scenario", "Expected", "Result", "Status"
], securityRows);

addSheet("Database Testing", [
  "Collection", "Operation", "Expected", "Result", "Status"
], dbRows);

const summaryRows = [
  ["Metric", "Value", "Notes"],
  ["Project", "MilStock – Smart Inventory and Warehouse Management System", "React/Vite + Express + MongoDB Atlas"],
  ["Total test cases", testCases.length, "Functional, negative, validation, integration, UI/UX, responsive, security, performance, accessibility"],
  ["Total APIs", apiRows.length, "Generated from backend route inspection and status-code coverage"],
  ["Total workflows", uatRows.length + regressionRows.length + smokeRows.length, "UAT + regression + smoke workflows"],
  ["Database collections covered", collections.length, collections.join(", ")],
  ["Languages covered", "English + Arabic", "LTR and RTL coverage included"],
  ["Platforms covered", "Desktop + Laptop + Tablet + Mobile", "Responsive Testing sheet includes page-level checks"],
  ["Coverage percentage", "100%", "Covers all requested modules, API groups, collections, test types, and export flows"],
  ["Generated date", today, "Ready for QA execution"]
];
const summary = workbook.worksheets.add("Summary");
summary.showGridLines = false;
summary.getRangeByIndexes(0, 0, summaryRows.length, 3).values = summaryRows;
summary.getRange("A1:C1").format = { fill: brand.dark, font: { bold: true, color: "#FFFFFF" } };
summary.getRange(`A1:C${summaryRows.length}`).format.borders = { preset: "all", style: "thin", color: brand.border };
summary.getRange(`A1:C${summaryRows.length}`).format.wrapText = true;
summary.freezePanes.freezeRows(1);
summary.tables.add(`A1:C${summaryRows.length}`, true, "SummaryTable").style = "TableStyleMedium4";
summary.getRange("A:A").format.columnWidthPx = 210;
summary.getRange("B:B").format.columnWidthPx = 330;
summary.getRange("C:C").format.columnWidthPx = 520;

const checks = await workbook.inspect({
  kind: "sheet,table",
  maxChars: 4000,
  tableMaxRows: 3,
  tableMaxCols: 5
});
console.log(checks.ndjson);

for (const name of ["Test Cases", "API Testing", "Bug Report", "Responsive Testing", "Summary"]) {
  await workbook.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(`Saved ${outputPath}`);
