import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Edit } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { api } from "../lib/api";
import { normalizeRecord } from "../lib/normalize";
import { formatDate } from "../lib/format";
import { getStoredAuth } from "../lib/auth";
import { getLocalizedDisplayName, getLocalizedValue } from "../lib/localization";

const labelsEn = {
  title: "Consumption Details",
  subtitle: "Review the consumed stock record",
  back: "Back to Consumption",
  edit: "Edit Consumption",
  product: "Product",
  warehouse: "Warehouse",
  quantity: "Consumed Quantity",
  reason: "Reason",
  department: "Department",
  notes: "Notes",
  consumedBy: "Consumed By",
  date: "Date/Time",
  movement: "Related Movement",
  status: "Status",
  completed: "Completed",
  cancelled: "Cancelled",
  notFound: "Consumption record not found.",
};

const labelsAr = {
  title: "تفاصيل الاستهلاك",
  subtitle: "مراجعة سجل الكمية المستهلكة",
  back: "العودة إلى الاستهلاك",
  edit: "تعديل الاستهلاك",
  product: "المنتج",
  warehouse: "المخزن",
  quantity: "الكمية المستهلكة",
  reason: "السبب",
  department: "القسم",
  notes: "ملاحظات",
  consumedBy: "بواسطة",
  date: "التاريخ/الوقت",
  movement: "سجل الحركة المرتبط",
  status: "الحالة",
  completed: "مكتمل",
  cancelled: "ملغي",
  notFound: "سجل الاستهلاك غير موجود.",
};

const getBasePath = (role, isArabic) => {
  const prefix = isArabic ? "/ar" : "";
  return role === "admin" ? `${prefix}/admin/consumptions` : `${prefix}/user/consumptions`;
};

const DetailRow = ({ label, value }) => <div className="rounded-xl bg-[#ECEEE2]/50 px-4 py-3">
  <p className="text-xs text-[#5A6B50]">{label}</p>
  <p className="mt-1 font-medium text-[#2E3A24]">{value || "N/A"}</p>
</div>;

const ConsumptionDetailsView = ({ isArabic = false }) => {
  const labels = isArabic ? labelsAr : labelsEn;
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = getStoredAuth();
  const basePath = getBasePath(role, isArabic);
  const [state, setState] = useState({ consumption: null, loading: true, error: "" });
  const refresh = () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    api.consumptions.get(id).then((response) => {
      setState({ consumption: normalizeRecord(response), loading: false, error: "" });
    }).catch((requestError) => {
      setState({ consumption: null, loading: false, error: requestError.message || labels.notFound });
    });
  };
  useEffect(() => {
    refresh();
  }, [id]);
  const { consumption, loading, error } = state;

  if (loading) {
    return <div className="p-6 lg:p-8 text-sm text-[#5A6B50]">{isArabic ? "جاري التحميل..." : "Loading consumption details..."}</div>;
  }

  if (error || !consumption?._id) {
    return <div className={`p-6 lg:p-8 ${isArabic ? "rtl text-right" : ""}`} dir={isArabic ? "rtl" : "ltr"}>
      <PageHeader title={labels.title} subtitle={labels.subtitle} />
      <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/8 px-4 py-3 text-sm text-[#8A1F11]">{error || labels.notFound}</div>
    </div>;
  }

  const quantity = `${consumption.consumed_quantity ?? consumption.quantity ?? 0} ${consumption.unit || consumption.product_id?.unit || ""}`.trim();
  const canEdit = consumption.status !== "cancelled";
  const locale = isArabic ? "ar" : "en";

  return <div className={`p-6 lg:p-8 space-y-6 ${isArabic ? "rtl text-right" : ""}`} dir={isArabic ? "rtl" : "ltr"}>
    <PageHeader
      title={labels.title}
      subtitle={labels.subtitle}
      actions={[
        { label: labels.back, icon: ArrowLeft, variant: "outline", onClick: () => navigate(basePath) },
        ...(canEdit ? [{ label: labels.edit, icon: Edit, variant: "outline", onClick: () => navigate(`${basePath}/${id}/edit`) }] : []),
      ]}
    />
    <div className="rounded-2xl border border-[#4E4631]/10 bg-white p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5A6B50]">{String(consumption._id).slice(-8).toUpperCase()}</p>
        <Badge variant={consumption.status === "cancelled" ? "warning" : "success"}>
          {consumption.status === "cancelled" ? labels.cancelled : labels.completed}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailRow label={labels.product} value={getLocalizedValue(consumption.product_id, "name", locale)} />
        <DetailRow label={labels.warehouse} value={getLocalizedValue(consumption.warehouse_id, "name", locale)} />
        <DetailRow label={labels.quantity} value={quantity} />
        <DetailRow label={labels.reason} value={consumption.reason} />
        <DetailRow label={labels.department} value={consumption.department} />
        <DetailRow label={labels.consumedBy} value={getLocalizedDisplayName(consumption.consumed_by, locale) || getLocalizedDisplayName(consumption.user_id, locale)} />
        <DetailRow label={labels.date} value={formatDate(consumption.consumption_date || consumption.createdAt)} />
        <DetailRow label={labels.movement} value={consumption.movement_id?._id ? String(consumption.movement_id._id).slice(-8).toUpperCase() : consumption.movement_id} />
        <div className="md:col-span-2">
          <DetailRow label={labels.notes} value={consumption.notes} />
        </div>
      </div>
    </div>
  </div>;
};

const ConsumptionDetails = () => <ConsumptionDetailsView />;

export {
  ConsumptionDetails,
  ConsumptionDetailsView
};
