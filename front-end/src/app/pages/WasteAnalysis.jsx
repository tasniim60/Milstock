import { useCallback, useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { AlertTriangle, PackageX, Save, Sparkles } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PageHeaderAr } from "../components/ar/PageHeaderAr";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Table } from "../components/Table";
import { api } from "../lib/api";
import { getStoredAuth } from "../lib/auth";
import { formatDate } from "../lib/format";
import { getLocalizedDisplayName, getLocalizedValue } from "../lib/localization";
import { normalizeArray, normalizeRecord } from "../lib/normalize";
import { useApiResource } from "../lib/useApiResource";

const labels = {
  en: {
    title: "Waste Analysis",
    subtitle: "Track expired and damaged inventory waste",
    totalWaste: "Total Waste",
    expired: "Expired",
    damaged: "Damaged",
    chartTitle: "Waste Analysis",
    chartSubtitle: "Expired and damaged quantities by month",
    expiredItems: "Expired Items",
    damagedItems: "Damaged Items",
    addTitle: "Add Waste Record",
    product: "Product",
    quantity: "Quantity",
    reason: "Reason",
    notes: "Notes",
    save: "Save",
    saving: "Saving...",
    selectProduct: "Select product...",
    success: "Waste record saved successfully.",
    required: "Product, quantity, and reason are required.",
    recentTitle: "Latest Waste Records",
    addedBy: "Added By",
    date: "Date",
    empty: "No waste records found.",
    noNotes: "N/A",
    noProducts: "No products available",
    loadingProducts: "Loading products...",
  },
  ar: {
    title: "تحليل الهدر",
    subtitle: "متابعة المنتجات منتهية الصلاحية والتالفة",
    totalWaste: "إجمالي الهدر",
    expired: "منتهي الصلاحية",
    damaged: "تالف",
    chartTitle: "تحليل الهدر",
    chartSubtitle: "الكميات منتهية الصلاحية والتالفة حسب الشهر",
    expiredItems: "أصناف منتهية الصلاحية",
    damagedItems: "أصناف تالفة",
    addTitle: "إضافة هدر جديد",
    product: "المنتج",
    quantity: "الكمية",
    reason: "السبب",
    notes: "ملاحظات",
    save: "حفظ",
    saving: "جاري الحفظ...",
    selectProduct: "اختر المنتج...",
    success: "تم حفظ سجل الهدر بنجاح.",
    required: "المنتج والكمية والسبب مطلوبة.",
    recentTitle: "آخر سجلات الهدر",
    addedBy: "أضيف بواسطة",
    date: "التاريخ",
    empty: "لا توجد سجلات هدر.",
    noNotes: "غير محدد",
    noProducts: "لا توجد منتجات متاحة",
    loadingProducts: "جاري تحميل المنتجات...",
  }
};

const reasonVariant = {
  expired: "danger",
  damaged: "warning",
};

const getRows = (records, locale, t) => records.map((record) => ({
  id: record._id,
  product: getLocalizedValue(record.product, "name", locale) || record.productName || t.noNotes,
  quantity: record.quantity,
  reason: record.reason,
  reasonLabel: record.reason === "expired" ? t.expired : t.damaged,
  notes: record.notes || t.noNotes,
  addedBy: getLocalizedDisplayName(record.createdBy, locale) || t.noNotes,
  date: formatDate(record.createdAt),
}));

