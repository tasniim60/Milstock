import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, Edit, MapPin, Package, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate, getProductStatus } from "../lib/format";
import { getLocalizedValue } from "../lib/localization";

const fieldValue = (value) => value || "N/A";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { data: products, loading, error } = useApiResource(() => api.products.list(), []);
  const { data: productWarehouseRows } = useApiResource(() => api.productWarehouses.list(), []);
  const product = useMemo(() => products.find((entry) => entry._id === id), [id, products]);

  if (loading) {
    return <div className="p-6 lg:p-8"><Card><CardContent className="py-10 text-center text-muted-foreground">Loading item...</CardContent></Card></div>;
  }

  if (error || !product) {
    return <div className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate("/admin/inventory")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Inventory
      </button>
      <Card><CardContent className="py-10 text-center text-muted-foreground">{error || "Item not found."}</CardContent></Card>
    </div>;
  }

  const expirationDate = product.expiration_date || product.expiry_date;
  const productName = getLocalizedValue(product, "name", "en") || "Inventory Item";
  const productCategory = getLocalizedValue(product, "category", "en");
  const productDescription = getLocalizedValue(product, "description", "en");
  const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
  const sameItemProducts = products.filter((entry) =>
    normalizeIdentity(entry.name) === normalizeIdentity(product.name)
    && normalizeIdentity(entry.unit) === normalizeIdentity(product.unit)
    && normalizeIdentity(entry.category) === normalizeIdentity(product.category)
  );
  const sameItemProductIds = new Set(sameItemProducts.map((entry) => String(entry._id)));
  const mergeWarehouseRows = (rows) => {
    const byWarehouse = new Map();
    rows.forEach((warehouse) => {
      const key = String(warehouse.id || warehouse._id || warehouse.name || "");
      const existing = byWarehouse.get(key);
      if (existing) {
        existing.quantity += Number(warehouse.quantity || 0);
      } else {
        byWarehouse.set(key, { ...warehouse, quantity: Number(warehouse.quantity || 0) });
      }
    });
    return Array.from(byWarehouse.values());
  };
  const rowWarehouseStock = mergeWarehouseRows(productWarehouseRows
    .filter((row) => sameItemProductIds.has(String(row.product_id?._id || row.product_id || "")))
    .map((row) => {
      const rowProduct = row.product_id && typeof row.product_id === "object" ? row.product_id : sameItemProducts.find((entry) => entry._id === (row.product_id?._id || row.product_id));
      return {
        id: row.warehouse_id?._id || row.warehouse_id,
        _id: row.warehouse_id?._id || row.warehouse_id,
        name: getLocalizedValue(row.warehouse_id, "name", "en") || getLocalizedValue(rowProduct?.warehouse_id, "name", "en") || rowProduct?.warehouse_name || "Unassigned",
        code: row.warehouse_id?.code || rowProduct?.warehouse_id?.code || "",
        location: getLocalizedValue(row.warehouse_id, "location", "en") || getLocalizedValue(rowProduct?.warehouse_id, "location", "en") || "",
        quantity: Number(row.quantity || 0),
        unit: rowProduct?.unit || product.unit,
      };
    }));
  const sameItemProductStock = mergeWarehouseRows(sameItemProducts
    .filter((entry) => entry.warehouse_id || entry.warehouse_name)
    .map((entry) => ({
      id: entry.warehouse_id?._id || entry.warehouse_id || entry.warehouse_name,
      _id: entry.warehouse_id?._id || entry.warehouse_id,
      name: getLocalizedValue(entry.warehouse_id, "name", "en") || entry.warehouse_name || "Unassigned",
      code: entry.warehouse_id?.code || "",
      location: getLocalizedValue(entry.warehouse_id, "location", "en") || "",
      quantity: Number(entry.quantity || 0),
      unit: entry.unit,
    })));
  const hasWarehouseArray = Array.isArray(product.warehouses);
  const warehouseStock = rowWarehouseStock.length
    ? rowWarehouseStock
    : sameItemProductStock.length
    ? sameItemProductStock
    : hasWarehouseArray
    ? product.warehouses
    : (product.warehouse_id || product.warehouse_name ? [{
      id: product.warehouse_id?._id || product.warehouse_id || "legacy-warehouse",
      name: getLocalizedValue(product.warehouse_id, "name", "en") || product.warehouse_name || "Unassigned",
      code: product.warehouse_id?.code,
      location: getLocalizedValue(product.warehouse_id, "location", "en"),
      quantity: product.quantity ?? 0,
      unit: product.unit,
    }] : []);
  const totalStock = warehouseStock.length
    ? warehouseStock.reduce((sum, warehouse) => sum + Number(warehouse.quantity || 0), 0)
    : Number(product.totalStock ?? product.quantity ?? 0);
  const primaryWarehouse = warehouseStock[0] || {
    name: getLocalizedValue(product.warehouse_id, "name", "en") || product.warehouse_name || "Unassigned",
    code: product.warehouse_id?.code,
    location: getLocalizedValue(product.warehouse_id, "location", "en"),
    quantity: product.quantity ?? 0,
    unit: product.unit,
  };
  const status = getProductStatus(product);
  const statusVariant = {
    "in-stock": "success",
    critical: "danger",
    "low-stock": "warning",
    "out-of-stock": "danger",
    "expiring-soon": "warning"
  }[status] || "neutral";
  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.products.remove(id);
      setSuccessMessage("Item deleted successfully.");
      window.setTimeout(() => navigate("/admin/inventory"), 500);
    } catch (requestError) {
      setDeleteError(requestError.message || "Unable to delete this item.");
      setDeleting(false);
    }
  };

  return <div className="p-6 lg:p-8 space-y-6">
    <button onClick={() => navigate("/admin/inventory")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] transition-colors text-sm">
      <ArrowLeft className="w-4 h-4" />
      Back to Inventory
    </button>

    <PageHeader
      title={productName}
      subtitle={`Item ID: ${String(product._id || id).slice(-8).toUpperCase()}`}
      actions={[
        { label: "Edit Item", onClick: () => navigate(`/admin/inventory/${id}/edit`), icon: Edit },
        { label: deleting ? "Deleting..." : "Delete", onClick: () => setShowDeleteConfirm(true), icon: Trash2, variant: "danger", disabled: deleting }
      ]}
    />
    {successMessage && <div className="rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e]">{successMessage}</div>}
    {deleteError && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{deleteError}</div>}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <div className="flex items-start gap-4">
          <Package className="w-8 h-8 text-[#6A7B4D]" />
          <div>
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="text-3xl font-bold text-foreground">{totalStock}</p>
            <p className="text-sm text-muted-foreground">{product.unit || ""}</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-start gap-4">
          <MapPin className="w-8 h-8 text-[#6A7B4D]" />
          <div>
            <p className="text-sm text-muted-foreground">Warehouse</p>
            <p className="text-2xl font-bold text-foreground">{warehouseStock.length > 1 ? `${warehouseStock.length} warehouses` : primaryWarehouse.name}</p>
            <p className="text-sm text-muted-foreground">{warehouseStock.length > 1 ? "See stock distribution below" : primaryWarehouse.location || product.storage_section || "No storage section"}</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-start gap-4">
          <Calendar className="w-8 h-8 text-[#6A7B4D]" />
          <div>
            <p className="text-sm text-muted-foreground">Expiration</p>
            <p className="text-2xl font-bold text-foreground">{formatDate(expirationDate)}</p>
            <Badge variant={statusVariant} className="mt-2">{status.replace("-", " ")}</Badge>
          </div>
        </div>
      </Card>
    </div>

    <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Item Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                ["Category", productCategory],
                ["Unit", product.unit],
                ["Low Stock Threshold", product.alert_settings?.low_stock_threshold ?? product.min_quantity],
                ["Critical Stock Threshold", product.alert_settings?.critical_stock_threshold ?? 0],
                ["Manufacturing Date", formatDate(product.manufacturing_date)],
                ["Batch Number", product.batch_number],
                ["Serial Number", product.serial_number],
                ["Warehouse Location", warehouseStock.length > 1 ? `${warehouseStock.length} warehouse locations` : primaryWarehouse.location],
                ["Storage Section", product.storage_section]
              ].map(([label, value]) => <div key={label}>
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p className="text-foreground font-medium">{fieldValue(value)}</p>
              </div>)}
            </div>
          </CardContent>
        </Card>

        {(warehouseStock.length !== 1) && <Card>
          <CardHeader><CardTitle>Stock by Warehouse</CardTitle></CardHeader>
          <CardContent>
            {warehouseStock.length === 0 ? <div className="rounded-xl border border-[#4E4631]/10 bg-[#ECEEE2]/50 px-4 py-6 text-center text-sm text-[#5A6B50]">
              No warehouse stock available
            </div> : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#4E4631]/10 text-left text-[#5A6B50]">
                    <th className="py-2 pr-3">Warehouse</th>
                    <th className="py-2 pr-3">Code / Location</th>
                    <th className="py-2 pr-3">Stock Quantity</th>
                    <th className="py-2 pr-3">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseStock.map((warehouse) => <tr key={warehouse.id || warehouse._id || warehouse.name} className="border-b border-[#4E4631]/5">
                    <td className="py-2 pr-3 font-medium text-[#2E3A24]">{warehouse.name || "Unnamed warehouse"}</td>
                    <td className="py-2 pr-3 text-[#5A6B50]">
                      {[warehouse.code, warehouse.location].filter(Boolean).join(" / ") || "N/A"}
                    </td>
                    <td className="py-2 pr-3 font-semibold text-[#2E3A24]">{warehouse.quantity ?? 0}</td>
                    <td className="py-2 pr-3">{warehouse.unit || product.unit || "N/A"}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>}
          </CardContent>
        </Card>}

        <Card>
          <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-foreground">{fieldValue(productDescription)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Notes</p>
              <p className="text-foreground">{fieldValue(product.notes)}</p>
            </div>
          </CardContent>
        </Card>
    </div>

    {showDeleteConfirm && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#4E4631]/10 shadow-xl p-6">
        <h3 className="text-[#2E3A24] font-semibold mb-2">Delete Item</h3>
        <p className="text-sm text-[#5A6B50] mb-5">Are you sure you want to delete this item?</p>
        {deleteError && <p className="mb-4 rounded-lg border border-[#D4183D]/20 bg-[#D4183D]/10 px-3 py-2 text-sm text-[#D4183D]">{deleteError}</p>}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</Button>
          <Button variant="danger" type="button" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
        </div>
      </div>
    </div>}
  </div>;
};

export {
  ItemDetails
};
