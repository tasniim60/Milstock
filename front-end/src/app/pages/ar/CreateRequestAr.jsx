import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Send, Trash2 } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { getStoredAssignedWarehouse } from "../../lib/warehouseDisplay";
import { getLocalizedDisplayName, getLocalizedValue, localizeText } from "../../lib/localization";
import { MAX_DATE_INPUT, MIN_DATE_INPUT, isValidDateInput } from "../../lib/dateValidation";
import { getEffectiveProductUnitPrice } from "../../lib/productPricing";

const CreateRequestAr = () => {
  const navigate = useNavigate();
  const [supplierId, setSupplierId] = useState("");
  const [requestType, setRequestType] = useState("warehouse_request");
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const assignedWarehouse = getStoredAssignedWarehouse();
  const [items, setItems] = useState([{ id: "1", product_id: "", quantity: "" }]);

  const { data: products, loading: productsLoading, error: productsError } = useApiResource(() => api.products.list(), []);
  const { data: suppliers, loading: suppliersLoading, error: suppliersError } = useApiResource(() => api.supplierUsers.list(), []);
  const { data: warehouses, loading: warehousesLoading, error: warehousesError } = useApiResource(() => api.warehouses.list(), []);

  const activeWarehouses = warehouses.filter((warehouse) => !warehouse.status || warehouse.status === "active");
  const activeSuppliers = suppliers.filter((supplier) => {
    const text = `${supplier.name || ""} ${supplier.email || ""}`.toLowerCase();
    const isNonFood = /(medical|equipment|hardware|device)/i.test(text);
    return !isNonFood && (!supplier.status || supplier.status === "active") && (!supplier.role || supplier.role === "supplier");
  });
  const selectableWarehouses = activeWarehouses.filter((warehouse) => warehouse._id !== assignedWarehouse.id);
  const warehousePlaceholder = warehousesLoading
    ? "جاري تحميل المخازن..."
    : selectableWarehouses.length ? "اختر المخزن" : "لا توجد مخازن مصدر متاحة";
  const supplierPlaceholder = suppliersLoading
    ? "جاري تحميل الموردين..."
    : activeSuppliers.length ? "اختر المورد" : "لا يوجد موردون نشطون";

  const getProductPrice = (productId) => {
    const product = products.find((entry) => entry._id === productId);
    return getEffectiveProductUnitPrice(product);
  };
  const formatProductPrice = (productId) => {
    if (!productId) return "اختر الصنف";
    return getProductPrice(productId).toLocaleString("ar-EG");
  };
  const getItemTotal = (item) => Number(item.quantity || 0) * getProductPrice(item.product_id);

  const addItem = () => {
    setItems((current) => [...current, { id: Date.now().toString(), product_id: "", quantity: "" }]);
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRequestTypeChange = (value) => {
    setRequestType(value);
    setSupplierId("");
    setSourceWarehouseId("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!assignedWarehouse.id) {
      setMessage("لم يتم تعيين مخزن لهذا المستخدم. يرجى التواصل مع المسؤول.");
      return;
    }
    if (requestType === "supplier_request" && !supplierId) {
      setMessage("يرجى اختيار المورد.");
      return;
    }
    if (requestType === "warehouse_request" && !sourceWarehouseId) {
      setMessage("يرجى اختيار المخزن المطلوب منه.");
      return;
    }
    if (!isValidDateInput(expectedDeliveryDate)) {
      setMessage("أدخل تاريخ تسليم صحيحًا بين سنة 2000 و2100.");
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
      navigate("/ar/user/requests");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إنشاء الطلب");
    } finally {
      setSaving(false);
    }
  };

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <PageHeaderAr title="إنشاء طلب توريد" subtitle="اختر نوع الطلب ثم حدد المخزن أو المورد المطلوب" />

    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {message && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D] text-right">{message}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="text-right">معلومات الطلب</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            label="نوع الطلب"
            options={[
              { value: "warehouse_request", label: "طلب من مخزن" },
              { value: "supplier_request", label: "طلب من مورد" }
            ]}
            value={requestType}
            onChange={(event) => handleRequestTypeChange(event.target.value)}
          />

          {requestType === "warehouse_request" ? <Select
            label="المخزن المطلوب منه"
            options={[
              { value: "", label: warehousePlaceholder, disabled: !selectableWarehouses.length },
              ...selectableWarehouses.map((warehouse) => ({ value: warehouse._id, label: getLocalizedValue(warehouse, "name", "ar") }))
            ]}
            value={sourceWarehouseId}
            onChange={(event) => setSourceWarehouseId(event.target.value)}
            disabled={warehousesLoading}
            error={warehousesError ? "فشل تحميل المخازن" : ""}
            required
          /> : <Select
            label="المورد"
            options={[
              { value: "", label: supplierPlaceholder, disabled: !activeSuppliers.length },
              ...activeSuppliers.map((supplier) => ({ value: supplier._id, label: getLocalizedDisplayName(supplier, "ar") || supplier.email }))
            ]}
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            disabled={suppliersLoading}
            error={suppliersError ? "فشل تحميل الموردين" : ""}
            required
          />}

          <div>
            <p className="block mb-1.5 text-sm font-medium text-[#2E3A24] text-right">مخزن الاستلام</p>
            <div className="rounded-xl border border-[#4E4631]/15 bg-[#ECEEE2]/60 px-4 py-2.5 text-sm text-[#2E3A24] text-right">
              {getLocalizedValue(assignedWarehouse, "name", "ar") || localizeText(assignedWarehouse.name, "ar") || "غير محدد"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4" />
            إضافة صنف
          </Button>
          <CardTitle className="text-right">الأصناف المطلوبة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {items.map((item, index) => <div key={item.id} className="p-4 border border-border rounded-xl">
            <div className="flex items-center justify-between mb-4">
              {items.length > 1 && <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="p-1.5 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors"
                aria-label="حذف الصنف"
              >
                <Trash2 className="w-4 h-4" />
              </button>}
              <p className="font-medium text-foreground text-right">الصنف {index + 1}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Select
                label="الصنف"
                options={[
                  { value: "", label: productsLoading ? "جاري تحميل الأصناف..." : productsError || "اختر الصنف" },
                  ...products.map((product) => ({
                    value: product._id,
                    label: `${getLocalizedValue(product, "name", "ar")} (${product.quantity} ${product.unit})`
                  }))
                ]}
                value={item.product_id}
                onChange={(event) => updateItem(item.id, "product_id", event.target.value)}
                disabled={productsLoading}
                required
              />
              <Input
                label="الكمية"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
                required
                className="text-right"
              />
              <div>
                <p className="block mb-1.5 text-sm font-medium text-[#2E3A24] text-right">سعر الوحدة</p>
                <div className="rounded-xl border border-[#4E4631]/15 bg-[#ECEEE2]/60 px-4 py-2.5 text-sm text-[#2E3A24] text-right">
                  {formatProductPrice(item.product_id)}
                </div>
              </div>
              <div>
                <p className="block mb-1.5 text-sm font-medium text-[#2E3A24] text-right">الإجمالي</p>
                <div className="rounded-xl border border-[#4E4631]/15 bg-[#ECEEE2]/60 px-4 py-2.5 text-sm text-[#2E3A24] text-right">
                  {getItemTotal(item).toLocaleString("ar-EG")}
                </div>
              </div>
            </div>
          </div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-right">ملاحظات إضافية</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full px-4 py-3 rounded-xl border-2 border-border bg-input-background text-foreground min-h-[110px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-right"
            placeholder="أضف أي ملاحظات..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          {requestType === "supplier_request" && <Input
            label="تاريخ التسليم المتوقع"
            type="date"
            min={MIN_DATE_INPUT}
            max={MAX_DATE_INPUT}
            value={expectedDeliveryDate}
            onChange={(event) => setExpectedDeliveryDate(event.target.value)}
            className="text-right"
          />}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => navigate("/ar/user/requests")}>
          إلغاء
        </Button>
        <Button type="submit" disabled={saving}>
          <Send className="w-4 h-4" />
          {saving ? "جاري الإرسال..." : "إرسال الطلب"}
        </Button>
      </div>
    </form>
  </div>;
};

export {
  CreateRequestAr
};
