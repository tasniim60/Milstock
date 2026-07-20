import { StatCardAr } from "../../components/ar/StatCardAr";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Package, AlertTriangle, Calendar, FileText, ArrowRight, Utensils } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Link } from "react-router";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { getProductStatus } from "../../lib/format";
import { normalizeArray, sameId } from "../../lib/normalize";
import { formatNotification, getLocalizedDisplayName, getLocalizedValue } from "../../lib/localization";
const stockTrendData = [
  { month: "\u064A\u0646\u0627\u064A\u0631", stock: 2400, requests: 240 },
  { month: "\u0641\u0628\u0631\u0627\u064A\u0631", stock: 2210, requests: 198 },
  { month: "\u0645\u0627\u0631\u0633", stock: 2290, requests: 280 },
  { month: "\u0623\u0628\u0631\u064A\u0644", stock: 2e3, requests: 308 },
  { month: "\u0645\u0627\u064A\u0648", stock: 2181, requests: 189 }
];
const categoryData = [
  { name: "\u063A\u0630\u0627\u0621", value: 4500 },
  { name: "\u0623\u0644\u0628\u0627\u0646", value: 2800 },
  { name: "\u0645\u062E\u0628\u0648\u0632\u0627\u062A", value: 3200 },
  { name: "\u0623\u063A\u0630\u064A\u0629", value: 2100 }
];
const COLORS = ["#4B5B3A", "#6A7B4D", "#8A9B6D", "#C9A961"];
const recentRequests = [
  { id: "REQ-1234", kitchen: "\u0627\u0644\u0645\u0637\u0628\u062E \u0627\u0644\u0645\u0631\u0643\u0632\u064A", item: "\u0623\u0631\u0632", quantity: 500, status: "pending", priority: "high", time: "\u0645\u0646\u0630 10 \u062F\u0642\u0627\u0626\u0642" },
  { id: "REQ-1233", kitchen: "\u0645\u0637\u0628\u062E \u0627\u0644\u0645\u062E\u0628\u0648\u0632\u0627\u062A", item: "\u0623\u063A\u0630\u064A\u0629 \u0623\u0644\u0628\u0627\u0646\u0629", quantity: 200, status: "approved", priority: "urgent", time: "\u0645\u0646\u0630 \u0633\u0627\u0639\u0629" },
  { id: "REQ-1232", kitchen: "\u0645\u0637\u0628\u062E \u0627\u0644\u062E\u0636\u0631\u0648\u0627\u062A", item: "\u0642\u0648\u0627\u0631\u064A\u0631 \u0645\u064A\u0627\u0647", quantity: 1e3, status: "delivered", priority: "normal", time: "\u0645\u0646\u0630 3 \u0633\u0627\u0639\u0627\u062A" }
];
const criticalAlerts = [
  { type: "low-stock", message: "\u0627\u0644\u0623\u063A\u0630\u064A\u0629 \u0627\u0644\u0623\u0644\u0628\u0627\u0646\u0629 \u062F\u0648\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0641\u064A \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639 B", severity: "danger", time: "\u0645\u0646\u0630 5 \u062F\u0642\u0627\u0626\u0642" },
  { type: "expiring", message: "50 \u0635\u0646\u0641\u0627\u064B \u062A\u0646\u062A\u0647\u064A \u0635\u0644\u0627\u062D\u064A\u062A\u0647\u0627 \u062E\u0644\u0627\u0644 7 \u0623\u064A\u0627\u0645", severity: "warning", time: "\u0645\u0646\u0630 15 \u062F\u0642\u064A\u0642\u0629" },
  { type: "info", message: "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0634\u0647\u0631\u064A \u0644\u0644\u0645\u062E\u0632\u0648\u0646 \u0628\u0646\u062C\u0627\u062D", severity: "success", time: "\u0645\u0646\u0630 \u0633\u0627\u0639\u062A\u064A\u0646" }
];
const statusLabels = {
  pending: "\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
  approved: "\u0645\u0648\u0627\u0641\u0642 \u0639\u0644\u064A\u0647",
  delivered: "\u062A\u0645 \u0627\u0644\u062A\u0633\u0644\u064A\u0645"
};
const priorityLabels = {
  urgent: "\u0639\u0627\u062C\u0644",
  high: "\u0639\u0627\u0644\u064A\u0629",
  normal: "\u0639\u0627\u062F\u064A\u0629"
};
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return <div className="bg-white border border-[#4E4631]/15 rounded-xl p-3 shadow-md text-xs text-right" dir="rtl">
        <p className="font-semibold text-[#2E3A24] mb-1.5">{label}</p>
        {payload.map((p) => <p key={p.dataKey} className="flex items-center gap-1.5 flex-row-reverse" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}: <span className="font-medium">{p.value.toLocaleString()}</span>
          </p>)}
      </div>;
  }
  return null;
};
const AdminDashboardAr = () => {
  const { data: products } = useApiResource(() => api.products.list(), []);
  const { data: orders } = useApiResource(() => api.orders.list(), []);
  const { data: orderItems } = useApiResource(() => api.orderItems.list(), []);
  const { data: consumptions } = useApiResource(() => api.consumptions.list(), []);
  const { data: notifications } = useApiResource(async () => {
    await api.notifications.expiration().catch(() => {});
    return api.notifications.list();
  }, []);
  const orderItemsArray = normalizeArray(orderItems);
  const lowStockItems = products.filter((product) => ["low-stock", "critical"].includes(getProductStatus(product)));
  const expiringSoon = products.filter((product) => getProductStatus(product) === "expiring-soon");
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const todayKey = new Date().toDateString();
  const consumedToday = consumptions
    .filter((item) => item.status !== "cancelled" && new Date(item.consumption_date || item.createdAt).toDateString() === todayKey)
    .reduce((sum, item) => sum + Number(item.consumed_quantity || item.quantity || 0), 0);
  const categoryData = Object.entries(
    products.reduce((totals, product) => {
      const category = getLocalizedValue(product, "category", "ar") || "غير مصنف";
      totals[category] = (totals[category] || 0) + Number(product.quantity || 0);
      return totals;
    }, {})
  ).map(([name, value]) => ({ name, value }));
  const stockTrendData = orders.slice(-5).map((order) => ({
    month: new Date(order.date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
    stock: products.reduce((sum, product) => sum + Number(product.quantity || 0), 0),
    requests: orderItemsArray.filter((item) => sameId(item.order_id, order._id)).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }));
  const recentRequests = orders.slice(0, 3).map((order) => {
    const items = orderItemsArray.filter((item) => sameId(item.order_id, order._id));
    return {
      id: order._id.slice(-8).toUpperCase(),
      kitchen: getLocalizedDisplayName(order.user_id, "ar") || "مستخدم غير محدد",
      item: items.map((item) => getLocalizedValue(item.product_id, "name", "ar") || getLocalizedValue(item.product, "name", "ar") || item.product_name || item.name).filter(Boolean).join("، ") || "لا توجد أصناف",
      quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      status: order.status,
      priority: order.status === "pending" ? "high" : "normal",
      time: order.date ? new Date(order.date).toLocaleDateString("ar-EG") : "حديث"
    };
  });
  const criticalAlerts = notifications.slice(0, 3).map((notification) => ({
    message: formatNotification(notification, "ar").message || notification.messageAr || notification.message || "إشعار نظام",
    severity: String(notification.type || "").includes("low") ? "danger" : String(notification.type || "").includes("order") ? "success" : "warning",
    time: notification.createdAt ? new Date(notification.createdAt).toLocaleDateString("ar-EG") : "حديث"
  }));
  return <div dir="rtl" className="p-6 lg:p-8 space-y-8">
      {
    /* KPI Stats */
  }
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
        <StatCardAr title="إجمالي أصناف المخزون" value={products.reduce((sum, product) => sum + Number(product.quantity || 0), 0).toLocaleString("ar-EG")} icon={Package} trend={{ value: `${products.length} صنف`, isPositive: true }} color="primary" to="/ar/admin/inventory" />
        <StatCardAr title="أصناف منخفضة المخزون" value={lowStockItems.length.toLocaleString("ar-EG")} icon={AlertTriangle} trend={{ value: "حسب حدود المنتجات", isPositive: false }} color="warning" to="/ar/admin/inventory?status=low_stock" />
        <StatCardAr title="تنتهي صلاحيتها قريباً" value={expiringSoon.length.toLocaleString("ar-EG")} icon={Calendar} trend={{ value: "حسب حدود المنتجات", isPositive: false }} color="danger" to="/ar/admin/inventory?filter=expiring" />
        <StatCardAr title="الطلبات المعلّقة" value={pendingOrders.length.toLocaleString("ar-EG")} icon={FileText} trend={{ value: "طلبات مفتوحة", isPositive: true }} color="success" to="/ar/admin/requests?status=pending" />
        <StatCardAr title="المستهلك اليوم" value={consumedToday.toLocaleString("ar-EG")} icon={Utensils} trend={{ value: `${consumptions.length} سجل`, isPositive: true }} color="primary" to="/ar/admin/consumptions" />
      </div>

      {
    /* Charts */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {
    /* Line chart — wider */
  }
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-right">اتجاهات المخزون</CardTitle>
            <span className="text-xs text-muted-foreground">آخر 5 أشهر</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stockTrendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid key="ar-adm-lc-grid" strokeDasharray="3 3" stroke="#4E4631" opacity={0.07} />
                <XAxis key="ar-adm-lc-xaxis" dataKey="month" stroke="#5A6B50" tick={{ fontSize: 12, fill: "#5A6B50" }} axisLine={false} tickLine={false} />
                <YAxis key="ar-adm-lc-yaxis" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} width={45} />
                <Tooltip key="ar-adm-lc-tooltip" content={<CustomTooltip />} />
                <Legend key="ar-adm-lc-legend" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#5A6B50" }} />
                <Line key="ar-adm-lc-stock" type="monotone" dataKey="stock" stroke="#4B5B3A" strokeWidth={2.5} name="مستوى المخزون" dot={false} activeDot={{ r: 4 }} />
                <Line key="ar-adm-lc-requests" type="monotone" dataKey="requests" stroke="#6A7B4D" strokeWidth={2.5} name="الطلبات" dot={false} activeDot={{ r: 4 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {
    /* Pie chart */
  }
        <Card>
          <CardHeader>
            <CardTitle className="text-right">المخزون حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie key="ar-adm-pc-pie" data={categoryData} cx="50%" cy="45%" outerRadius={85} innerRadius={45} dataKey="value" labelLine={false}>
                  {categoryData.map((entry, index) => <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  key="ar-adm-pc-tooltip"
                  formatter={(value, _name, props) => [
                    Number(value || 0).toLocaleString("ar-EG"),
                    props?.payload?.name || "الفئة"
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid rgba(78,70,49,0.15)" }}
                />
                <Legend key="ar-adm-pc-legend" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#5A6B50" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {
    /* Bottom row */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {
    /* Recent Requests */
  }
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أحدث الطلبات</CardTitle>
            <Link to="/ar/admin/requests">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                عرض الكل
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests.map((req) => <div
    key={req.id}
    className="flex flex-row-reverse items-start justify-between gap-4 p-4 rounded-xl bg-[#ECEEE2]/60 hover:bg-[#ECEEE2] border border-transparent hover:border-[#4E4631]/10 transition-all"
  >
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge
    variant={req.status === "pending" ? "pending" : req.status === "approved" ? "success" : "info"}
  >
                      {statusLabels[req.status]}
                    </Badge>
                    <span className="text-[11px] text-[#5A6B50]">{req.time}</span>
                  </div>
                  <div className="text-right min-w-0 flex-1">
                    <div className="flex items-center gap-2 justify-start flex-row-reverse mb-1">
                      <span className="text-sm font-semibold text-[#2E3A24]">{req.id}</span>
                      <span
    className={req.priority === "urgent" ? "text-[10px] font-bold text-[#D4183D] uppercase tracking-wide" : req.priority === "high" ? "text-[10px] font-bold text-[#B8862A] uppercase tracking-wide" : "text-[10px] text-[#5A6B50] uppercase tracking-wide"}
  >
                        {priorityLabels[req.priority]}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A6B50] mb-1">{req.kitchen}</p>
                    <p className="text-sm text-[#2E3A24]">
                      {req.item} <span className="text-[#5A6B50]">× {req.quantity}</span>
                    </p>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {
    /* Critical Alerts */
  }
        <Card>
          <CardHeader>
            <CardTitle className="text-right">التنبيهات الحرجة</CardTitle>
            <span className="text-xs bg-[#D4183D]/10 text-[#D4183D] px-2 py-0.5 rounded-lg font-medium">
              2 نشط
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert, index) => <div
    key={index}
    className={`relative p-4 pr-7 rounded-xl border text-right ${alert.severity === "danger" ? "bg-[#D4183D]/5 border-[#D4183D]/15" : alert.severity === "warning" ? "bg-[#B8862A]/5 border-[#B8862A]/15" : "bg-[#5B8A4A]/5 border-[#5B8A4A]/15"}`}
  >
                  <div
    className={`absolute right-4 top-5 bottom-5 w-1.5 rounded-full ${alert.severity === "danger" ? "bg-[#D4183D]" : alert.severity === "warning" ? "bg-[#B8862A]" : "bg-[#5B8A4A]"}`}
  />
                  <div className="min-w-0">
                    <p className="text-sm text-[#2E3A24] font-medium leading-snug mb-1">{alert.message}</p>
                    <p className="text-xs text-[#5A6B50]">{alert.time}</p>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export {
  AdminDashboardAr
};
