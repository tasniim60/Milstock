import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AlertTriangle, Bell, Check, CheckCircle, Eye, Info, RefreshCw } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Button } from "../../components/Button";
import { ExportCsvButton } from "../../components/ExportCsvButton";
import { useNotifications } from "../../context/NotificationContext";
import { formatDate, formatDateTime } from "../../lib/format";
import { formatNotification, getLocalizedValue, localizeText } from "../../lib/localization";

const getNotificationItemId = (notification) => {
  const itemId =
    notification.item_id?._id ||
    notification.item_id ||
    notification.item?._id ||
    notification.metadata?.item_id ||
    notification.metadata?.itemId ||
    (["item", "inventory", "product"].includes(notification.entity_type) ? notification.entity_id : null);
  return itemId ? String(itemId) : "";
};

const isItemNotification = (notification) => {
  const types = ["low_stock", "expiration", "expiration_reminder", "expired", "inventory", "inventory_update", "item_update"];
  return Boolean(getNotificationItemId(notification)) || types.includes(notification.type);
};

const getNotificationRequestId = (notification) => {
  const requestId =
    notification.order_id?._id ||
    notification.order_id ||
    notification.request_id?._id ||
    notification.request_id ||
    notification.metadata?.order_id ||
    notification.metadata?.orderId ||
    notification.metadata?.request_id ||
    notification.metadata?.requestId ||
    (["order", "request", "orders", "requests"].includes(notification.entity_type) ? notification.entity_id : null);
  return requestId ? String(requestId) : "";
};

const isRequestNotification = (notification) => {
  const type = String(notification.type || "");
  return Boolean(getNotificationRequestId(notification)) || type.includes("order") || type.includes("request");
};

const getItemName = (notification) =>
  getLocalizedValue(notification.item_id, "name", "ar") ||
  getLocalizedValue(notification.item, "name", "ar") ||
  notification.metadata?.item_name_ar ||
  notification.metadata?.product_name_ar ||
  localizeText(notification.metadata?.item_name, "ar") ||
  localizeText(notification.metadata?.product_name, "ar") ||
  localizeText(notification.metadata?.name, "ar") ||
  "";

const getTypeLabel = (notification) => {
  const formatted = formatNotification(notification, "ar");
  if (notification.type === "low_stock") return "تنبيه انخفاض المخزون";
  if (notification.metadata?.expiration_status === "expired" || notification.type === "expired") return "صنف منتهي الصلاحية";
  if (notification.type === "expiration" || notification.type === "expiration_reminder") return "تذكير بانتهاء الصلاحية";
  if (String(notification.type || "").includes("order") || String(notification.type || "").includes("request")) return "تحديث طلب";
  if (String(notification.type || "").includes("inventory") || String(notification.type || "").includes("item")) return "تحديث مخزون";
  return formatted.title || notification.titleAr || notification.title || "إشعار نظام";
};

const getDisplayMessage = (notification) => {
  const formatted = formatNotification(notification, "ar");
  if (formatted.message) return formatted.message;
  const itemName = getItemName(notification);
  const days = notification.metadata?.days_remaining;
  if (notification.type === "low_stock" && itemName) {
    return `مستوى المخزون للصنف ${itemName} أقل من الحد الأدنى المحدد.`;
  }
  if ((notification.type === "expiration" || notification.type === "expiration_reminder") && itemName && days >= 0) {
    return `${itemName} ستنتهي صلاحيته خلال ${days} يوم.`;
  }
  if ((notification.metadata?.expiration_status === "expired" || notification.type === "expired") && itemName) {
    return `${itemName} انتهت صلاحيته في ${formatDate(notification.metadata?.expiration_date)}.`;
  }
  return notification.messageAr || notification.message || "";
};

const getCardStyle = (notification) => {
  if (notification.severity === "critical") {
    return { icon: AlertTriangle, iconClass: "bg-[#D4183D]/10 text-[#D4183D]", border: "border-r-[#D4183D]" };
  }
  if (notification.severity === "warning" || notification.type === "expiration" || notification.type === "expiration_reminder") {
    return { icon: AlertTriangle, iconClass: "bg-[#B8862A]/10 text-[#B8862A]", border: "border-r-[#B8862A]" };
  }
  if (notification.type?.includes("order") || notification.type?.includes("request")) {
    return { icon: CheckCircle, iconClass: "bg-[#5B8A4A]/10 text-[#5B8A4A]", border: "border-r-[#5B8A4A]" };
  }
  return { icon: Info, iconClass: "bg-[#6A7B4D]/10 text-[#6A7B4D]", border: "border-r-[#6A7B4D]" };
};

