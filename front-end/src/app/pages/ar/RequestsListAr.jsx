import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Plus, Search } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Badge } from "../../components/Badge";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { ExportCsvButton } from "../../components/ExportCsvButton";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatDate } from "../../lib/format";
import { normalizeArray, sameId } from "../../lib/normalize";
import { getLocalizedDisplayName, getLocalizedRoleLabel, getLocalizedValue, localizeText } from "../../lib/localization";

const statusLabels = {
  pending: "قيد المراجعة",
  approved: "موافق عليه",
  completed: "مكتمل",
  cancelled: "ملغي",
  rejected: "مرفوض",
  delivered: "تم التسليم"
};

const statusVariants = {
  pending: "pending",
  approved: "success",
  completed: "info",
  delivered: "info",
  cancelled: "danger",
  rejected: "danger"
};

const RequestsListAr = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.includes("/ar/admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: orders, loading: ordersLoading, error: ordersError } = useApiResource(() => api.orders.list(), []);
  const { data: orderItems } = useApiResource(() => api.orderItems.list(), []);
  const warehouseFilter = new URLSearchParams(location.search).get("warehouse_id");

  useEffect(() => {
    const urlStatus = new URLSearchParams(location.search).get("status");
    if (urlStatus) setStatusFilter(urlStatus);
  }, [location.search]);

  const orderItemsArray = normalizeArray(orderItems);
  const requestRows = orders.map((order) => {
    const items = orderItemsArray.filter((item) => sameId(item.order_id, order._id));
    return {
      id: order._id.slice(-8).toUpperCase(),
      mongoId: order._id,
      kitchen: getLocalizedDisplayName(order.user_id, "ar") || getLocalizedRoleLabel(order.user_id?.role, "ar") || order.user_id?.military_number || "مستخدم",
      item: items.map((item) => getLocalizedValue(item.product_id, "name", "ar") || getLocalizedValue(item.product, "name", "ar") || localizeText(item.product_name || item.name, "ar")).filter(Boolean).join("، ") || "طلب توريد",
      quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      status: order.status,
      requestedDate: formatDate(order.date),
      requestedBy: getLocalizedDisplayName(order.user_id, "ar") || "غير محدد",
      supplier: getLocalizedDisplayName(order.supplier_id, "ar") || "غير محدد",
      sourceWarehouseId: order.source_warehouse?._id || order.source_warehouse || "",
      destinationWarehouseId: order.destination_warehouse?._id || order.destination_warehouse || ""
    };
  });

  const filtered = requestRows.filter((request) => {
    const search = String(searchTerm ?? "").toLowerCase();
    const matchSearch =
      String(request.id ?? "").toLowerCase().includes(search) ||
      String(request.kitchen ?? "").toLowerCase().includes(search) ||
      String(request.item ?? "").toLowerCase().includes(search) ||
      String(request.supplier ?? "").toLowerCase().includes(search);
    const matchStatus = statusFilter === "all" || request.status === statusFilter;
    const matchWarehouse = !warehouseFilter || [request.sourceWarehouseId, request.destinationWarehouseId].some((warehouseId) => String(warehouseId || "") === String(warehouseFilter));
    return matchSearch && matchStatus && matchWarehouse;
  });

  const exportColumns = [
    { key: "id", header: "رقم الطلب" },
    { key: "kitchen", header: "المستخدم" },
    { key: "item", header: "الأصناف" },
    { key: "quantity", header: "الكمية" },
    { key: "supplier", header: "المورد" },
    { header: "الحالة", value: (row) => statusLabels[row.status] || row.status },
    { key: "requestedDate", header: "التاريخ" },
    { key: "requestedBy", header: "مقدم الطلب" }
  ];

  const openRequest = (request) => {
    navigate(isAdmin ? `/ar/admin/requests/${request.mongoId}` : `/ar/user/requests/${request.mongoId}`);
  };

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <PageHeaderAr
      title={isAdmin ? "جميع طلبات التوريد" : "طلباتي"}
      subtitle="طلبات التوريد المسجلة"
      action={!isAdmin ? {
        label: "طلب جديد",
        onClick: () => navigate("/ar/user/requests/create"),
        icon: Plus
      } : void 0}
    />

    <div className="bg-white rounded-2xl border border-[#4E4631]/10 p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث برقم الطلب، المستخدم، الصنف أو المورد..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pr-12 text-right"
          />
        </div>
        <Select
          options={[
            { value: "all", label: "جميع الحالات" },
            { value: "pending", label: "قيد المراجعة" },
            { value: "approved", label: "موافق عليه" },
            { value: "completed", label: "مكتمل" },
            { value: "cancelled", label: "ملغي" }
          ]}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </div>
    </div>

    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        {ordersLoading ? "جاري تحميل الطلبات..." : ordersError || `عرض ${filtered.length} من ${requestRows.length} طلب`}
      </p>
      <ExportCsvButton filenamePrefix="requests-export" columns={exportColumns} rows={ordersLoading ? [] : filtered} className="flex items-center gap-2">
        تصدير
      </ExportCsvButton>
    </div>

    <div className="hidden lg:block bg-card rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-right">
        <thead className="bg-muted/30 border-b border-border">
          <tr>
            {["رقم الطلب", "المستخدم", "الأصناف", "الكمية", "المورد", "الحالة", "التاريخ", "مقدم الطلب"].map((header) => <th key={header} className="px-4 py-3 text-sm font-medium text-muted-foreground">{header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.map((request) => <tr key={request.mongoId} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => openRequest(request)}>
            <td className="px-4 py-3 font-mono text-sm font-medium text-foreground">{request.id}</td>
            <td className="px-4 py-3 text-foreground">{request.kitchen}</td>
            <td className="px-4 py-3 text-foreground">{request.item}</td>
            <td className="px-4 py-3 text-foreground">{request.quantity}</td>
            <td className="px-4 py-3 text-foreground">{request.supplier}</td>
            <td className="px-4 py-3"><Badge variant={statusVariants[request.status] || "neutral"}>{statusLabels[request.status] || request.status}</Badge></td>
            <td className="px-4 py-3 text-muted-foreground">{request.requestedDate}</td>
            <td className="px-4 py-3 text-foreground">{request.requestedBy}</td>
          </tr>)}
        </tbody>
      </table>
    </div>

    <div className="lg:hidden space-y-3">
      {filtered.map((request) => <div
        key={request.mongoId}
        dir="rtl"
        className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-primary transition-colors text-right"
        onClick={() => openRequest(request)}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground leading-none">{request.id}</p>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground break-words">{request.kitchen}</p>
          </div>
          <Badge variant={statusVariants[request.status] || "neutral"} className="shrink-0">
            {statusLabels[request.status] || request.status}
          </Badge>
        </div>
        <div className="space-y-1.5 text-sm">
          <p className="text-foreground leading-6 break-words">
            <span className="font-medium">{request.item}</span>
            <span className="mx-1 text-muted-foreground">•</span>
            <span>الكمية: {request.quantity}</span>
          </p>
          <p className="text-xs leading-5 text-muted-foreground break-words">
            {request.requestedDate} <span className="mx-1">•</span> {request.supplier}
          </p>
        </div>
      </div>)}
    </div>
  </div>;
};

export {
  RequestsListAr
};
