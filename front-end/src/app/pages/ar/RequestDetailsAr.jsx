import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ArrowRight, Calendar, CheckCircle, Clock, Package, Truck, User, XCircle } from "lucide-react";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { getDocumentId, normalizeArray, normalizeRecord, sameId } from "../../lib/normalize";
import { getLocalizedDisplayName, getLocalizedRoleLabel, getLocalizedValue, localizeText } from "../../lib/localization";

const statusVariants = {
  pending: "pending",
  approved: "success",
  rejected: "danger",
  in_transfer: "info",
  completed: "info",
  cancelled: "danger"
};

const statusLabels = {
  pending: "قيد المراجعة",
  approved: "موافق عليه",
  rejected: "مرفوض",
  in_transfer: "قيد النقل",
  completed: "مكتمل",
  cancelled: "ملغي"
};

const money = (value) => {
  const number = Number(value || 0);
  return number ? `${number.toLocaleString()} جنيه` : "غير محدد";
};

const RequestDetailsAr = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.includes("/ar/admin");
  const backPath = isAdmin ? "/ar/admin/requests" : "/ar/user/requests";
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRequest = useCallback(async () => {
    if (!id) {
      setOrder(null);
      setItems([]);
      setError("رقم الطلب غير موجود.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [orderData, orderItems] = await Promise.all([
        api.orders.get(id),
        api.orderItems.list()
      ]);
      const orderItemsArray = normalizeArray(orderItems);
      const relatedItems = orderItemsArray.filter((item) => sameId(item.order_id, id));
      setOrder(orderData || null);
      setItems(relatedItems);
    } catch (requestError) {
      setError(requestError.message || "تعذر تحميل تفاصيل الطلب.");
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const updateStatus = async (status) => {
    if (!id || !order) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.orders.updateStatus(id, status, `Status changed to ${status} from request details`);
      const updatedOrder = normalizeRecord(response);
      setOrder(updatedOrder || { ...order, status });
      setMessage(`تم تحديث حالة الطلب إلى ${statusLabels[status] || status}.`);
      await loadRequest();
    } catch (requestError) {
      setError(requestError.message || "تعذر تحديث حالة الطلب.");
    } finally {
      setSaving(false);
    }
  };
  const decideWarehouseRequest = async (decision) => {
    if (!id || !order) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.orders.adminDecision(id, decision, `${decision} from Arabic request details`);
      const updatedOrder = normalizeRecord(response);
      setOrder(updatedOrder || { ...order, status: decision === "approve" ? "approved" : "rejected" });
      setMessage(decision === "approve" ? "تمت الموافقة على الطلب. يتم إتمام حركة المخزون من سجلات الحركة." : "تم رفض الطلب.");
      await loadRequest();
    } catch (requestError) {
      setError(requestError.message || "تعذر تحديث قرار الطلب.");
    } finally {
      setSaving(false);
    }
  };

  const requestId = useMemo(() => {
    const rawId = order?._id || id || "";
    return rawId ? rawId.slice(-8).toUpperCase() : "غير محدد";
  }, [id, order?._id]);

  const notes = order?.notes || order?.note || order?.description || order?.justification || "";
  const requesterName = getLocalizedDisplayName(order?.user_id, "ar") || getLocalizedRoleLabel(order?.user_id?.role, "ar") || "مستخدم غير محدد";
  const requesterCode = order?.user_id?.military_number || order?.user_id?.email || "غير محدد";
  const supplierName = getLocalizedDisplayName(order?.supplier_id, "ar") || getLocalizedDisplayName(order?.provider_id, "ar") || "بدون مورد";
  const currentStatus = order?.status || "pending";
  const isWarehouseRequest = ["warehouse_request", "warehouse_transfer"].includes(order?.request_type || "warehouse_request");
  const adminUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("milstock_user") || "null");
    } catch {
      return null;
    }
  }, []);
  const canManageRequest = isAdmin && (!adminUser?.role || adminUser.role === "admin") && isWarehouseRequest;
  const createdDate = formatDate(order?.date || order?.createdAt);
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const timeline = [
    {
      title: "تم إنشاء الطلب",
      description: `تم الإنشاء بواسطة ${requesterName}`,
      complete: Boolean(order),
      active: currentStatus === "pending",
      icon: Package
    },
    {
      title: "تمت الموافقة",
      description: "تمت الموافقة على الطلب للتجهيز",
      complete: ["approved", "completed"].includes(currentStatus),
      active: currentStatus === "approved",
      icon: CheckCircle
    },
    {
      title: currentStatus === "cancelled" ? "تم الإلغاء" : "تم التسليم",
      description: currentStatus === "cancelled" ? "تم رفض أو إلغاء الطلب" : "تم تحديث الطلب كطلب مكتمل",
      complete: ["completed", "cancelled"].includes(currentStatus),
      active: ["completed", "cancelled"].includes(currentStatus),
      icon: currentStatus === "cancelled" ? XCircle : Truck
    }
  ];

  if (loading) {
    return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm">
        <ArrowRight className="w-4 h-4" />
        العودة إلى الطلبات
      </button>
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">جاري تحميل تفاصيل الطلب...</CardContent>
      </Card>
    </div>;
  }

  if (error && !order) {
    return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm">
        <ArrowRight className="w-4 h-4" />
        العودة إلى الطلبات
      </button>
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-semibold text-[#D4183D] mb-2">تعذر تحميل هذا الطلب.</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    </div>;
  }

  if (!order) {
    return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm">
        <ArrowRight className="w-4 h-4" />
        العودة إلى الطلبات
      </button>
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">الطلب غير موجود.</CardContent>
      </Card>
    </div>;
  }

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] transition-colors text-sm">
      <ArrowRight className="w-4 h-4" />
      العودة إلى الطلبات
    </button>

    <PageHeaderAr
      title={`تفاصيل الطلب ${requestId}`}
      subtitle={`${supplierName} - ${createdDate}`}
    />

    {error && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D] text-right">{error}</div>}
    {message && <div className="rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e] text-right">{message}</div>}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Badge variant={statusVariants[currentStatus] || "neutral"}>{statusLabels[currentStatus] || currentStatus}</Badge>
            <CardTitle className="text-right">حالة الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timeline.map((step, index) => {
                const Icon = step.icon;
                const isDone = step.complete;
                return <div key={step.title} className="flex gap-4 flex-row-reverse">
                  <div className="flex flex-col items-center">
                    <div className={`p-3 rounded-full ${isDone ? "bg-[#6A7B4D] text-white" : step.active ? "bg-[#4B5B3A] text-white" : "bg-[#E0E1B7] text-muted-foreground"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index !== timeline.length - 1 && <div className={`w-0.5 h-14 mt-2 ${isDone ? "bg-[#6A7B4D]" : "bg-border"}`} />}
                  </div>
                  <div className="flex-1 pb-5 text-right">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <p className="text-sm text-muted-foreground whitespace-nowrap">{createdDate}</p>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>;
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-sm text-muted-foreground">{items.length} أصناف</span>
            <CardTitle className="text-right">الأصناف المطلوبة</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? <p className="text-sm text-muted-foreground text-right">لا توجد أصناف مرتبطة بهذا الطلب.</p> : <div className="space-y-4">
              {items.map((item) => {
                const product = item.product_id || item.product || {};
                const productId = getDocumentId(product);
                const productName = getLocalizedValue(product, "name", "ar") || localizeText(item.product_name || item.name, "ar") || "صنف غير محدد";
                return <div key={item._id || `${productId || productName}-${item.quantity}`} className="p-4 bg-background rounded-xl border border-border text-right">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <Badge variant="info">{getLocalizedValue(product, "category", "ar") || localizeText(product?.category, "ar") || "مواد غذائية"}</Badge>
                    <div>
                      <p className="font-semibold text-foreground">{productName}</p>
                      <p className="text-sm text-muted-foreground">{String(productId || "").slice(-8).toUpperCase() || "غير محدد"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">الكمية</p>
                      <p className="font-medium text-foreground">{item.quantity || 0} {product?.unit || ""}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">سعر الوحدة</p>
                      <p className="font-medium text-foreground">{money(item.unit_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الإجمالي</p>
                      <p className="font-medium text-foreground">{money(item.total_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">المخزون المتاح</p>
                      <p className="font-medium text-foreground">{product?.quantity ?? "غير محدد"} {product?.unit || ""}</p>
                    </div>
                  </div>
                </div>;
              })}
            </div>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">معلومات الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "رقم الطلب", value: requestId, icon: Package },
                { label: "مقدم الطلب", value: requesterName, icon: User },
                { label: "كود الموظف", value: requesterCode, icon: User },
                { label: "المورد", value: supplierName, icon: Truck },
                { label: "تاريخ الطلب", value: createdDate, icon: Calendar },
                { label: "إجمالي الكمية", value: totalQuantity || "غير محدد", icon: Package },
                { label: "إجمالي السعر", value: money(order.total_price), icon: Package }
              ].map((field) => {
                const Icon = field.icon;
                return <div key={field.label} dir="rtl" className="flex items-start gap-3 text-right">
                  <Icon className="w-4 h-4 text-[#5A6B50] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">{field.label}</p>
                    <p className="font-semibold text-foreground">{field.value}</p>
                  </div>
                </div>;
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">ملاحظات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed text-right">
              {notes || "لا توجد ملاحظات إضافية محفوظة لهذا الطلب."}
            </p>
          </CardContent>
        </Card>

        {canManageRequest && <Card>
          <CardHeader>
            <CardTitle className="text-right">إجراءات المسؤول</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStatus === "approved" && <div className="space-y-3">
              <p className="text-sm text-[#5A6B50] text-right">تمت الموافقة على الطلب. يتم إتمام حركة المخزون من سجلات الحركة.</p>
              <Button className="w-full" variant="outline" onClick={() => navigate("/ar/admin/inventory/logs")}>
                سجلات الحركة
              </Button>
            </div>}
            {currentStatus === "pending" && <div className="space-y-3">
              <Button className="w-full" onClick={() => decideWarehouseRequest("approve")} disabled={saving}>
                <CheckCircle className="w-4 h-4" />
                الموافقة على الطلب
              </Button>
              <Button variant="danger" className="w-full" onClick={() => decideWarehouseRequest("reject")} disabled={saving}>
                <XCircle className="w-4 h-4" />
                رفض الطلب
              </Button>
            </div>}
            {currentStatus === "completed" && <p className="text-sm text-[#5A6B50] text-right">تم إتمام النقل.</p>}
            {["rejected", "cancelled"].includes(currentStatus) && <p className="text-sm text-[#5A6B50] text-right">تم رفض الطلب أو إلغاؤه.</p>}
          </CardContent>
        </Card>}
      </div>
    </div>
  </div>;
};

export {
  RequestDetailsAr
};
