import { useEffect, useMemo, useState } from "react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { AlertTriangle, Save } from "lucide-react";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { normalizeRecord } from "../../lib/normalize";
import { getLocalizedValue } from "../../lib/localization";

const emptyForm = {
  low_stock_threshold: "",
  critical_stock_threshold: "",
  expiration_warning_days: "30",
  critical_expiration_days: "7"
};

const SettingsPageAr = () => {
  const { data: products, loading: productsLoading, error: productsError } = useApiResource(() => api.products.list(), []);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === selectedProductId),
    [products, selectedProductId]
  );

  useEffect(() => {
    if (!selectedProductId) {
      setForm(emptyForm);
      return;
    }

    setMessage("");
    setError("");
    setLoadingSettings(false);
    setForm({
      low_stock_threshold: String(selectedProduct?.alert_settings?.low_stock_threshold ?? selectedProduct?.min_quantity ?? ""),
      critical_stock_threshold: String(selectedProduct?.alert_settings?.critical_stock_threshold ?? ""),
      expiration_warning_days: String(selectedProduct?.alert_settings?.expiration_warning_days ?? 30),
      critical_expiration_days: String(selectedProduct?.alert_settings?.critical_expiration_days ?? 7)
    });
  }, [selectedProductId, selectedProduct]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError("");
    setMessage("");
  };

  const validate = () => {
    if (!selectedProductId) return "يرجى اختيار المنتج.";
    const values = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)]));
    if (Object.values(values).some((value) => Number.isNaN(value))) return "كل قيم الحدود مطلوبة.";
    if (Object.values(values).some((value) => value < 0)) return "لا يمكن أن تكون القيم سالبة.";
    if (values.critical_stock_threshold > values.low_stock_threshold) return "حد المخزون الحرج يجب أن يكون أقل من أو يساوي حد انخفاض المخزون.";
    if (values.critical_expiration_days > values.expiration_warning_days) return "أيام الانتهاء الحرج يجب أن تكون أقل من أو تساوي أيام تنبيه انتهاء الصلاحية.";
    return "";
  };

  const handleSave = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)]));
      let settings = payload;
      try {
        const response = await api.products.updateAlertSettings(selectedProductId, payload);
        settings = normalizeRecord(response);
      } catch (requestError) {
        if (!String(requestError.message || "").includes("not found")) {
          throw requestError;
        }
        await api.products.update(selectedProductId, { alert_settings: payload });
      }
      setForm({
        low_stock_threshold: String(settings.low_stock_threshold),
        critical_stock_threshold: String(settings.critical_stock_threshold),
        expiration_warning_days: String(settings.expiration_warning_days),
        critical_expiration_days: String(settings.critical_expiration_days)
      });
      setMessage("تم حفظ إعدادات حدود المنتج بنجاح.");
    } catch (requestError) {
      setError(requestError.message || "تعذر حفظ إعدادات حدود المنتج.");
    } finally {
      setSaving(false);
    }
  };

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
      <PageHeaderAr title="إعدادات النظام" subtitle="ضبط حدود التنبيه الخاصة بكل منتج" />

      <div className="max-w-4xl space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5 flex-row-reverse justify-end">
              <CardTitle className="text-right">حدود تنبيه المنتج</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#6A7B4D]/12 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#6A7B4D]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {message && <div className="rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e] text-right">{message}</div>}
              {error && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D] text-right">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="المنتج"
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  disabled={productsLoading}
                  className="text-right"
                  options={[
                    { value: "", label: productsLoading ? "جاري تحميل المنتجات..." : productsError || "اختر المنتج...", disabled: true },
                    ...products.map((product) => ({
                      value: product._id,
                      label: `${getLocalizedValue(product, "name", "ar")}${product.item_id || product.code || product.serial_number ? ` (${product.item_id || product.code || product.serial_number})` : ""}`
                    }))
                  ]}
                />
                <div>
                  <p className="block mb-1.5 text-sm font-medium text-[#2E3A24] text-right">الوحدة</p>
                  <div className="rounded-xl border border-[#4E4631]/15 bg-[#ECEEE2]/60 px-4 py-2.5 text-sm text-[#2E3A24] text-right">
                    {selectedProduct?.unit || "اختر منتجاً"}
                  </div>
                </div>
                <Input label={`حد انخفاض المخزون${selectedProduct?.unit ? ` (${selectedProduct.unit})` : ""}`} type="number" min="0" value={form.low_stock_threshold} onChange={updateField("low_stock_threshold")} disabled={!selectedProductId || loadingSettings} className="text-right" />
                <Input label={`حد المخزون الحرج${selectedProduct?.unit ? ` (${selectedProduct.unit})` : ""}`} type="number" min="0" value={form.critical_stock_threshold} onChange={updateField("critical_stock_threshold")} disabled={!selectedProductId || loadingSettings} className="text-right" />
                <Input label="أيام تنبيه انتهاء الصلاحية" type="number" min="0" value={form.expiration_warning_days} onChange={updateField("expiration_warning_days")} disabled={!selectedProductId || loadingSettings} className="text-right" />
                <Input label="أيام الانتهاء الحرج" type="number" min="0" value={form.critical_expiration_days} onChange={updateField("critical_expiration_days")} disabled={!selectedProductId || loadingSettings} className="text-right" />
              </div>
              <Button onClick={handleSave} disabled={!selectedProductId || saving || loadingSettings}>
                <Save className="w-4 h-4" />
                {saving ? "جاري الحفظ..." : "حفظ إعدادات حدود المنتج"}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>;
};

export {
  SettingsPageAr
};
