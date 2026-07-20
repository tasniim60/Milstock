import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { StatCardAr } from "../../components/ar/StatCardAr";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ExportCsvButton } from "../../components/ExportCsvButton";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { MapPin, Package, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { getLocalizedDisplayName, getLocalizedValue } from "../../lib/localization";

const initialWarehouseForm = {
  name: "",
  nameAr: "",
  code: "",
  location: "",
  locationAr: "",
  capacity: "",
  status: "active"
};

const WarehouseLocationsAr = () => {
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
      setFormError("اسم المخزن مطلوب.");
      return;
    }
    if (!warehouseForm.location.trim()) {
      setFormError("موقع المخزن مطلوب.");
      return;
    }
    if (Number.isNaN(capacity) || capacity < 0) {
      setFormError("السعة يجب أن تكون 0 أو أكبر.");
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
      setFormSuccess("تم إنشاء المخزن بنجاح.");
      refreshWarehouses();
    } catch (error) {
      setFormError(error.message || "تعذر إنشاء المخزن.");
    } finally {
      setSavingWarehouse(false);
    }
  };

  const warehouseCards = warehouses.map((warehouse) => {
    const rows = stockRows.filter((row) => row.warehouse_id?._id === warehouse._id);
    const used = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    const savedCapacity = Number(warehouse.capacity || 0);
    const capacity = savedCapacity > 0 ? savedCapacity : Math.max(used + 1000, 5000);
    const usagePercent = capacity ? Math.round(used / capacity * 100) : 0;
    const currentStock = used;
    const categoryTotals = rows.reduce((totals, row) => {
      const category = getLocalizedValue(row.product_id, "category", "ar") || "غير مصنف";
      const safeCategory = String(category || "").trim();
      if (!safeCategory || safeCategory.includes("�")) return totals;
      totals[safeCategory] = (totals[safeCategory] || 0) + Number(row.quantity || 0);
      return totals;
    }, {});
    const categories = Object.entries(categoryTotals).map(([name, items]) => ({
      name,
      items,
      percentage: currentStock ? Math.round(items / currentStock * 100) : 0
    }));

    return {
      id: warehouse._id,
      name: getLocalizedValue(warehouse, "name", "ar"),
      location: getLocalizedValue(warehouse, "location", "ar"),
      manager: getLocalizedDisplayName(warehouse.user_id, "ar") || "غير محدد",
      used,
      capacity,
      usagePercent,
      categories,
      status: warehouse.status === "inactive" ? "inactive" : usagePercent >= 95 ? "full" : "operational"
    };
  });

  const total = warehouseCards.reduce((sum, warehouse) => sum + warehouse.capacity, 0);
  const totalUsed = warehouseCards.reduce((sum, warehouse) => sum + warehouse.used, 0);
  const operational = warehouseCards.filter((warehouse) => warehouse.status === "operational").length;
  const loading = warehousesLoading || stockLoading;
  const exportColumns = [
    { key: "name", header: "المستودع" },
    { key: "location", header: "الموقع" },
    { key: "manager", header: "مدير المستودع" },
    { key: "used", header: "المخزون الحالي" },
    { key: "capacity", header: "السعة" },
    { key: "usagePercent", header: "نسبة الإشغال" },
    { header: "الفئات", value: (row) => row.categories.map((category) => category.name).join(", ") },
    { key: "status", header: "الحالة" }
  ];

  const openWarehouseDashboard = (warehouseId) => {
    if (!warehouseId) return;
    navigate(`/ar/admin/warehouses/${warehouseId}/dashboard`);
  };

  const handleWarehouseKeyDown = (event, warehouseId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWarehouseDashboard(warehouseId);
    }
  };

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <PageHeaderAr
      title="مواقع التخزين"
      subtitle="نفس المستودعات المستخدمة في الواجهة الإنجليزية"
      action={{
        label: "إضافة مخزن",
        onClick: () => {
          setShowCreateForm((current) => !current);
          setFormError("");
          setFormSuccess("");
        },
        icon: Plus
      }}
    />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCardAr title="إجمالي المستودعات" value={warehouseCards.length} icon={MapPin} color="primary" />
      <StatCardAr title="مستودعات تشغيلية" value={operational} icon={CheckCircle} color="success" />
      <StatCardAr title="إجمالي السعة" value={`${(total / 1000).toFixed(0)}k`} icon={Package} color="primary" />
      <StatCardAr
        title="نسبة الإشغال"
        value={`${total ? Math.round(totalUsed / total * 100) : 0}%`}
        icon={AlertTriangle}
        trend={{ value: `${totalUsed} من ${total}`, isPositive: true }}
        color="warning"
      />
    </div>

    {(showCreateForm || formError || formSuccess) && <Card>
      <CardHeader>
        <CardTitle>إضافة مخزن جديد</CardTitle>
      </CardHeader>
      <CardContent>
        {formError && <div className="mb-4 rounded-xl border border-[#D4183D]/25 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{formError}</div>}
        {formSuccess && <div className="mb-4 rounded-xl border border-[#6A7B4D]/25 bg-[#6A7B4D]/10 px-4 py-3 text-sm text-[#4B5B3A]">{formSuccess}</div>}
        {showCreateForm && <form onSubmit={handleCreateWarehouse} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
          <Input
            label="اسم المخزن"
            placeholder="مخزن المواد الجافة"
            value={warehouseForm.name}
            onChange={(event) => updateWarehouseForm("name", event.target.value)}
          />
          <Input
            label="الاسم العربي للمخزن"
            placeholder="مخزن المواد الجافة"
            value={warehouseForm.nameAr}
            onChange={(event) => updateWarehouseForm("nameAr", event.target.value)}
          />
          <Input
            label="الكود"
            placeholder="WH-DRY"
            value={warehouseForm.code}
            onChange={(event) => updateWarehouseForm("code", event.target.value)}
          />
          <Input
            label="الموقع"
            placeholder="منطقة التخزين الرئيسية A"
            value={warehouseForm.location}
            onChange={(event) => updateWarehouseForm("location", event.target.value)}
          />
          <Input
            label="الموقع بالعربية"
            placeholder="منطقة التخزين الرئيسية أ"
            value={warehouseForm.locationAr}
            onChange={(event) => updateWarehouseForm("locationAr", event.target.value)}
          />
          <Input
            label="السعة"
            type="number"
            min="0"
            placeholder="50000"
            value={warehouseForm.capacity}
            onChange={(event) => updateWarehouseForm("capacity", event.target.value)}
          />
          <Select
            label="الحالة"
            value={warehouseForm.status}
            onChange={(event) => updateWarehouseForm("status", event.target.value)}
            options={[
              { value: "active", label: "نشط" },
              { value: "inactive", label: "غير نشط" }
            ]}
          />
          <div className="flex items-end justify-start gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setWarehouseForm(initialWarehouseForm);
                setFormError("");
              }}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={savingWarehouse}>
              {savingWarehouse ? "جاري الحفظ..." : "حفظ المخزن"}
            </Button>
          </div>
        </form>}
      </CardContent>
    </Card>}

    <div className="flex items-center justify-between gap-3">
      <ExportCsvButton filenamePrefix="warehouses-export" columns={exportColumns} rows={loading ? [] : warehouseCards}>
        تصدير
      </ExportCsvButton>
      <p className="text-sm text-[#5A6B50] text-right">
        {loading ? "جاري تحميل المستودعات..." : warehousesError || `${warehouseCards.length} مستودعات محملة`}
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {!loading && warehouseCards.map((warehouse) => {
        const barColor = warehouse.usagePercent >= 95 ? "#D4183D" : warehouse.usagePercent >= 80 ? "#C9A961" : "#6A7B4D";
        return <Card
          key={warehouse.id}
          role="button"
          tabIndex={0}
          onClick={() => openWarehouseDashboard(warehouse.id)}
          onKeyDown={(event) => handleWarehouseKeyDown(event, warehouse.id)}
          className="cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6A7B4D]/30"
        >
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="text-right">
              <CardTitle>{warehouse.name}</CardTitle>
              <div className="flex items-center gap-1 mt-1 flex-row-reverse justify-end">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{warehouse.location}</p>
              </div>
            </div>
            <Badge variant={warehouse.status === "full" ? "danger" : warehouse.status === "inactive" ? "neutral" : "success"}>
              {warehouse.status === "full" ? "ممتلئ" : warehouse.status === "inactive" ? "غير نشط" : "تشغيلي"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{warehouse.used.toLocaleString()} / {warehouse.capacity.toLocaleString()}</span>
                <span className="font-medium text-foreground">نسبة الإشغال: {warehouse.usagePercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(warehouse.usagePercent, 100)}%`, backgroundColor: barColor }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-right">
              <div>
                <p className="text-muted-foreground text-xs mb-1">مدير المستودع</p>
                <p className="font-medium text-foreground">{warehouse.manager}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">عدد الأصناف</p>
                <p className="font-medium text-foreground">{warehouse.categories.length}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-2">فئات المخزون</p>
                <div className="space-y-2">
                  {warehouse.categories.length === 0 && <p className="text-xs text-muted-foreground">لا توجد أصناف</p>}
                  {warehouse.categories.map((category) => <div key={category.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{category.items} ({category.percentage}%)</span>
                      <span className="text-muted-foreground">{category.name}</span>
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
  WarehouseLocationsAr
};
