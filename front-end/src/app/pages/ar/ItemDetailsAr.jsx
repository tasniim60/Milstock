import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, Calendar, Edit, MapPin, Package, Trash2 } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";
import { formatDate, getProductStatus } from "../../lib/format";
import { getLocalizedValue, localizeText } from "../../lib/localization";

const fieldValue = (value) => value || "غير محدد";
const unitLabelsAr = {
  kg: "كجم",
  g: "جم",
  liter: "لتر",
  Tons: "طن",
  ton: "طن",
  piece: "قطعة",
  pieces: "قطعة",
  pcs: "قطعة",
  unit: "وحدة",
  units: "وحدة",
  box: "صندوق",
  boxes: "صندوق"
};

const formatNumberAr = (value) => Number(value || 0).toLocaleString("ar-EG");
const formatUnitAr = (unit) => {
  const normalized = String(unit || "").trim();
  return unitLabelsAr[normalized] || unitLabelsAr[normalized.toLowerCase()] || normalized;
};
const formatQuantityAr = (quantity, unit) => `${formatNumberAr(quantity)} ${formatUnitAr(unit)}`.trim();

const ItemDetailsAr = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.products.get(id)
      .then((response) => {
        if (!active) return;
        setProduct(response?.data || response?.product || response || null);
      })
      .catch((requestError) => {
        if (!active) return;
        setProduct(null);
        setError(requestError.message || "تعذر تحميل بيانات الصنف.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div dir="rtl" className="p-6 lg:p-8"><Card><CardContent className="py-10 text-center text-muted-foreground">جار تحميل الصنف...</CardContent></Card></div>;
  }

  if (error || !product) {
    return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate("/ar/admin/inventory")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] transition-colors text-sm">
        <ArrowRight className="w-4 h-4" />
        العودة إلى المخزون
      </button>
      <Card><CardContent className="py-10 text-center text-muted-foreground">{error || "الصنف غير موجود."}</CardContent></Card>
    </div>;
  }

  const expirationDate = product.expiration_date || product.expiry_date;
  const productName = getLocalizedValue(product, "name", "ar") || "صنف مخزون";
  const productCategory = getLocalizedValue(product, "category", "ar");
  const productDescription = getLocalizedValue(product, "description", "ar");
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
  const warehouseStock = mergeWarehouseRows(
    Array.isArray(product.warehouses) && product.warehouses.length
      ? product.warehouses.map((warehouse) => ({
        ...warehouse,
        name: getLocalizedValue(warehouse, "name", "ar") || warehouse.name || "غير محدد",
        location: getLocalizedValue(warehouse, "location", "ar") || warehouse.location || "",
        quantity: Number(warehouse.quantity || 0),
        unit: warehouse.unit || product.unit,
      }))
      : (product.warehouse_id || product.warehouse_name ? [{
      id: product.warehouse_id?._id || product.warehouse_id || "legacy-warehouse",
      name: getLocalizedValue(product.warehouse_id, "name", "ar") || localizeText(product.warehouse_name, "ar") || "غير محدد",
      code: product.warehouse_id?.code,
      location: getLocalizedValue(product.warehouse_id, "location", "ar"),
      quantity: product.quantity ?? 0,
      unit: product.unit,
    }] : [])
  );
  const totalStock = warehouseStock.length
    ? warehouseStock.reduce((sum, warehouse) => sum + Number(warehouse.quantity || 0), 0)
    : Number(product.totalStock ?? product.quantity ?? 0);
  const primaryWarehouse = warehouseStock[0] || {
    name: getLocalizedValue(product.warehouse_id, "name", "ar") || localizeText(product.warehouse_name, "ar") || "غير محدد",
    code: product.warehouse_id?.code,
    location: getLocalizedValue(product.warehouse_id, "location", "ar"),
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
  const statusLabels = {
    "in-stock": "متوفر",
    critical: "حرج",
    "low-stock": "مخزون منخفض",
    "out-of-stock": "نفد المخزون",
    "expiring-soon": "ينتهي قريباً"
  };
  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.products.remove(id);
      setSuccessMessage("\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0635\u0646\u0641 \u0628\u0646\u062c\u0627\u062d.");
      window.setTimeout(() => navigate("/ar/admin/inventory"), 500);
    } catch (requestError) {
      setDeleteError(requestError.message || "\u062a\u0639\u0630\u0631 \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0635\u0646\u0641.");
      setDeleting(false);
    }
  };

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <button onClick={() => navigate("/ar/admin/inventory")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] transition-colors text-sm">
      <ArrowRight className="w-4 h-4" />
      العودة إلى المخزون
    </button>

    <PageHeaderAr
      title={productName}
      subtitle={`${String(product._id || id).slice(-8).toUpperCase()} • ${productCategory || "غير محدد"}`}
      actions={[
        { label: "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0635\u0646\u0641", onClick: () => navigate(`/ar/admin/inventory/${id}/edit`), icon: Edit },
        { label: deleting ? "\u062c\u0627\u0631 \u0627\u0644\u062d\u0630\u0641..." : "\u062d\u0630\u0641", onClick: () => setShowDeleteConfirm(true), icon: Trash2, variant: "danger", disabled: deleting }
      ]}
    />
    {successMessage && <div className="rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e] text-right">{successMessage}</div>}
    {deleteError && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D] text-right">{deleteError}</div>}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <div className="flex items-start justify-between gap-4 text-right">
          <div>
            <p className="text-sm text-muted-foreground">الكمية الحالية</p>
            <p className="text-3xl font-bold text-foreground">{formatNumberAr(totalStock)}</p>
            <p className="text-sm text-muted-foreground">{formatUnitAr(product.unit)}</p>
          </div>
          <Package className="w-8 h-8 text-[#6A7B4D] shrink-0" />
        </div>
      </Card>
      <Card>
        <div className="flex items-start justify-between gap-4 text-right">
          <div>
            <p className="text-sm text-muted-foreground">المخازن</p>
            <p className="text-2xl font-bold text-foreground">{warehouseStock.length > 1 ? `${formatNumberAr(warehouseStock.length)} مخازن` : primaryWarehouse.name}</p>
            <p className="text-sm text-muted-foreground">{warehouseStock.length > 1 ? "راجع توزيع المخزون بالأسفل" : primaryWarehouse.location || product.storage_section || "لا يوجد قسم تخزين"}</p>
          </div>
          <MapPin className="w-8 h-8 text-[#6A7B4D] shrink-0" />
        </div>
      </Card>
      <Card>
        <div className="flex items-start justify-between gap-4 text-right">
          <div>
            <p className="text-sm text-muted-foreground">تاريخ انتهاء الصلاحية</p>
            <p className="text-2xl font-bold text-foreground">{formatDate(expirationDate, "ar-EG")}</p>
            <Badge variant={statusVariant} className="mt-2">{statusLabels[status] || status}</Badge>
          </div>
          <Calendar className="w-8 h-8 text-[#6A7B4D] shrink-0" />
        </div>
      </Card>
    </div>

    <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-right">تفاصيل الصنف</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
              {[
                ["الفئة", productCategory],
                ["الوحدة", formatUnitAr(product.unit)],
                ["حد انخفاض المخزون", formatQuantityAr(product.alert_settings?.low_stock_threshold ?? product.min_quantity, product.unit)],
                ["حد المخزون الحرج", formatQuantityAr(product.alert_settings?.critical_stock_threshold ?? 0, product.unit)],
                ["تاريخ التصنيع", formatDate(product.manufacturing_date, "ar-EG")],
                ["رقم التشغيلة", product.batch_number],
                ["الرقم التسلسلي", product.serial_number],
                ["موقع المخزن", warehouseStock.length > 1 ? `${formatNumberAr(warehouseStock.length)} مواقع مخازن` : primaryWarehouse.location],
                ["قسم التخزين", product.storage_section]
              ].map(([label, value]) => <div key={label}>
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p className="text-foreground font-medium">{fieldValue(value)}</p>
              </div>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-right">المخزون حسب المخزن</CardTitle></CardHeader>
          <CardContent>
            {warehouseStock.length === 0 ? <div className="rounded-xl border border-[#4E4631]/10 bg-[#ECEEE2]/50 px-4 py-6 text-center text-sm text-[#5A6B50]">
              لا توجد كميات مخزنة لهذا الصنف في أي مخزن
            </div> : <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-[#4E4631]/10 text-[#5A6B50]">
                    <th className="py-2 pl-3">المخزن</th>
                    <th className="py-2 pl-3">الكود / الموقع</th>
                    <th className="py-2 pl-3">كمية المخزون</th>
                    <th className="py-2 pl-3">الوحدة</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseStock.map((warehouse) => <tr key={warehouse.id || warehouse._id || warehouse.name} className="border-b border-[#4E4631]/5">
                    <td className="py-2 pl-3 font-medium text-[#2E3A24]">{warehouse.name || "مخزن بدون اسم"}</td>
                    <td className="py-2 pl-3 text-[#5A6B50]">
                      {[warehouse.code, warehouse.location].filter(Boolean).join(" / ") || "غير محدد"}
                    </td>
                    <td className="py-2 pl-3 font-semibold text-[#2E3A24]">{formatNumberAr(warehouse.quantity)}</td>
                    <td className="py-2 pl-3">{formatUnitAr(warehouse.unit || product.unit) || "غير محدد"}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-right">تفاصيل إضافية</CardTitle></CardHeader>
          <CardContent className="space-y-5 text-right">
            <div><p className="text-sm text-muted-foreground mb-2">الوصف</p><p className="text-foreground">{fieldValue(productDescription)}</p></div>
            <div><p className="text-sm text-muted-foreground mb-2">ملاحظات</p><p className="text-foreground">{fieldValue(product.notes)}</p></div>
          </CardContent>
        </Card>
    </div>

    {showDeleteConfirm && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#4E4631]/10 shadow-xl p-6 text-right">
        <h3 className="text-[#2E3A24] font-semibold mb-2">{"\u062d\u0630\u0641 \u0627\u0644\u0635\u0646\u0641"}</h3>
        <p className="text-sm text-[#5A6B50] mb-5">{"\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0623\u0646\u0643 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0635\u0646\u0641\u061f"}</p>
        {deleteError && <p className="mb-4 rounded-lg border border-[#D4183D]/20 bg-[#D4183D]/10 px-3 py-2 text-sm text-[#D4183D]">{deleteError}</p>}
        <div className="flex flex-col sm:flex-row justify-start gap-3">
          <Button variant="outline" type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>{"\u0625\u0644\u063a\u0627\u0621"}</Button>
          <Button variant="danger" type="button" onClick={handleDelete} disabled={deleting}>{deleting ? "\u062c\u0627\u0631 \u0627\u0644\u062d\u0630\u0641..." : "\u062d\u0630\u0641"}</Button>
        </div>
      </div>
    </div>}
  </div>;
};

export {
  ItemDetailsAr
};