const StatTile = ({ title, value, icon: Icon, tone = "primary" }) => {
  const toneClass = tone === "danger" ? "text-[#D4183D] bg-[#D4183D]/10" : tone === "warning" ? "text-[#9B6A1A] bg-[#C9A961]/15" : "text-[#6A7B4D] bg-[#6A7B4D]/10";
  return <Card className="p-5">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-[#2E3A24]">{Number(value || 0).toLocaleString()}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${toneClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </Card>;
};

const WasteAnalysisView = ({ isArabic = false }) => {
  const locale = isArabic ? "ar" : "en";
  const t = labels[locale];
  const Header = isArabic ? PageHeaderAr : PageHeader;
  const { role } = getStoredAuth();
  const canCreate = role === "user";
  const [form, setForm] = useState({ product: "", quantity: "", reason: "expired", notes: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyticsState, setAnalyticsState] = useState({ data: null, loading: true, error: "" });
  const { data: products, loading: productsLoading, error: productsError } = useApiResource(
    () => canCreate
      ? api.waste.products().catch(() => api.products.list())
      : Promise.resolve([]),
    [canCreate]
  );

  const refresh = useCallback(() => {
    setAnalyticsState((current) => ({ ...current, loading: true, error: "" }));
    api.waste.analytics().then((response) => {
      setAnalyticsState({ data: normalizeRecord(response), loading: false, error: "" });
    }).catch((requestError) => {
      setAnalyticsState({ data: null, loading: false, error: requestError.message || "Unable to load waste analytics." });
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const analytics = analyticsState.data || {};
  const { loading, error } = analyticsState;
  const chartData = normalizeArray(analytics.chartData).map((row) => ({
    ...row,
    label: isArabic ? row.monthAr || row.month : row.month,
  }));
  const recent = normalizeArray(analytics.recent);
  const totals = analytics.totals || {};
  const rows = useMemo(() => getRows(recent, locale, t), [recent, locale, t]);

  const updateField = (key, value) => {
    setMessage("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.product || !Number(form.quantity) || !form.reason) {
      setMessage(t.required);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await api.waste.create({
        product: form.product,
        quantity: Number(form.quantity),
        reason: form.reason,
        notes: form.notes,
      });
      setForm({ product: "", quantity: "", reason: "expired", notes: "" });
      setMessage(t.success);
      refresh();
    } catch (requestError) {
      setMessage(requestError.message || "Unable to save waste record.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "product", header: t.product },
    { key: "quantity", header: t.quantity },
    {
      key: "reason",
      header: t.reason,
      render: (row) => <Badge variant={reasonVariant[row.reason] || "neutral"}>{row.reasonLabel}</Badge>
    },
    { key: "notes", header: t.notes },
    { key: "addedBy", header: t.addedBy },
    { key: "date", header: t.date },
  ];

  return <div dir={isArabic ? "rtl" : "ltr"} className={`p-6 lg:p-8 space-y-6 ${isArabic ? "text-right" : ""}`}>
    <Header title={t.title} subtitle={t.subtitle} />

    {message && <div className="rounded-xl border border-[#4E4631]/10 bg-white px-4 py-3 text-sm text-[#2E3A24]">{message}</div>}
    {error && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{error}</div>}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatTile title={t.totalWaste} value={totals.totalWaste} icon={Sparkles} />
      <StatTile title={t.expired} value={totals.expired} icon={AlertTriangle} tone="danger" />
      <StatTile title={t.damaged} value={totals.damaged} icon={PackageX} tone="warning" />
    </div>

    {canCreate && <Card>
      <CardHeader>
        <CardTitle>{t.addTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label={t.product}
            value={form.product}
            onChange={(event) => updateField("product", event.target.value)}
            options={[
              { value: "", label: productsLoading ? t.loadingProducts : productsError || (products.length ? t.selectProduct : t.noProducts), disabled: productsLoading || !products.length },
              ...products.map((product) => ({ value: product._id, label: getLocalizedValue(product, "name", locale) }))
            ]}
            disabled={productsLoading || !products.length}
          />
          <Input label={t.quantity} type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} />
          <Select
            label={t.reason}
            value={form.reason}
            onChange={(event) => updateField("reason", event.target.value)}
            options={[
              { value: "expired", label: t.expired },
              { value: "damaged", label: t.damaged },
            ]}
          />
          <Input label={t.notes} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? t.saving : t.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>}

    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t.chartTitle}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t.chartSubtitle}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: isArabic ? 10 : 24, left: isArabic ? 24 : 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E1B7" />
              <XAxis dataKey="label" stroke="#5A6B50" tickLine={false} axisLine={false} />
              <YAxis stroke="#5A6B50" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E0E1B7", color: "#2E3A24" }}
                formatter={(value, name) => [Number(value || 0).toLocaleString(), name === "expired" ? t.expiredItems : t.damagedItems]}
                labelFormatter={(label) => label}
              />
              <Line type="monotone" dataKey="expired" stroke="#D4183D" strokeWidth={3} dot={{ r: 4 }} name="expired" />
              <Line type="monotone" dataKey="damaged" stroke="#C9A961" strokeWidth={3} dot={{ r: 4 }} name="damaged" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-sm text-[#5A6B50]">
          <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#D4183D]" />{t.expiredItems}</span>
          <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#C9A961]" />{t.damagedItems}</span>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{t.recentTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table columns={columns} data={loading ? [] : rows} emptyMessage={loading ? "Loading..." : t.empty} />
      </CardContent>
    </Card>
  </div>;
};

const WasteAnalysis = () => <WasteAnalysisView />;

export {
  WasteAnalysis,
  WasteAnalysisView
};
