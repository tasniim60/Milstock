import { createBrowserRouter } from "react-router";
import { createElement } from "react";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { UserDashboard } from "./pages/UserDashboard";
import { SupplierDashboard } from "./pages/SupplierDashboard";
import { SupplierOrders } from "./pages/SupplierOrders";
import { InventoryList } from "./pages/InventoryList";
import { ItemDetails } from "./pages/ItemDetails";
import { AddInventoryItem } from "./pages/AddInventoryItem";
import { MovementLogs } from "./pages/MovementLogs";
import { ConsumptionList } from "./pages/ConsumptionList";
import { CreateConsumption } from "./pages/CreateConsumption";
import { ConsumptionDetails } from "./pages/ConsumptionDetails";
import { WasteAnalysis } from "./pages/WasteAnalysis";
import { WarehouseLocations } from "./pages/WarehouseLocations";
import { WarehouseDashboard } from "./pages/WarehouseDashboard";
import { CreateRequest } from "./pages/CreateRequest";
import { RequestsList } from "./pages/RequestsList";
import { RequestDetails } from "./pages/RequestDetails";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AuditLogs } from "./pages/AuditLogs";
import { ProfilePage } from "./pages/ProfilePage";
import { UserManagement } from "./pages/UserManagement";
import { AddUser } from "./pages/AddUser";
import { UserDetails } from "./pages/UserDetails";
import { EditUser } from "./pages/EditUser";
import { SettingsPage } from "./pages/SettingsPage";
import { ExpirationMonitor } from "./pages/ExpirationMonitor";
import { NotFound } from "./pages/NotFound";
import { AccessDenied } from "./pages/AccessDenied";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPageAr } from "./pages/ar/LoginPageAr";
import { AdminDashboardAr } from "./pages/ar/AdminDashboardAr";
import { UserDashboardAr } from "./pages/ar/UserDashboardAr";
import { InventoryListAr } from "./pages/ar/InventoryListAr";
import { ItemDetailsAr } from "./pages/ar/ItemDetailsAr";
import { AddInventoryItemAr } from "./pages/ar/AddInventoryItemAr";
import { MovementLogsAr } from "./pages/ar/MovementLogsAr";
import { ConsumptionListAr } from "./pages/ar/ConsumptionListAr";
import { CreateConsumptionAr } from "./pages/ar/CreateConsumptionAr";
import { ConsumptionDetailsAr } from "./pages/ar/ConsumptionDetailsAr";
import { WasteAnalysisAr } from "./pages/ar/WasteAnalysisAr";
import { ExpirationMonitorAr } from "./pages/ar/ExpirationMonitorAr";
import { WarehouseLocationsAr } from "./pages/ar/WarehouseLocationsAr";
import { WarehouseDashboardAr } from "./pages/ar/WarehouseDashboardAr";
import { RequestsListAr } from "./pages/ar/RequestsListAr";
import { CreateRequestAr } from "./pages/ar/CreateRequestAr";
import { RequestDetailsAr } from "./pages/ar/RequestDetailsAr";
import { NotificationsPageAr } from "./pages/ar/NotificationsPageAr";
import { ReportsPageAr } from "./pages/ar/ReportsPageAr";
import { AuditLogsAr } from "./pages/ar/AuditLogsAr";
import { UserManagementAr } from "./pages/ar/UserManagementAr";
import { AddUserAr } from "./pages/ar/AddUserAr";
import { UserDetailsAr } from "./pages/ar/UserDetailsAr";
import { EditUserAr } from "./pages/ar/EditUserAr";
import { SettingsPageAr } from "./pages/ar/SettingsPageAr";
import { ProfilePageAr } from "./pages/ar/ProfilePageAr";
import { NotFoundAr } from "./pages/ar/NotFoundAr";
import { AccessDeniedAr } from "./pages/ar/AccessDeniedAr";
import { DashboardLayoutAr } from "./components/ar/DashboardLayoutAr";
import { LanguageSelect } from "./pages/LanguageSelect";
const AdminLayout = () => createElement(ProtectedRoute, { allowedRole: "admin" }, createElement(DashboardLayout));
const UserLayout = () => createElement(ProtectedRoute, { allowedRole: "user" }, createElement(DashboardLayout));
const supplierLayout = () => createElement(ProtectedRoute, { allowedRole: "supplier" }, createElement(DashboardLayout));
const ProfileLayout = () => createElement(ProtectedRoute, null, createElement(DashboardLayout));
const AdminLayoutAr = () => createElement(ProtectedRoute, { allowedRole: "admin" }, createElement(DashboardLayoutAr));
const UserLayoutAr = () => createElement(ProtectedRoute, { allowedRole: "user" }, createElement(DashboardLayoutAr));
const supplierLayoutAr = () => createElement(ProtectedRoute, { allowedRole: "supplier" }, createElement(DashboardLayoutAr));
const ProfileLayoutAr = () => createElement(ProtectedRoute, null, createElement(DashboardLayoutAr));
const router = createBrowserRouter([
  // ── Root: language selector ────────────────────────
  { path: "/", Component: LanguageSelect },
  // ── English routes ────────────────────────────────
  { path: "/login", Component: LoginPage },
  { path: "/403", Component: AccessDenied },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { path: "dashboard", Component: AdminDashboard },
      { path: "inventory", Component: InventoryList },
      { path: "inventory/add", Component: AddInventoryItem },
      { path: "inventory/logs", Component: MovementLogs },
      { path: "consumptions", Component: ConsumptionList },
      { path: "consumptions/:id/edit", Component: CreateConsumption },
      { path: "consumptions/:id", Component: ConsumptionDetails },
      { path: "waste-analysis", Component: WasteAnalysis },
      { path: "inventory/expiration", Component: ExpirationMonitor },
      { path: "inventory/warehouses", Component: WarehouseLocations },
      { path: "warehouses/:id/dashboard", Component: WarehouseDashboard },
      { path: "inventory/:id", Component: ItemDetails },
      { path: "inventory/:id/edit", Component: AddInventoryItem },
      { path: "requests", Component: RequestsList },
      { path: "requests/pending", Component: RequestsList },
      { path: "requests/:id", Component: RequestDetails },
      { path: "notifications", Component: NotificationsPage },
      { path: "reports", Component: ReportsPage },
      { path: "audit-logs", Component: AuditLogs },
      { path: "users", Component: UserManagement },
      { path: "users/new", Component: AddUser },
      { path: "users/:id", Component: UserDetails },
      { path: "users/:id/edit", Component: EditUser },
      { path: "settings", Component: SettingsPage }
    ]
  },
  {
    path: "/user",
    Component: UserLayout,
    children: [
      { path: "dashboard", Component: UserDashboard },
      { path: "inventory", Component: InventoryList },
      { path: "consumptions", Component: ConsumptionList },
      { path: "consumptions/new", Component: CreateConsumption },
      { path: "consumptions/:id/edit", Component: CreateConsumption },
      { path: "consumptions/:id", Component: ConsumptionDetails },
      { path: "waste-analysis", Component: WasteAnalysis },
      { path: "requests", Component: RequestsList },
      { path: "requests/create", Component: CreateRequest },
      { path: "requests/:id", Component: RequestDetails },
      { path: "notifications", Component: NotificationsPage }
    ]
  },
  {
    path: "/supplier",
    Component: supplierLayout,
    children: [
      { path: "dashboard", Component: SupplierDashboard },
      { path: "orders", Component: SupplierOrders },
      { path: "orders/:id", Component: RequestDetails },
      { path: "notifications", Component: NotificationsPage }
    ]
  },
  {
    path: "/profile",
    Component: ProfileLayout,
    children: [{ index: true, Component: ProfilePage }]
  },
  { path: "*", Component: NotFound },
  // ── Arabic (RTL) routes ────────────────────────────
  { path: "/ar/login", Component: LoginPageAr },
  { path: "/ar/403", Component: AccessDeniedAr },
  // Arabic Admin routes
  {
    path: "/ar/admin",
    Component: AdminLayoutAr,
    children: [
      { path: "dashboard", Component: AdminDashboardAr },
      { path: "inventory", Component: InventoryListAr },
      { path: "inventory/add", Component: AddInventoryItemAr },
      { path: "inventory/logs", Component: MovementLogsAr },
      { path: "consumptions", Component: ConsumptionListAr },
      { path: "consumptions/:id/edit", Component: CreateConsumptionAr },
      { path: "consumptions/:id", Component: ConsumptionDetailsAr },
      { path: "waste-analysis", Component: WasteAnalysisAr },
      { path: "inventory/expiration", Component: ExpirationMonitorAr },
      { path: "inventory/warehouses", Component: WarehouseLocationsAr },
      { path: "warehouses/:id/dashboard", Component: WarehouseDashboardAr },
      { path: "inventory/:id", Component: ItemDetailsAr },
      { path: "inventory/:id/edit", Component: AddInventoryItemAr },
      { path: "requests", Component: RequestsListAr },
      { path: "requests/pending", Component: RequestsListAr },
      { path: "requests/:id", Component: RequestDetailsAr },
      { path: "notifications", Component: NotificationsPageAr },
      { path: "reports", Component: ReportsPageAr },
      { path: "audit-logs", Component: AuditLogsAr },
      { path: "users", Component: UserManagementAr },
      { path: "users/new", Component: AddUserAr },
      { path: "users/:id", Component: UserDetailsAr },
      { path: "users/:id/edit", Component: EditUserAr },
      { path: "settings", Component: SettingsPageAr }
    ]
  },
  // Arabic User routes
  {
    path: "/ar/user",
    Component: UserLayoutAr,
    children: [
      { path: "dashboard", Component: UserDashboardAr },
      { path: "inventory", Component: InventoryListAr },
      { path: "consumptions", Component: ConsumptionListAr },
      { path: "consumptions/new", Component: CreateConsumptionAr },
      { path: "consumptions/:id/edit", Component: CreateConsumptionAr },
      { path: "consumptions/:id", Component: ConsumptionDetailsAr },
      { path: "waste-analysis", Component: WasteAnalysisAr },
      { path: "requests", Component: RequestsListAr },
      { path: "requests/create", Component: CreateRequestAr },
      { path: "requests/:id", Component: RequestDetailsAr },
      { path: "notifications", Component: NotificationsPageAr }
    ]
  },
  {
    path: "/ar/supplier",
    Component: supplierLayoutAr,
    children: [
      { path: "dashboard", Component: SupplierDashboard },
      { path: "orders", Component: SupplierOrders },
      { path: "orders/:id", Component: RequestDetails },
      { path: "notifications", Component: NotificationsPageAr }
    ]
  },
  // Arabic Profile (shared layout)
  {
    path: "/ar/profile",
    Component: ProfileLayoutAr,
    children: [{ index: true, Component: ProfilePageAr }]
  },
  // Arabic 404 catch-all
  { path: "/ar/*", Component: NotFoundAr }
]);
export {
  router
};
