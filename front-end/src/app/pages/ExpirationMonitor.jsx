import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { useState } from "react";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate } from "../lib/format";
import { getLocalizedValue } from "../lib/localization";
import { isValidDateValue } from "../lib/dateValidation";
const daysUntil = (date) => {
  if (!date || !isValidDateValue(date)) return Number.POSITIVE_INFINITY;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1e3 * 60 * 60 * 24));
};
const pageCopy = {
  en: {
    title: "Expiration Monitoring",
    subtitle: "Track products approaching expiration dates",
    loading: "Loading expiration data...",
    count: (count) => `${count} monitored products loaded`,
    withinCritical: "Expiring Within 7 Days",
    withinWarning: "Expiring Within 30 Days",
    total: "Total Monitored Items",
    criticalTitle: "Critical - Expiring Within 7 Days",
    warningTitle: "Expiring Within 30 Days",
    allTitle: "All Monitored Items",
    itemId: "Item ID",
    itemName: "Item Name",
    category: "Category",
    quantity: "Quantity",
    expiration: "Expiration Date",
    daysRemaining: "Days Remaining",
    warehouse: "Warehouse",
    status: "Status",
    days: "days",
    unassigned: "Unassigned",
    noCritical: "No critical expiring products.",
    noWarning: "No products expiring within 30 days.",
    noExpiring: "No expiring products found.",
    statusCritical: "critical",
    statusWarning: "warning",
    statusNormal: "normal",
  },
  ar: {
    title: "متابعة تواريخ الصلاحية",
    subtitle: "متابعة الأصناف القريبة من انتهاء الصلاحية",
    loading: "جاري تحميل بيانات الصلاحية...",
    count: (count) => `تم تحميل ${count} صنف تحت المتابعة`,
    withinCritical: "تنتهي خلال 7 أيام",
    withinWarning: "تنتهي خلال 30 يومًا",
    total: "إجمالي الأصناف تحت المتابعة",
    criticalTitle: "حرج - تنتهي خلال 7 أيام",
    warningTitle: "تنتهي خلال 30 يومًا",
    allTitle: "كل الأصناف تحت المتابعة",
    itemId: "رمز الصنف",
    itemName: "اسم الصنف",
    category: "الفئة",
    quantity: "الكمية",
    expiration: "تاريخ انتهاء الصلاحية",
    daysRemaining: "الأيام المتبقية",
    warehouse: "المخزن",
    status: "الحالة",
    days: "يوم",
    unassigned: "غير محدد",
    noCritical: "لا توجد أصناف حرجة قريبة من انتهاء الصلاحية.",
    noWarning: "لا توجد أصناف تنتهي خلال 30 يومًا.",
    noExpiring: "لا توجد أصناف قريبة من انتهاء الصلاحية.",
    statusCritical: "حرج",
    statusWarning: "تنبيه",
    statusNormal: "طبيعي",
  },
};

const ExpirationMonitorView = ({ isArabic = false }) => {
  const locale = isArabic ? "ar" : "en";
  const t = pageCopy[locale];
  const [activeRange, setActiveRange] = useState("critical");
  const { data: products, loading, error } = useApiResource(() => api.products.list(), []);
  const expiringItems = products.filter((product) => isValidDateValue(product.expiration_date || product.expiry_date)).map((product) => {
    const expirationDateValue = product.expiration_date || product.expiry_date;
    const daysRemaining = daysUntil(expirationDateValue);
    const settings = product.alert_settings || {};
    const warningDays = Number(settings.expiration_warning_days ?? 30);
    const criticalDays = Number(settings.critical_expiration_days ?? 7);
    return {
      id: product._id.slice(-8).toUpperCase(),
      name: getLocalizedValue(product, "name", locale),
      category: getLocalizedValue(product, "category", locale),
      quantity: product.quantity,
      unit: product.unit,
      expirationDate: formatDate(expirationDateValue),
      daysRemaining,
      warehouse: getLocalizedValue(product.warehouse_id, "name", locale) || t.unassigned,
      severity: daysRemaining <= criticalDays ? "critical" : daysRemaining <= warningDays ? "warning" : "normal"
    };
  }).filter((item) => item.severity !== "normal").sort((a, b) => a.daysRemaining - b.daysRemaining);
  const criticalItems = expiringItems.filter((item) => item.severity === "critical");
  const warningItems = expiringItems.filter((item) => item.severity === "warning");
  const visibleItems = activeRange === "critical" ? criticalItems : activeRange === "warning" ? warningItems : expiringItems;
  const activeTitle = activeRange === "critical" ? t.criticalTitle : activeRange === "warning" ? t.warningTitle : t.allTitle;
  const emptyMessage = activeRange === "critical" ? t.noCritical : activeRange === "warning" ? t.noWarning : t.noExpiring;
  const columns = [
    { key: "id", header: t.itemId },
    { key: "name", header: t.itemName },
    { key: "category", header: t.category },
    {
      key: "quantity",
      header: t.quantity,
      render: (row) => `${row.quantity} ${row.unit}`
    },
    { key: "expirationDate", header: t.expiration },
    {
      key: "daysRemaining",
      header: t.daysRemaining,
      render: (row) => {
        const color = row.severity === "critical" ? "text-destructive" : row.severity === "warning" ? "text-[#C9A961]" : "text-foreground";
        return <span className={`font-semibold ${color}`}>{row.daysRemaining} {t.days}</span>;
      }
    },
    { key: "warehouse", header: t.warehouse },
    {
      key: "severity",
      header: t.status,
      render: (row) => {
        const variantMap = {
          critical: "danger",
          warning: "warning",
          normal: "success"
        };
        const labelMap = {
          critical: t.statusCritical,
          warning: t.statusWarning,
          normal: t.statusNormal
        };
        return <Badge variant={variantMap[row.severity]}>{labelMap[row.severity]}</Badge>;
      }
    }
  ];
  return <div className="p-6 lg:p-8 space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <p className="text-sm text-[#5A6B50]">
        {loading ? t.loading : error || t.count(expiringItems.length)}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title={t.withinCritical} value={criticalItems.length.toLocaleString(locale === "ar" ? "ar-EG" : "en")} icon={AlertTriangle} color="danger" onClick={() => setActiveRange("critical")} />
        <StatCard title={t.withinWarning} value={warningItems.length.toLocaleString(locale === "ar" ? "ar-EG" : "en")} icon={Clock} color="warning" onClick={() => setActiveRange("warning")} />
        <StatCard title={t.total} value={expiringItems.length.toLocaleString(locale === "ar" ? "ar-EG" : "en")} icon={Calendar} color="primary" onClick={() => setActiveRange("all")} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {activeRange === "critical" ? <AlertTriangle className="w-6 h-6 text-destructive" /> : activeRange === "warning" ? <Clock className="w-6 h-6 text-[#B8862A]" /> : <Calendar className="w-6 h-6 text-[#6A7B4D]" />}
              <CardTitle>{activeTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table columns={columns} data={loading ? [] : visibleItems} emptyMessage={error || emptyMessage} />
          </CardContent>
        </Card>
      </div>
    </div>;
};
const ExpirationMonitor = () => <ExpirationMonitorView />;
export {
  ExpirationMonitor,
  ExpirationMonitorView
};
