import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { Search, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { normalizeArray, sameId } from "../lib/normalize";
import { getLocalizedDisplayName, getLocalizedRoleLabel, getLocalizedValue } from "../lib/localization";
const RequestsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: orders, loading: ordersLoading, error: ordersError } = useApiResource(() => api.orders.list(), []);
  const { data: orderItems, loading: itemsLoading } = useApiResource(() => api.orderItems.list(), []);
  const warehouseFilter = new URLSearchParams(location.search).get("warehouse_id");
  useEffect(() => {
    const urlStatus = new URLSearchParams(location.search).get("status");
    if (urlStatus) setStatusFilter(urlStatus);
  }, [location.search]);
  const requestsData = useMemo(() => {
    const orderItemsArray = normalizeArray(orderItems);
    return orders.map((order) => {
      const items = orderItemsArray.filter((item) => sameId(item.order_id, order._id));
      return {
        id: order._id.slice(-8).toUpperCase(),
        mongoId: order._id,
        kitchen: order.user_id?.military_number || getLocalizedRoleLabel(order.user_id?.role, "en") || "Kitchen",
        item: items.map((item) => getLocalizedValue(item.product_id, "name", "en") || getLocalizedValue(item.product, "name", "en") || item.product_name || item.name).filter(Boolean).join(", ") || "No items",
        quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        supplier: getLocalizedDisplayName(order.supplier_id, "en") || getLocalizedDisplayName(order.provider_id, "en") || "",
        sourceWarehouseId: order.source_warehouse?._id || order.source_warehouse || "",
        destinationWarehouseId: order.destination_warehouse?._id || order.destination_warehouse || "",
        requestType: order.request_type === "provider" ? "supplier_request" : order.request_type === "warehouse_transfer" ? "warehouse_request" : order.request_type || "warehouse_request",
        status: order.status,
        requestedDate: new Date(order.date).toLocaleDateString(),
        requestedBy: getLocalizedDisplayName(order.user_id, "en") || "Unknown"
      };
    });
  }, [orders, orderItems]);
  const filteredData = requestsData.filter((req) => {
    const search = String(searchTerm ?? "").toLowerCase();
    const matchesSearch = String(req.id ?? "").toLowerCase().includes(search) || String(req.kitchen ?? "").toLowerCase().includes(search) || String(req.item ?? "").toLowerCase().includes(search) || String(req.supplier ?? "").toLowerCase().includes(search);
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesType = typeFilter === "all" || req.requestType === typeFilter;
    const matchesWarehouse = !warehouseFilter || [req.sourceWarehouseId, req.destinationWarehouseId].some((warehouseId) => String(warehouseId || "") === String(warehouseFilter));
    return matchesSearch && matchesStatus && matchesType && matchesWarehouse;
  });
  const columns = [
    { key: "id", header: "Request ID" },
    { key: "kitchen", header: "Kitchen" },
    { key: "item", header: "Item" },
    { key: "quantity", header: "Quantity" },
    { key: "requestType", header: "Type", render: (row) => row.requestType === "supplier_request" ? "Supplier Request" : "Warehouse Request" },
    { key: "supplier", header: "Supplier", render: (row) => row.supplier || "N/A" },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const variantMap = {
          pending: "pending",
          approved: "success",
          completed: "info",
          cancelled: "danger"
        };
        return <Badge variant={variantMap[row.status]}>{row.status}</Badge>;
      }
    },
    { key: "requestedDate", header: "Date" },
    { key: "requestedBy", header: "Requested By" },
    {
      key: "open",
      header: "",
      render: () => <span className="text-xs font-semibold text-[#4B5B3A]">Open details</span>
    }
  ];
  const exportColumns = [
    { key: "id", header: "Request ID" },
    { key: "kitchen", header: "Kitchen" },
    { key: "item", header: "Items" },
    { key: "quantity", header: "Quantity" },
    { key: "supplier", header: "Supplier" },
    { key: "status", header: "Status" },
    { key: "requestedDate", header: "Date" },
    { key: "requestedBy", header: "Requested By" }
  ];
  const loading = ordersLoading || itemsLoading;
  return <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
    title={isAdmin ? "All Supply Requests" : "My Requests"}
    subtitle={isAdmin ? "Review and manage supply requests from all kitchens" : "Track your supply request status"}
    action={!isAdmin ? {
      label: "New Request",
      onClick: () => navigate("/user/requests/create"),
      icon: Plus
    } : void 0}
  />

      <div className="bg-white rounded-2xl border border-[#4E4631]/10 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B50]" />
              <Input
    placeholder="Search by request ID, kitchen, item, or supplier..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pl-10"
  />
            </div>
          </div>
          <Select
    options={[
      { value: "all", label: "All Status" },
      { value: "pending", label: "Pending" },
      { value: "accepted", label: "Accepted" },
      { value: "in_delivery", label: "In Delivery" },
      { value: "delivered", label: "Delivered" },
      { value: "rejected", label: "Rejected" },
      { value: "approved", label: "Approved" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" }
    ]}
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  />
          <Select
            options={[
              { value: "all", label: "All Types" },
              { value: "warehouse_request", label: "Warehouse Request" },
              { value: "supplier_request", label: "Supplier Request" }
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5A6B50]">
          {loading ? "Loading requests..." : ordersError || <>
                  Showing <span className="font-semibold text-[#2E3A24]">{filteredData.length}</span> of{" "}
                  {requestsData.length} requests
                </>}
        </p>
        <ExportCsvButton filenamePrefix="requests-export" columns={exportColumns} rows={loading ? [] : filteredData}>
          Export
        </ExportCsvButton>
      </div>

  <Table
    columns={columns}
    data={loading ? [] : filteredData}
    emptyMessage={ordersError || "No orders found. Add requests or run the backend seed."}
    onRowClick={(row) => navigate(isAdmin ? `/admin/requests/${row.mongoId}` : `/user/requests/${row.mongoId}`)}
  />
    </div>;
};
export {
  RequestsList
};