const NotificationsPageAr = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, loading, error, fetchNotifications, markAllAsRead, markOneAsRead, isRead } = useNotifications();
  const [filter, setFilter] = useState("all");
  const isAdminPath = location.pathname.startsWith("/ar/admin");
  const isUserPath = location.pathname.startsWith("/ar/user");

  const filtered = useMemo(() => notifications.filter((notification) => {
    if (filter === "unread") return !isRead(notification);
    if (filter === "expiration") return notification.type === "expiration" || notification.type === "expiration_reminder";
    if (filter === "requests") return String(notification.type || "").includes("order") || String(notification.type || "").includes("request");
    return true;
  }), [notifications, filter, isRead]);

  const exportColumns = [
    { key: "title", header: "العنوان" },
    { key: "type", header: "النوع" },
    { key: "message", header: "الرسالة" },
    { header: "مقروء", value: (row) => isRead(row) ? "نعم" : "لا" },
    { header: "التاريخ والوقت", value: (row) => formatDateTime(row.createdAt, "ar-EG") }
  ];

  const viewItem = (notification) => {
    const itemId = getNotificationItemId(notification);
    if (itemId && isAdminPath) navigate(`/ar/admin/inventory/${itemId}`);
    if (itemId && isUserPath) navigate(`/ar/user/inventory?item_id=${itemId}`);
  };

  const viewRequest = (notification) => {
    const requestId = getNotificationRequestId(notification);
    if (!requestId) return;
    if (location.pathname.startsWith("/ar/supplier")) {
      navigate(`/ar/supplier/orders/${requestId}`);
      return;
    }
    if (location.pathname.startsWith("/ar/user")) {
      navigate(`/ar/user/requests/${requestId}`);
      return;
    }
    navigate(`/ar/admin/requests/${requestId}`);
  };

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <PageHeaderAr
      title="الإشعارات"
      subtitle="تذكيرات المخزون وتحديثات الطلبات والتنبيهات"
      badge={unreadCount > 0 ? <span className="px-2 py-0.5 bg-[#D4183D] text-white text-xs font-bold rounded-lg">{unreadCount}</span> : void 0}
    />

    <div className="rounded-2xl border border-[#4E4631]/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "الكل" },
            { value: "unread", label: "غير المقروء" },
            { value: "expiration", label: "الصلاحية" },
            { value: "requests", label: "الطلبات" },
          ].map((item) => <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`min-h-9 rounded-xl px-3 text-sm transition-colors ${filter === item.value ? "bg-[#4B5B3A] text-white" : "bg-[#ECEEE2] text-[#4E4631] hover:bg-[#E0E1B7]"}`}
          >
            {item.label}
          </button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="w-4 h-4" />
            تعليم الكل كمقروء
          </Button>
          <ExportCsvButton filenamePrefix="notifications-export" columns={exportColumns} rows={loading ? [] : filtered}>
            تصدير
          </ExportCsvButton>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-[#5A6B50]">{loading ? "جار تحميل الإشعارات..." : error || `يتم عرض ${filtered.length} إشعار`}</p>
      <p className="text-xs text-[#5A6B50]">{unreadCount > 0 ? `${unreadCount} غير مقروء` : "كل الإشعارات مقروءة"}</p>
    </div>

    <div className="grid gap-3">
      {!loading && filtered.length === 0 && <div className="rounded-2xl border border-[#4E4631]/10 bg-white p-10 text-center">
        <Bell className="mx-auto mb-3 h-10 w-10 text-[#6A7B4D]" />
        <p className="text-sm text-[#5A6B50]">{error || "لا توجد إشعارات."}</p>
      </div>}

      {filtered.map((notification) => {
        const read = isRead(notification);
        const style = getCardStyle(notification);
        const Icon = style.icon;
        const itemId = getNotificationItemId(notification);
        const requestId = getNotificationRequestId(notification);
        const itemName = getItemName(notification);
        const formatted = formatNotification(notification, "ar");
        const canOpenItem = Boolean(itemId && (isAdminPath || isUserPath) && isItemNotification(notification));
        const canOpenRequest = Boolean(requestId && isRequestNotification(notification));
        const canOpenNotification = canOpenItem || canOpenRequest;
        const handleOpen = () => {
          if (!read) markOneAsRead(notification._id);
          if (canOpenRequest) {
            viewRequest(notification);
            return;
          }
          if (canOpenItem) viewItem(notification);
        };
        const handleKeyDown = (event) => {
          if (!canOpenNotification) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpen();
          }
        };

        return <article
          key={notification._id}
          role={canOpenNotification ? "button" : void 0}
          tabIndex={canOpenNotification ? 0 : void 0}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          dir="rtl"
          className={`rounded-2xl border border-[#4E4631]/10 border-r-4 ${style.border} p-4 text-right shadow-sm transition-all ${canOpenNotification ? "cursor-pointer hover:bg-[#FBFCF5] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#6A7B4D]/30" : ""} ${read ? "bg-white opacity-75" : "bg-[#FBFCF5] ring-1 ring-[#4B5B3A]/10"}`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${style.iconClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="space-y-2">
                <p className={`text-xs font-semibold leading-5 tracking-wide ${notification.severity === "critical" ? "text-[#D4183D]" : notification.severity === "warning" ? "text-[#B8862A]" : "text-[#4B5B3A]"}`}>{getTypeLabel(notification)}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 text-lg font-semibold leading-7 text-[#2E3A24] break-words">{itemName || formatted.title || notification.titleAr || notification.title || "إشعار"}</h3>
                  {!read && <span className="flex-shrink-0 rounded-lg bg-[#D4183D] px-2 py-0.5 text-xs font-semibold text-white">غير مقروء</span>}
                </div>
                <p className="text-sm leading-relaxed text-[#5A6B50]">{getDisplayMessage(notification)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-[#5A6B50]">
                <span>{formatDateTime(notification.createdAt, "ar-EG")}</span>
                {notification.type === "low_stock" && notification.metadata?.current_stock !== undefined && <span>المخزون الحالي: {notification.metadata.current_stock} {notification.metadata?.unit || ""}</span>}
                {notification.type === "low_stock" && notification.metadata?.minimum_stock !== undefined && <span>الحد الأدنى: {notification.metadata.minimum_stock} {notification.metadata?.unit || ""}</span>}
                {(notification.type === "expiration" || notification.type === "expiration_reminder") && <span>تاريخ الصلاحية: {formatDate(notification.metadata?.expiration_date)}</span>}
                {notification.metadata?.days_remaining !== undefined && <span>الأيام المتبقية: {notification.metadata.days_remaining}</span>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!read && <Button type="button" variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); markOneAsRead(notification._id); }}>
                  <Eye className="w-4 h-4" />
                  تحديد كمقروء
                </Button>}
              </div>
            </div>
          </div>
        </article>;
      })}
    </div>
  </div>;
};

export {
  NotificationsPageAr
};
