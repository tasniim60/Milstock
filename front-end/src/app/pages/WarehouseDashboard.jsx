import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, AlertTriangle, Boxes, Clock, MapPin, Package, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { normalizeRecord } from "../lib/normalize";
import { getLocalizedDisplayName, getLocalizedValue } from "../lib/localization";

const StatCard = ({ title, value, icon: Icon, tone = "info", onClick }) => (
  <Card
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(event) => {
      if (!onClick) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
    className={onClick ? "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6A7B4D]/30" : ""}
  >
    <CardContent className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-[#6A7B4D]/12">
        <Icon className="w-5 h-5 text-[#4B5B3A]" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold ${tone === "warning" ? "text-[#B8862A]" : "text-[#2E3A24]"}`}>{value}</p>
      </div>
    </CardContent>
  </Card>
);

const WarehouseDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isArabic = location.pathname.startsWith("/ar");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("milstock_user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const canDeleteWarehouse = currentUser?.role === "admin";

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    api.warehouses.getDashboard(id)
      .then((response) => {
        if (!mounted) return;
        setDashboard(normalizeRecord(response));
      })
      .catch((requestError) => {
        if (!mounted) return;
        setError(requestError.message || "Warehouse not found");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const totalDistribution = useMemo(() => (
    dashboard?.stockDistribution || []
  ).reduce((sum, row) => sum + Number(row.quantity || 0), 0), [dashboard]);

  const labels = isArabic ? {
    loading: "جاري تحميل لوحة تحكم المخزن...",
    back: "العودة إلى المخازن",
    dashboard: "لوحة تحكم المخزن",
    notFound: "المخزن غير موجود",
    location: "الموقع",
    manager: "المدير",
    unassigned: "غير محدد",
    status: "الحالة",
    active: "نشط",
    capacity: "نسبة الإشغال",
    totalItems: "إجمالي الأصناف",
    totalQuantity: "إجمالي الكمية",
    lowStock: "أصناف منخفضة المخزون",
    expiringSoon: "تنتهي صلاحيتها قريباً",
    pendingRequests: "الطلبات المعلقة",
    completedMovements: "الحركات المكتملة",
    stockDistribution: "توزيع المخزون",
    noInventory: "لا توجد أصناف مخزنة في هذا المخزن",
    inventory: "المخزون",
    item: "الصنف",
    category: "الفئة",
    quantity: "الكمية",
    expiration: "تاريخ الانتهاء",
    inStock: "متوفر",
    movementLogs: "سجلات الحركة",
    noMovements: "لا توجد سجلات حركة لهذا المخزن",
    incoming: "وارد",
    outgoing: "صادر",
    requests: "الطلبات",
    noRequests: "لا توجد طلبات لهذا المخزن",
    supplier: "مورد",
    unknownProduct: "صنف غير معروف",
    unknownRequester: "مقدم طلب غير معروف"
  } : {
    loading: "Loading warehouse dashboard...",
    back: "Back to Warehouses",
    dashboard: "Warehouse Dashboard",
    notFound: "Warehouse not found",
    location: "Location",
    manager: "Manager",
    unassigned: "Unassigned",
    status: "Status",
    active: "active",
    capacity: "Capacity Utilization",
    totalItems: "Total Items",
    totalQuantity: "Total Quantity",
    lowStock: "Low Stock Items",
    expiringSoon: "Expiring Soon",
    pendingRequests: "Pending Requests",
    completedMovements: "Completed Movements",
    stockDistribution: "Stock Distribution",
    noInventory: "No items stored in this warehouse",
    inventory: "Inventory",
    item: "Item",
    category: "Category",
    quantity: "Quantity",
    expiration: "Expiration",
    inStock: "In Stock",
    movementLogs: "Movement Logs",
    noMovements: "No movement logs for this warehouse",
    incoming: "Incoming",
    outgoing: "Outgoing",
    requests: "Requests",
    noRequests: "No requests for this warehouse",
    supplier: "Supplier",
    unknownProduct: "Unknown product",
    unknownRequester: "Unknown requester"
  };

  const deleteLabels = isArabic ? {
    action: "حذف المخزن",
    title: "حذف المخزن",
    message: "هل أنت متأكد أنك تريد حذف هذا المخزن؟ لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    deleting: "جاري الحذف...",
    error: "تعذر حذف هذا المخزن."
  } : {
    action: "Remove Warehouse",
    title: "Remove Warehouse",
    message: "Are you sure you want to remove this warehouse? This action cannot be undone.",
    cancel: "Cancel",
    deleting: "Removing...",
    error: "Unable to remove this warehouse."
  };

  const handleDeleteWarehouse = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.warehouses.remove(id);
      navigate(isArabic ? "/ar/admin/inventory/warehouses" : "/admin/inventory/warehouses");
    } catch (requestError) {
      setDeleteError(requestError.message || deleteLabels.error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6 lg:p-8" dir={isArabic ? "rtl" : "ltr"}><p className="text-sm text-[#5A6B50]">{labels.loading}</p></div>;
  }

  if (error || !dashboard?.warehouse) {
    return <div className="p-6 lg:p-8 space-y-4" dir={isArabic ? "rtl" : "ltr"}>
      <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /> {labels.back}</Button>
      <Card><p className="text-sm text-[#D4183D]">{error || labels.notFound}</p></Card>
    </div>;
  }

  const { warehouse, stats, stockDistribution = [], inventory = [], movements = [], requests = [] } = dashboard;
  const adminPrefix = isArabic ? "/ar/admin" : "/admin";
  const locale = isArabic ? "ar" : "en";
  const warehouseName = getLocalizedValue(warehouse, "name", locale);
  const warehouseLocation = getLocalizedValue(warehouse, "location", locale);

  return <div className="p-6 lg:p-8 space-y-6" dir={isArabic ? "rtl" : "ltr"}>
    <Button variant="outline" onClick={() => navigate(isArabic ? "/ar/admin/inventory/warehouses" : "/admin/inventory/warehouses")}>
      <ArrowLeft className="w-4 h-4" />
      {labels.back}
    </Button>

    <PageHeader
      title={warehouseName}
      subtitle={labels.dashboard}
      action={canDeleteWarehouse ? {
        label: deleting ? deleteLabels.deleting : deleteLabels.action,
        icon: Trash2,
        variant: "danger",
        onClick: () => {
          setDeleteError("");
          setShowDeleteConfirm(true);
        },
        disabled: deleting
      } : undefined}
    />

    {deleteError && <div className="rounded-xl border border-[#D4183D]/25 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">
      {deleteError}
    </div>}

    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">{labels.location}</p>
          <p className="font-semibold text-[#2E3A24] flex items-center gap-2"><MapPin className="w-4 h-4" />{warehouseLocation}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{labels.manager}</p>
          <p className="font-semibold text-[#2E3A24]">{getLocalizedDisplayName(warehouse.user_id, locale) || labels.unassigned}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{labels.status}</p>
          <Badge variant={warehouse.status === "inactive" ? "danger" : "success"}>{warehouse.status || labels.active}</Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{labels.capacity}</p>
          <p className="font-semibold text-[#2E3A24]">{stats?.capacityUtilization || 0}%</p>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard title={labels.totalItems} value={stats?.totalItems || 0} icon={Package} onClick={() => navigate(`${adminPrefix}/inventory?warehouse_id=${id}`)} />
      <StatCard title={labels.totalQuantity} value={(stats?.totalQuantity || 0).toLocaleString()} icon={Boxes} />
      <StatCard title={labels.lowStock} value={stats?.lowStockCount || stats?.lowStockItems || 0} icon={AlertTriangle} tone="warning" onClick={() => navigate(`${adminPrefix}/inventory?warehouse_id=${id}&status=low_stock`)} />
      <StatCard title={labels.expiringSoon} value={stats?.expiringSoonCount || stats?.expiringSoonItems || 0} icon={Clock} tone="warning" onClick={() => navigate(`${adminPrefix}/inventory?warehouse_id=${id}&filter=expiring`)} />
      <StatCard title={labels.pendingRequests} value={stats?.pendingRequestsCount || stats?.pendingRequests || 0} icon={RefreshCw} onClick={() => navigate(`${adminPrefix}/requests?warehouse_id=${id}&status=pending`)} />
      <StatCard title={labels.completedMovements} value={stats?.completedMovementsCount || stats?.completedMovements || 0} icon={MapPin} onClick={() => navigate(`${adminPrefix}/inventory/logs?warehouse_id=${id}&status=completed`)} />
    </div>

    <Card>
      <CardHeader><CardTitle>{labels.stockDistribution}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {stockDistribution.length === 0 && <p className="text-sm text-muted-foreground">{labels.noInventory}</p>}
        {stockDistribution.map((row) => {
          const percentage = totalDistribution ? Math.round(Number(row.quantity || 0) / totalDistribution * 100) : 0;
          const categoryLabel = isArabic ? row.categoryAr || row.category : row.category;
          return <div key={row.category}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-[#2E3A24]">{categoryLabel}</span>
              <span className="text-muted-foreground">{row.quantity} ({percentage}%)</span>
            </div>
            <div className="h-2 bg-[#E0E1B7] rounded-full overflow-hidden">
              <div className="h-full bg-[#6A7B4D]" style={{ width: `${percentage}%` }} />
            </div>
          </div>;
        })}
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>{labels.inventory}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {inventory.length === 0 ? <p className="text-sm text-muted-foreground">{labels.noInventory}</p> : <table className={`w-full text-sm ${isArabic ? "text-right" : "text-left"}`}>
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2 pr-3">{labels.item}</th><th className="py-2 pr-3">{labels.category}</th><th className="py-2 pr-3">{labels.quantity}</th><th className="py-2 pr-3">{labels.status}</th><th className="py-2 pr-3">{labels.expiration}</th>
            </tr></thead>
            <tbody>{inventory.map((item) => <tr key={item._id} className="border-b border-border/60">
              <td className="py-2 pr-3 font-medium text-[#2E3A24]">{getLocalizedValue(item, "name", locale)}</td>
              <td className="py-2 pr-3">{getLocalizedValue(item, "category", locale)}</td>
              <td className="py-2 pr-3">{item.quantity} {item.unit}</td>
              <td className="py-2 pr-3"><Badge variant={item.status === "critical" ? "danger" : item.status === "low_stock" ? "warning" : "success"}>{item.status === "critical" ? "Critical" : item.status === "low_stock" ? labels.lowStock : labels.inStock}</Badge></td>
              <td className="py-2 pr-3">{formatDate(item.expiration_date)}</td>
            </tr>)}</tbody>
          </table>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{labels.movementLogs}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {movements.length === 0 && <p className="text-sm text-muted-foreground">{labels.noMovements}</p>}
          {movements.slice(0, 8).map((movement) => {
            const incoming = String(movement.to_warehouse?._id || movement.reference_id || "") === String(id);
            return <div key={movement._id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <p className="font-medium text-[#2E3A24]">{getLocalizedValue(movement.product_id, "name", locale) || labels.unknownProduct}</p>
                <p className="text-xs text-muted-foreground">{incoming ? labels.incoming : labels.outgoing} | {formatDate(movement.createdAt)}</p>
              </div>
              <Badge variant={incoming ? "success" : "warning"}>{movement.stock}</Badge>
            </div>;
          })}
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader><CardTitle>{labels.requests}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 && <p className="text-sm text-muted-foreground">{labels.noRequests}</p>}
        {requests.slice(0, 10).map((request) => <div key={request._id} className="grid grid-cols-1 md:grid-cols-5 gap-3 border-b border-border/60 pb-3 text-sm">
          <p className="font-medium text-[#2E3A24]">{String(request._id).slice(-8).toUpperCase()}</p>
          <p>{getLocalizedValue(request.source_warehouse, "name", locale) || labels.supplier} &rarr; {getLocalizedValue(request.destination_warehouse, "name", locale) || warehouseName}</p>
          <p>{getLocalizedDisplayName(request.requested_by, locale) || getLocalizedDisplayName(request.user_id, locale) || labels.unknownRequester}</p>
          <Badge variant={request.status === "pending" ? "pending" : request.status === "rejected" ? "danger" : "info"}>{request.status}</Badge>
          <p className="text-muted-foreground">{formatDate(request.createdAt)}</p>
        </div>)}
      </CardContent>
    </Card>

    {showDeleteConfirm && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#4E4631]/12">
        <h3 className="text-[#2E3A24] font-semibold mb-2">{deleteLabels.title}</h3>
        <p className="text-sm text-[#5A6B50] mb-6">{deleteLabels.message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
            {deleteLabels.cancel}
          </Button>
          <Button variant="danger" type="button" onClick={handleDeleteWarehouse} disabled={deleting}>
            {deleting ? deleteLabels.deleting : deleteLabels.action}
          </Button>
        </div>
      </div>
    </div>}
  </div>;
};

export {
  WarehouseDashboard
};
