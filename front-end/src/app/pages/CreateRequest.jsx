import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { Send, X } from "lucide-react";
import { useNavigate } from "react-router";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { getStoredAssignedWarehouse } from "../lib/warehouseDisplay";
import { getLocalizedValue } from "../lib/localization";
import { MAX_DATE_INPUT, MIN_DATE_INPUT, isValidDateInput } from "../lib/dateValidation";
import { getEffectiveProductUnitPrice } from "../lib/productPricing";
const CreateRequest = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([{ product_id: "", quantity: "" }]);
  const [supplierId, setSupplierId] = useState("");
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [requestType, setRequestType] = useState("warehouse_request");
  const [notes, setNotes] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const assignedWarehouse = getStoredAssignedWarehouse();
  const { data: products, loading: productsLoading, error: productsError } = useApiResource(() => api.products.list(), []);
  const { data: supplierUsers, loading: suppliersLoading, error: suppliersError } = useApiResource(() => api.supplierUsers.list(), []);
  const { data: warehouses, loading: warehousesLoading, error: warehousesError } = useApiResource(() => api.warehouses.list(), []);
  const activeWarehouses = warehouses.filter((warehouse) => !warehouse.status || warehouse.status === "active");
  const activeSuppliers = supplierUsers.filter((supplier) => {
    const text = `${supplier.name || ""} ${supplier.email || ""}`.toLowerCase();
    const isNonFood = /(medical|equipment|hardware|device)/i.test(text);
    return !isNonFood && (!supplier.status || supplier.status === "active") && (!supplier.role || supplier.role === "supplier");
  });
  const selectableWarehouses = activeWarehouses.filter((warehouse) => warehouse._id !== assignedWarehouse.id);
  const warehousePlaceholder = warehousesLoading
    ? "Loading warehouses..."
    : selectableWarehouses.length ? "Select warehouse..." : "No source warehouses available";
  const supplierPlaceholder = suppliersLoading
    ? "Loading suppliers..."
    : activeSuppliers.length ? "Select supplier..." : "No active suppliers found";
  const getProductPrice = (productId) => {
    const product = products.find((entry) => entry._id === productId);
    return getEffectiveProductUnitPrice(product);
  };
  const formatProductPrice = (productId) => {
    if (!productId) return "Select product";
    return getProductPrice(productId).toLocaleString();
  };
  const getItemTotal = (item) => Number(item.quantity || 0) * getProductPrice(item.product_id);
  const addItem = () => {
    setItems([...items, { product_id: "", quantity: "" }]);
  };
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };
  const updateItem = (index, field, value) => {
    setItems(
      (current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
    );
  };
  const handleRequestTypeChange = (value) => {
    setRequestType(value);
    setSupplierId("");
    setSourceWarehouseId("");
    setMessage("");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignedWarehouse.id) {
      setMessage("No warehouse assigned to this user. Please contact admin.");
      return;
    }
    if (requestType === "supplier_request" && !supplierId) {
      setMessage("Please select a supplier.");
      return;
    }
    if (requestType === "warehouse_request" && !sourceWarehouseId) {
      setMessage("Please select the source warehouse.");
      return;
    }
    if (!isValidDateInput(expectedDeliveryDate)) {
      setMessage("Enter a valid expected delivery date between 2000 and 2100.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await api.orders.create({
        request_type: requestType,
        supplier_id: requestType === "supplier_request" ? supplierId : undefined,
        source_warehouse: requestType === "warehouse_request" ? sourceWarehouseId : undefined,
        destination_warehouse: assignedWarehouse.id,
        notes,
        expected_delivery_date: expectedDeliveryDate || undefined,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity)
        }))
      });
      navigate("/user/requests");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create request");
    } finally {
      setSaving(false);
    }
  };
  return <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Create Supply Request" subtitle="Submit a new request for food supplies" />

      <div className="max-w-4xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && <p className="text-sm text-[#D4183D]">{message}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Request Type"
                value={requestType}
                onChange={(event) => handleRequestTypeChange(event.target.value)}
                options={[
                  { value: "warehouse_request", label: "Warehouse Request" },
                  { value: "supplier_request", label: "Supplier Request" }
                ]}
              />
              {requestType === "supplier_request" ? <Select
                label="Supplier *"
                options={[
                  { value: "", label: supplierPlaceholder, disabled: !activeSuppliers.length },
                  ...activeSuppliers.map((supplier) => ({ value: supplier._id, label: supplier.name || supplier.email }))
                ]}
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                disabled={suppliersLoading}
                error={suppliersError ? "Failed to load suppliers" : ""}
                required
              /> : <>
              <Select
    label="Source Warehouse / Request From Warehouse *"
    options={[
      { value: "", label: warehousePlaceholder, disabled: !selectableWarehouses.length },
      ...selectableWarehouses.map((warehouse) => ({ value: warehouse._id, label: getLocalizedValue(warehouse, "name", "en") }))
    ]}
    value={sourceWarehouseId}
    onChange={(e) => setSourceWarehouseId(e.target.value)}
    disabled={warehousesLoading}
    error={warehousesError ? "Failed to load warehouses" : ""}
    required
  />
              </>}
              <div>
                <p className="block mb-1.5 text-sm font-medium text-[#2E3A24]">Delivery Warehouse</p>
                <div className="rounded-xl border border-[#4E4631]/15 bg-[#ECEEE2]/60 px-4 py-2.5 text-sm text-[#2E3A24]">
                  {assignedWarehouse.name || "No warehouse assigned"}
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-4 text-foreground font-semibold">Requested Items</label>
              <div className="space-y-4">
                {items.map((item, index) => <div key={index} className="p-4 bg-background rounded-xl border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <Select
    label="Product *"
    options={[
      { value: "", label: productsLoading ? "Loading products..." : productsError || "Select product..." },
      ...products.map((product) => ({
        value: product._id,
        label: `${getLocalizedValue(product, "name", "en")} (${product.quantity} ${product.unit})`
      }))
    ]}
    value={item.product_id}
    onChange={(e) => updateItem(index, "product_id", e.target.value)}
    disabled={productsLoading}
    required
  />
                      </div>
                      <Input
    label="Quantity *"
    type="number"
    placeholder="0"
    min="1"
    value={item.quantity}
    onChange={(e) => updateItem(index, "quantity", e.target.value)}
    required
  />
                      <div>
                        <p className="block mb-1.5 text-sm font-medium text-[#2E3A24]">Unit Price</p>
                        <div className="rounded-xl border border-[#4E4631]/15 bg-[#ECEEE2]/60 px-4 py-2.5 text-sm text-[#2E3A24]">
                          {formatProductPrice(item.product_id)}
                        </div>
                      </div>
                      <div>
                        <p className="block mb-1.5 text-sm font-medium text-[#2E3A24]">Total</p>
                        <div className="rounded-xl border border-[#4E4631]/15 bg-[#ECEEE2]/60 px-4 py-2.5 text-sm text-[#2E3A24]">
                          {getItemTotal(item).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {items.length > 1 && <button
    type="button"
    onClick={() => removeItem(index)}
    className="mt-3 text-destructive hover:text-destructive-foreground flex items-center gap-2 text-sm"
  >
                        <X className="w-4 h-4" />
                        Remove Item
                      </button>}
                  </div>)}
              </div>
              <Button type="button" variant="outline" onClick={addItem} className="mt-4">
                + Add Another Item
              </Button>
            </div>

            <div>
              <label className="block mb-2 text-foreground">Additional Notes</label>
              <textarea
    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-input-background text-foreground min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
    placeholder="Add any additional information or special requirements..."
    value={notes}
    onChange={(event) => setNotes(event.target.value)}
  />
              {requestType === "supplier_request" && <Input
                label="Expected Delivery Date"
                type="date"
                min={MIN_DATE_INPUT}
                max={MAX_DATE_INPUT}
                value={expectedDeliveryDate}
                onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                className="mt-4"
              />}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={saving}>
                <Send className="w-5 h-5" />
                {saving ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>;
};
export {
  CreateRequest
};
