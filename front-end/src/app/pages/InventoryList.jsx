import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { Plus, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate, getProductStatus, uniqueOptions } from "../lib/format";
import { getLocalizedValue } from "../lib/localization";
import { getStoredAuth } from "../lib/auth";
const InventoryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = getStoredAuth();
  const isAdmin = role === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: products, loading, error } = useApiResource(() => api.products.list(), []);
  const query = new URLSearchParams(location.search);
  const urlFilter = query.get("filter");
  const warehouseFilter = query.get("warehouse_id");
  const itemFilter = query.get("item_id");

  useEffect(() => {
    const urlStatus = new URLSearchParams(location.search).get("status");
    const normalizedStatus = urlStatus === "low_stock" ? "low-stock" : urlStatus;
    if (normalizedStatus) {
      setStatusFilter(normalizedStatus);
    } else if (new URLSearchParams(location.search).get("filter") === "expiring") {
      setStatusFilter("all");
    }
  }, [location.search]);

  const isExpiringWithin30Days = (value) => {
    if (!value) return false;
    const days = (new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };
  const inventoryData = products.map((product) => ({
    id: product._id.slice(-8).toUpperCase(),
    mongoId: product._id,
    name: getLocalizedValue(product, "name", "en"),
    category: getLocalizedValue(product, "category", "en"),
    quantity: product.quantity,
    unit: product.unit,
    expirationRaw: product.expiration_date || product.expiry_date,
    expirationDate: formatDate(product.expiration_date || product.expiry_date),
    warehouse: getLocalizedValue(product.warehouse_id, "name", "en") || "Unassigned",
    warehouseId: product.warehouse_id?._id || product.warehouse_id || "",
    storageSection: product.storage_section || "N/A",
    status: getProductStatus(product)
  }));
  const filteredData = inventoryData.filter((item) => {
    const search = String(searchTerm ?? "").toLowerCase();
    const matchesSearch = String(item.name ?? "").toLowerCase().includes(search) || String(item.id ?? "").toLowerCase().includes(search);
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesUrlFilter = urlFilter !== "expiring" || isExpiringWithin30Days(item.expirationRaw);
    const matchesWarehouse = !warehouseFilter || String(item.warehouseId) === String(warehouseFilter);
    const matchesItem = !itemFilter || String(item.mongoId) === String(itemFilter);
    return matchesSearch && matchesCategory && matchesStatus && matchesUrlFilter && matchesWarehouse && matchesItem;
  });
  const columns = [
    { key: "id", header: "Item ID" },
    { key: "name", header: "Item Name" },
    { key: "category", header: "Category" },
    {
      key: "quantity",
      header: "Quantity",
      render: (row) => `${row.quantity} ${row.unit}`
    },
    { key: "expirationDate", header: "Expiration Date" },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (row) => <div>
          <p className="font-medium text-foreground">{row.warehouse}</p>
          <p className="text-xs text-muted-foreground">{row.storageSection}</p>
        </div>
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const variantMap = {
          "in-stock": "success",
          critical: "danger",
          "low-stock": "warning",
          "out-of-stock": "danger",
          "expiring-soon": "warning"
        };
        return <Badge variant={variantMap[row.status]}>{row.status.replace("-", " ")}</Badge>;
      }
    },
    isAdmin && {
      key: "actions",
      header: "Actions",
      render: (row) => <button
        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#D4183D] rounded-lg hover:bg-[#b81434] transition-colors"
        onClick={async (event) => {
          event.stopPropagation();
          if (!window.confirm(`Delete ${row.name}?`)) return;
          await api.products.remove(row.mongoId);
          window.location.reload();
        }}
      >
          Delete
        </button>
    }
  ].filter(Boolean);
  const exportColumns = [
    { key: "id", header: "Item ID" },
    { key: "name", header: "Item Name" },
    { key: "category", header: "Category" },
    { header: "Quantity", value: (row) => `${row.quantity} ${row.unit}` },
    { key: "expirationDate", header: "Expiration Date" },
    { key: "warehouse", header: "Warehouse" },
    { key: "storageSection", header: "Storage Section" },
    { key: "status", header: "Status" }
  ];
  return <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
    title="Inventory Management"
    subtitle="Track and manage all inventory items across warehouses"
    action={isAdmin ? {
      label: "Add New Item",
      onClick: () => navigate("/admin/inventory/add"),
      icon: Plus
    } : null}
  />

      <div className="bg-white rounded-2xl border border-[#4E4631]/10 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B50]" />
              <Input
    placeholder="Search by item name or ID..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pl-10"
  />
            </div>
          </div>
          <Select
    options={uniqueOptions(products.map((product) => getLocalizedValue(product, "category", "en")), "All Categories")}
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
    disabled={loading}
  />
          <Select
    options={[
      { value: "all", label: "All Status" },
      { value: "in-stock", label: "In Stock" },
      { value: "critical", label: "Critical" },
      { value: "low-stock", label: "Low Stock" },
      { value: "expiring-soon", label: "Expiring Soon" },
      { value: "out-of-stock", label: "Out of Stock" }
    ]}
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5A6B50]">
          {loading ? "Loading inventory..." : error || <>
                  Showing <span className="font-semibold text-[#2E3A24]">{filteredData.length}</span> of{" "}
                  {inventoryData.length} items
                </>}
        </p>
        <ExportCsvButton filenamePrefix="inventory-export" columns={exportColumns} rows={loading ? [] : filteredData}>
          Export
        </ExportCsvButton>
      </div>

      <Table
    columns={columns}
    data={loading ? [] : filteredData}
    emptyMessage={error || "No products found. Add items or run the backend seed."}
    onRowClick={isAdmin ? (row) => navigate(`/admin/inventory/${row.mongoId}`) : undefined}
  />
    </div>;
};
export {
  InventoryList
};
