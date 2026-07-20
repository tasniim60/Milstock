import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { AlertTriangle } from "lucide-react";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { normalizeRecord } from "../lib/normalize";
import { getLocalizedValue } from "../lib/localization";

const emptyForm = {
  low_stock_threshold: "",
  critical_stock_threshold: "",
  expiration_warning_days: "30",
  critical_expiration_days: "7"
};

const SettingsPage = () => {
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
    if (!selectedProductId) return "Please select a product.";
    const values = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)]));
    if (Object.values(values).some((value) => Number.isNaN(value))) return "All threshold values are required.";
    if (Object.values(values).some((value) => value < 0)) return "Threshold values cannot be negative.";
    if (values.critical_stock_threshold > values.low_stock_threshold) return "Critical stock threshold must be less than or equal to low stock threshold.";
    if (values.critical_expiration_days > values.expiration_warning_days) return "Critical expiration days must be less than or equal to expiration warning days.";
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
      setMessage("Product threshold settings saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to save product threshold settings.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="System Settings" subtitle="Configure product-specific alert thresholds" />

      <div className="max-w-4xl space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6A7B4D]/12 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#6A7B4D]" />
              </div>
              <CardTitle>Product Alert Thresholds</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {message && <div className="rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e]">{message}</div>}
              {error && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Product"
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  disabled={productsLoading}
                  options={[
                    { value: "", label: productsLoading ? "Loading products..." : productsError || "Select product...", disabled: true },
                    ...products.map((product) => ({
                      value: product._id,
                      label: `${getLocalizedValue(product, "name", "en")}${product.item_id || product.code || product.serial_number ? ` (${product.item_id || product.code || product.serial_number})` : ""}`
                    }))
                  ]}
                />
                <div>
                  <p className="block mb-1.5 text-sm font-medium text-[#2E3A24]">Unit</p>
                  <div className="rounded-xl border border-[#4E4631]/15 bg-[#ECEEE2]/60 px-4 py-2.5 text-sm text-[#2E3A24]">
                    {selectedProduct?.unit || "Select a product"}
                  </div>
                </div>
                <Input label={`Low Stock Threshold${selectedProduct?.unit ? ` (${selectedProduct.unit})` : ""}`} type="number" min="0" value={form.low_stock_threshold} onChange={updateField("low_stock_threshold")} disabled={!selectedProductId || loadingSettings} />
                <Input label={`Critical Stock Threshold${selectedProduct?.unit ? ` (${selectedProduct.unit})` : ""}`} type="number" min="0" value={form.critical_stock_threshold} onChange={updateField("critical_stock_threshold")} disabled={!selectedProductId || loadingSettings} />
                <Input label="Expiration Warning Days" type="number" min="0" value={form.expiration_warning_days} onChange={updateField("expiration_warning_days")} disabled={!selectedProductId || loadingSettings} />
                <Input label="Critical Expiration Days" type="number" min="0" value={form.critical_expiration_days} onChange={updateField("critical_expiration_days")} disabled={!selectedProductId || loadingSettings} />
              </div>
              <Button onClick={handleSave} disabled={!selectedProductId || saving || loadingSettings}>
                {saving ? "Saving..." : "Save Product Threshold Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>;
};

export {
  SettingsPage
};
