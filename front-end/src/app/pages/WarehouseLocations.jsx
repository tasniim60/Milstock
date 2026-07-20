import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Package, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { getLocalizedValue } from "../lib/localization";

const initialWarehouseForm = {
  name: "",
  nameAr: "",
  code: "",
  location: "",
  locationAr: "",
  capacity: "",
  status: "active"
};

const WarehouseLocations = () => {
  const navigate = useNavigate();
  const { data: warehouses, loading: warehousesLoading, error: warehousesError, refresh: refreshWarehouses } = useApiResource(() => api.warehouses.list(), []);
  const { data: stockRows, loading: stockLoading } = useApiResource(() => api.productWarehouses.list(), []);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState(initialWarehouseForm);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [savingWarehouse, setSavingWarehouse] = useState(false);

  const updateWarehouseForm = (field, value) => {
    setWarehouseForm((current) => ({ ...current, [field]: value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleCreateWarehouse = async (event) => {
    event.preventDefault();
    const capacity = warehouseForm.capacity === "" ? 0 : Number(warehouseForm.capacity);

    if (!warehouseForm.name.trim()) {
      setFormError("Warehouse name is required.");
      return;
    }
    if (!warehouseForm.location.trim()) {
      setFormError("Warehouse location is required.");
      return;
    }
    if (Number.isNaN(capacity) || capacity < 0) {
      setFormError("Capacity must be 0 or greater.");
      return;
    }

    setSavingWarehouse(true);
    setFormError("");
    setFormSuccess("");

    try {
      await api.warehouses.create({
        name: warehouseForm.name.trim(),
        nameAr: warehouseForm.nameAr.trim(),
        code: warehouseForm.code.trim() || undefined,
        location: warehouseForm.location.trim(),
        locationAr: warehouseForm.locationAr.trim(),
        capacity,
        status: warehouseForm.status
      });
      setWarehouseForm(initialWarehouseForm);
      setShowCreateForm(false);
      setFormSuccess("Warehouse created successfully.");
      refreshWarehouses();
    } catch (error) {
      setFormError(error.message || "Failed to create warehouse.");
    } finally {
      setSavingWarehouse(false);
    }
  };

  const warehouseCards = warehouses.map((warehouse) => {
    const rows = stockRows.filter((row) => row.warehouse_id?._id === warehouse._id);
    const currentStock = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    const savedCapacity = Number(warehouse.capacity || 0);
    const categoryTotals = rows.reduce((totals, row) => {
      const category = getLocalizedValue(row.product_id, "category", "en") || "Uncategorized";
      totals[category] = (totals[category] || 0) + Number(row.quantity || 0);
      return totals;
    }, {});
    const categories = Object.entries(categoryTotals).map(([name, items]) => ({
      name,
      items,
      percentage: currentStock ? Math.round(items / currentStock * 100) : 0
    }));
    return {
      ...warehouse,
      capacity: savedCapacity > 0 ? savedCapacity : Math.max(currentStock + 1000, 5000),
      currentStock,
      sections: Math.max(categories.length, 1),
      categories,
      status: "operational",
      alerts: rows.filter((row) => {
        const product = row.product_id;
        const threshold = Number(product?.alert_settings?.low_stock_threshold ?? product?.min_quantity ?? 0);
        return product && threshold > 0 ? Number(row.quantity || 0) <= threshold : false;
      }).length
    };
  });

  const exportColumns = [
    { header: "Warehouse", value: (row) => getLocalizedValue(row, "name", "en") },
    { header: "Location", value: (row) => getLocalizedValue(row, "location", "en") },
    { header: "Manager", value: (row) => row.user_id?.name || "Unassigned" },
    { key: "currentStock", header: "Current Stock" },
    { key: "capacity", header: "Capacity" },
    { key: "sections", header: "Stored Categories" },
    { key: "alerts", header: "Active Alerts" },
    { key: "status", header: "Status" }
  ];
  const loading = warehousesLoading || stockLoading;

  const openWarehouseDashboard = (warehouseId) => {
    if (!warehouseId) return;
    navigate(`/admin/warehouses/${warehouseId}/dashboard`);
  };

  const handleWarehouseKeyDown = (event, warehouseId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWarehouseDashboard(warehouseId);
    }
  };

  return <div className="p-6 lg:p-8 space-y-6">
    <PageHeader
      title="Warehouse Locations"
      subtitle="Monitor storage facilities and capacity utilization"
      action={{
        label: "Add Warehouse",
        icon: Plus,
        onClick: () => {
          setShowCreateForm((current) => !current);
          setFormError("");
          setFormSuccess("");
        }
      }}
    />

    <Card>
      <CardHeader>
        <CardTitle>Warehouse Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 bg-[#4B5B3A] bg-opacity-10 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Total Warehouses</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{warehouseCards.length}</p>
          </div>
          <div className="p-5 bg-[#6A7B4D] bg-opacity-10 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-[#6A7B4D]" />
              <p className="text-sm text-muted-foreground">Total Capacity</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {warehouseCards.reduce((sum, wh) => sum + wh.capacity, 0).toLocaleString()}
            </p>
          </div>
          <div className="p-5 bg-[#6A7B4D] bg-opacity-10 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#6A7B4D]" />
              <p className="text-sm text-muted-foreground">Current Stock</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {warehouseCards.reduce((sum, wh) => sum + wh.currentStock, 0).toLocaleString()}
            </p>
          </div>
          <div className="p-5 bg-[#C9A961] bg-opacity-10 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-[#C9A961]" />
              <p className="text-sm text-muted-foreground">Active Alerts</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {warehouseCards.reduce((sum, wh) => sum + wh.alerts, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {(showCreateForm || formError || formSuccess) && <Card>
      <CardHeader>
        <CardTitle>Add New Warehouse</CardTitle>
      </CardHeader>
      <CardContent>
        {formError && <div className="mb-4 rounded-xl border border-[#D4183D]/25 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{formError}</div>}
        {formSuccess && <div className="mb-4 rounded-xl border border-[#6A7B4D]/25 bg-[#6A7B4D]/10 px-4 py-3 text-sm text-[#4B5B3A]">{formSuccess}</div>}
        {showCreateForm && <form onSubmit={handleCreateWarehouse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Warehouse Name"
            placeholder="Dry Goods Warehouse"
            value={warehouseForm.name}
            onChange={(event) => updateWarehouseForm("name", event.target.value)}
          />
          <Input
            label="Arabic Warehouse Name"
            placeholder="مخزن المواد الجافة"
            value={warehouseForm.nameAr}
            onChange={(event) => updateWarehouseForm("nameAr", event.target.value)}
          />
          <Input
            label="Code"
            placeholder="WH-DRY"
            value={warehouseForm.code}
            onChange={(event) => updateWarehouseForm("code", event.target.value)}
          />
          <Input
            label="Location"
            placeholder="Main Storage Zone A"
            value={warehouseForm.location}
            onChange={(event) => updateWarehouseForm("location", event.target.value)}
          />
          <Input
            label="Arabic Location"
            placeholder="منطقة التخزين الرئيسية أ"
            value={warehouseForm.locationAr}
            onChange={(event) => updateWarehouseForm("locationAr", event.target.value)}
          />
          <Input
            label="Capacity"
            type="number"
            min="0"
            placeholder="50000"
            value={warehouseForm.capacity}
            onChange={(event) => updateWarehouseForm("capacity", event.target.value)}
          />
          <Select
            label="Status"
            value={warehouseForm.status}
            onChange={(event) => updateWarehouseForm("status", event.target.value)}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" }
            ]}
          />
          <div className="flex items-end justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setWarehouseForm(initialWarehouseForm);
                setFormError("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={savingWarehouse}>
              {savingWarehouse ? "Saving..." : "Save Warehouse"}
            </Button>
          </div>
        </form>}
      </CardContent>
    </Card>}

    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-[#5A6B50]">
        {loading ? "Loading warehouses..." : warehousesError || `${warehouseCards.length} warehouses loaded`}
      </p>
      <ExportCsvButton filenamePrefix="warehouses-export" columns={exportColumns} rows={loading ? [] : warehouseCards}>
        Export
      </ExportCsvButton>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {!loading && warehouseCards.map((warehouse) => {
        const utilizationPercentage = warehouse.capacity ? Math.round(warehouse.currentStock / warehouse.capacity * 100) : 0;
        const isHighUtilization = utilizationPercentage > 80;
        return <Card
          key={warehouse._id}
          role="button"
          tabIndex={0}
          onClick={() => openWarehouseDashboard(warehouse._id)}
          onKeyDown={(event) => handleWarehouseKeyDown(event, warehouse._id)}
          className="cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6A7B4D]/30"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary bg-opacity-10 rounded-lg">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{getLocalizedValue(warehouse, "name", "en")}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{getLocalizedValue(warehouse, "location", "en")}</p>
                </div>
              </div>
              {warehouse.alerts > 0 && <Badge variant="warning" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {warehouse.alerts}
              </Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Capacity Utilization</span>
                  <span className={`font-semibold ${isHighUtilization ? "text-[#C9A961]" : "text-[#6A7B4D]"}`}>
                    {utilizationPercentage}%
                  </span>
                </div>
                <div className="w-full h-3 bg-[#E0E1B7] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isHighUtilization ? "bg-[#C9A961]" : "bg-[#6A7B4D]"}`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {warehouse.currentStock.toLocaleString()} / {warehouse.capacity.toLocaleString()} items
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stored Categories</p>
                  <p className="text-xl font-bold text-foreground">{warehouse.sections}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Manager</p>
                  <p className="text-sm text-foreground">{warehouse.user_id?.name || "Unassigned"}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-3">Stock Distribution</p>
                <div className="space-y-2">
                  {warehouse.categories.length === 0 && <p className="text-xs text-muted-foreground">No product stock rows yet.</p>}
                  {warehouse.categories.map((category) => <div key={category.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{category.name}</span>
                      <span className="text-foreground font-medium">
                        {category.items} ({category.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#E0E1B7] rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${category.percentage}%` }} />
                    </div>
                  </div>)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>;
      })}
    </div>
  </div>;
};

export {
  WarehouseLocations
};
