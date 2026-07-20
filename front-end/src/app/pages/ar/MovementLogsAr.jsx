import { useMemo, useState } from "react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Table } from "../../components/Table";
import { Badge } from "../../components/Badge";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { ExportCsvButton } from "../../components/ExportCsvButton";
import { CheckCircle, Search } from "lucide-react";
import { useLocation } from "react-router";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatDate } from "../../lib/format";
import { getLocalizedDisplayName, getLocalizedValue, localizeText } from "../../lib/localization";
import { MAX_DATE_INPUT, MIN_DATE_INPUT } from "../../lib/dateValidation";

const actionLabels = {
  in: "وارد",
  out: "صادر",
  transfer: "نقل",
  consumption: "استهلاك",
  consumption_cancelled: "إلغاء استهلاك"
};

const actionVariants = {
  in: "success",
  out: "warning",
  transfer: "info",
  consumption: "warning",
  consumption_cancelled: "success"
};

const formatNumberAr = (value) => Number(value || 0).toLocaleString("ar-EG");

const MovementLogsAr = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [message, setMessage] = useState("");
  const { data: movements, loading, error, refresh: refreshMovements } = useApiResource(() => api.movements.list(), []);
  const { data: productWarehouses, refresh: refreshProductWarehouses } = useApiResource(() => api.productWarehouses.list(), []);
  const query = new URLSearchParams(location.search);
  const warehouseFilter = query.get("warehouse_id");
  const statusQueryFilter = query.get("status");

  const matchesWarehouseFilter = (movement) => {
    if (!warehouseFilter) return true;
    return [
      movement.from_warehouse?._id || movement.from_warehouse,
      movement.to_warehouse?._id || movement.to_warehouse,
      movement.reference_id?._id || movement.reference_id
    ].some((warehouseId) => String(warehouseId || "") === String(warehouseFilter));
  };

  const pendingTransfers = useMemo(() => {
    const pendingRows = movements.filter((movement) => matchesWarehouseFilter(movement) && movement.movement_type === "warehouse_transfer" && movement.status === "pending" && movement.order_id);
    const byOrder = new Map();

    pendingRows.forEach((movement) => {
      const orderId = movement.order_id?._id || movement.order_id;
      if (!byOrder.has(orderId)) {
        byOrder.set(orderId, {
          orderId,
          requestId: String(orderId).slice(-8).toUpperCase(),
          requester: getLocalizedDisplayName(movement.requested_by, "ar") || getLocalizedDisplayName(movement.user_id, "ar") || "غير معروف",
          approvedAt: movement.approved_at || movement.createdAt,
          source: getLocalizedValue(movement.from_warehouse, "name", "ar") || getLocalizedValue(movement.reference_id, "name", "ar") || "المخزن المصدر",
          destination: getLocalizedValue(movement.to_warehouse, "name", "ar") || "المخزن المستلم",
          rows: []
        });
      }

      const productId = String(movement.product_id?._id || movement.product_id || "");
      const sourceWarehouseId = String(movement.from_warehouse?._id || movement.from_warehouse || "");
      const destinationWarehouseId = String(movement.to_warehouse?._id || movement.to_warehouse || "");
      const sourceStock = productWarehouses.find((row) => String(row.product_id?._id || row.product_id || "") === productId && String(row.warehouse_id?._id || row.warehouse_id || "") === sourceWarehouseId);
      const destinationStock = productWarehouses.find((row) => String(row.product_id?._id || row.product_id || "") === productId && String(row.warehouse_id?._id || row.warehouse_id || "") === destinationWarehouseId);
      const requestedQuantity = Number(movement.requested_quantity || movement.stock || 0);
      const sourceQuantity = Number(sourceStock?.quantity || 0);

      byOrder.get(orderId).rows.push({
        movementId: movement._id,
        productName: getLocalizedValue(movement.product_id, "name", "ar") || localizeText(movement.product_name || movement.name, "ar") || "صنف غير معروف",
        quantity: requestedQuantity,
        sourceStock: sourceQuantity,
        destinationStock: destinationStock?.quantity ?? 0,
        insufficient: sourceQuantity < requestedQuantity
      });
    });

    return Array.from(byOrder.values()).map((transfer) => ({
      ...transfer,
      hasInsufficientStock: transfer.rows.some((row) => row.insufficient)
    }));
  }, [movements, productWarehouses, warehouseFilter]);

  const movementData = movements.filter((movement) => matchesWarehouseFilter(movement) && movement.status !== "pending").map((movement) => ({
    id: movement._id.slice(-8).toUpperCase(),
    date: formatDate(movement.createdAt, "ar-EG"),
    itemId: movement.product_id?._id?.slice(-8).toUpperCase() || "N/A",
    itemName: getLocalizedValue(movement.product_id, "name", "ar") || localizeText(movement.product_name || movement.name, "ar") || "صنف غير معروف",
    action: movement.movement_type === "consumption" || movement.movement_type === "consumption_cancelled" ? movement.movement_type : movement.change_type,
    status: movement.status,
    quantity: `${movement.change_type === "in" ? "+" : movement.change_type === "out" ? "-" : ""}${formatNumberAr(movement.stock)}`,
    location: getLocalizedValue(movement.from_warehouse, "name", "ar") || getLocalizedValue(movement.to_warehouse, "name", "ar") || getLocalizedValue(movement.reference_id, "name", "ar") || "لا يوجد مخزن",
    user: getLocalizedDisplayName(movement.performed_by, "ar") || getLocalizedDisplayName(movement.user_id, "ar") || "مستخدم غير معروف",
    reason: movement.reference_type || "حركة مخزون"
  }));

  const filteredData = movementData.filter((movement) => {
    const search = String(searchTerm ?? "").toLowerCase();
    const matchesSearch = String(movement.id ?? "").toLowerCase().includes(search) || String(movement.itemName ?? "").toLowerCase().includes(search) || String(movement.itemId ?? "").toLowerCase().includes(search);
    const matchesAction = actionFilter === "all" || movement.action === actionFilter;
    const matchesStatus = !statusQueryFilter || movement.status === statusQueryFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const completeMovement = async (orderId) => {
    setBusyOrderId(orderId);
    setMessage("");
    try {
      await api.movements.completeTransfer(orderId, "تم إتمام النقل من سجلات الحركة");
      setMessage("تم إتمام النقل بنجاح.");
      refreshMovements();
      refreshProductWarehouses();
    } catch (requestError) {
      setMessage(requestError.message || "تعذر إتمام النقل.");
    } finally {
      setBusyOrderId("");
    }
  };

  const cancelTransfer = async (orderId) => {
    setBusyOrderId(orderId);
    setMessage("");
    try {
      await api.orders.updateStatus(orderId, "cancelled", "Cancelled from Movement Logs because source stock is insufficient");
      setMessage("تم إلغاء التحويل وإلغاء سجلات الحركة المعلقة.");
      refreshMovements();
      refreshProductWarehouses();
    } catch (requestError) {
      setMessage(requestError.message || "تعذر إلغاء التحويل.");
    } finally {
      setBusyOrderId("");
    }
  };

  const columns = [
    { key: "id", header: "رقم الحركة" },
    { key: "date", header: "التاريخ" },
    {
      key: "item",
      header: "الصنف",
      render: (row) => <div>
        <p className="font-medium text-foreground">{row.itemName}</p>
        <p className="text-sm text-muted-foreground">{row.itemId}</p>
      </div>
    },
    {
      key: "action",
      header: "الإجراء",
      render: (row) => <Badge variant={actionVariants[row.action] || "info"}>
        {actionLabels[row.action] || row.action}
      </Badge>
    },
    {
      key: "quantity",
      header: "الكمية",
      render: (row) => <span className={`font-semibold ${row.action === "in" ? "text-[#6A7B4D]" : row.action === "out" ? "text-[#B85C50]" : "text-[#4B5B3A]"}`}>
        {row.quantity}
      </span>
    },
    { key: "location", header: "المخزن" },
    { key: "user", header: "تم بواسطة" },
    { key: "reason", header: "المرجع" }
  ];

  const exportColumns = [
    { key: "id", header: "رقم الحركة" },
    { key: "date", header: "التاريخ" },
    { key: "itemId", header: "رقم الصنف" },
    { key: "itemName", header: "اسم الصنف" },
    { header: "الإجراء", value: (row) => actionLabels[row.action] || row.action },
    { key: "quantity", header: "الكمية" },
    { key: "location", header: "المخزن" },
    { key: "user", header: "تم بواسطة" },
    { key: "reason", header: "المرجع" }
  ];

  return <div className="p-6 lg:p-8 space-y-6" dir="rtl">
    <PageHeaderAr title="سجلات حركة المخزون" subtitle="السجل الكامل لكل معاملات المخزون" />
    {message && <div className="rounded-xl border border-[#4E4631]/10 bg-white px-4 py-3 text-sm text-[#2E3A24]">{message}</div>}

    <div className="flex justify-start gap-2">
      <Button type="button" variant={activeTab === "pending" ? "primary" : "outline"} onClick={() => setActiveTab("pending")}>التحويلات المعلقة</Button>
      <Button type="button" variant={activeTab === "history" ? "primary" : "outline"} onClick={() => setActiveTab("history")}>سجل الحركة</Button>
    </div>

    {activeTab === "pending" && <div className="space-y-4">
      {loading && <p className="text-sm text-[#5A6B50]">جاري تحميل التحويلات المعلقة...</p>}
      {!loading && pendingTransfers.length === 0 && <div className="rounded-xl border border-[#4E4631]/10 bg-white p-6 text-sm text-[#5A6B50]">لا توجد تحويلات معلقة في انتظار الإتمام.</div>}
      {pendingTransfers.map((transfer) => <div key={transfer.orderId} className="rounded-2xl border border-[#4E4631]/10 bg-white p-5 shadow-sm space-y-5 text-right">
        <div className="space-y-4">
          <div className="text-right">
            <p className="text-xs text-[#5A6B50]">رقم الطلب</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-[#2E3A24]">{transfer.requestId}</h3>
              {transfer.hasInsufficientStock && <Badge variant="danger">مخزون غير كاف</Badge>}
            </div>
            <p className="text-sm text-[#5A6B50]">{transfer.source} ← {transfer.destination}</p>
            <p className="text-xs text-[#5A6B50]">مقدم الطلب: {transfer.requester} | تاريخ الموافقة: {formatDate(transfer.approvedAt, "ar-EG")}</p>
            {transfer.hasInsufficientStock && <p className="mt-2 text-sm text-[#D4183D]">المخزن المصدر لا يحتوي على كمية كافية. قم بتغذية المخزن المصدر أو إلغاء هذا التحويل.</p>}
          </div>
          <div className="flex flex-wrap justify-start gap-2">
            {transfer.hasInsufficientStock && <Button type="button" variant="danger" onClick={() => cancelTransfer(transfer.orderId)} disabled={busyOrderId === transfer.orderId}>
              {busyOrderId === transfer.orderId ? "جاري الإلغاء..." : "إلغاء التحويل"}
            </Button>}
            <Button type="button" onClick={() => completeMovement(transfer.orderId)} disabled={busyOrderId === transfer.orderId || transfer.hasInsufficientStock}>
              <CheckCircle className="w-4 h-4" />
              {busyOrderId === transfer.orderId ? "جاري الإتمام..." : "إتمام النقل"}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead>
              <tr className="border-b border-[#4E4631]/10 text-[#5A6B50]">
                <th className="py-2 px-3 text-start">الصنف</th>
                <th className="py-2 px-3 text-start">الكمية المطلوبة</th>
                <th className="py-2 px-3 text-start">المخزون الحالي في المصدر</th>
                <th className="py-2 px-3 text-start">المخزون الحالي في المستلم</th>
              </tr>
            </thead>
            <tbody>
              {transfer.rows.map((row) => <tr key={row.movementId} className="border-b border-[#4E4631]/5">
                <td className="py-2 px-3 font-medium text-[#2E3A24]">{row.productName}</td>
                <td className="py-2 px-3">{formatNumberAr(row.quantity)}</td>
                <td className={`py-2 px-3 ${row.insufficient ? "font-semibold text-[#D4183D]" : ""}`}>
                  {formatNumberAr(row.sourceStock)}
                  {row.insufficient && <span className="me-2 text-xs">(المطلوب {formatNumberAr(row.quantity)})</span>}
                </td>
                <td className="py-2 px-3">{formatNumberAr(row.destinationStock)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>)}
    </div>}

    {activeTab === "history" && <>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث برقم الحركة أو اسم الصنف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-12 text-right"
            />
          </div>
        </div>
        <Select
          options={[
            { value: "all", label: "كل الإجراءات" },
            { value: "in", label: "وارد" },
            { value: "out", label: "صادر" },
            { value: "transfer", label: "نقل" },
            { value: "consumption", label: "استهلاك" },
            { value: "consumption_cancelled", label: "إلغاء استهلاك" }
          ]}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        />
        <Input type="date" min={MIN_DATE_INPUT} max={MAX_DATE_INPUT} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground">
          {loading ? "جاري تحميل سجلات الحركة..." : error || `عرض ${filteredData.length} من ${movementData.length} حركة`}
        </p>
        <ExportCsvButton filenamePrefix="movement-logs-export" columns={exportColumns} rows={loading ? [] : filteredData}>
          تصدير السجلات
        </ExportCsvButton>
      </div>

      <Table
        columns={columns}
        data={loading ? [] : filteredData}
        emptyMessage={error || "لا توجد حركات مخزون. أضف حركة أو شغّل seed."}
      />
    </>}
  </div>;
};

export {
  MovementLogsAr
};
