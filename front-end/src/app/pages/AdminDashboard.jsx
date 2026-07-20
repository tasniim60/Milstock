import { StatCard } from "../components/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import {
  Package,
  AlertTriangle,
  Calendar,
  FileText,
  ArrowRight,
  Utensils
} from "lucide-react";
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
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { getProductStatus } from "../lib/format";
import { normalizeArray, sameId } from "../lib/normalize";
import { formatNotification, getLocalizedValue } from "../lib/localization";
const COLORS = ["#4B5B3A", "#6A7B4D", "#8A9B6D", "#C9A961"];
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return <div className="bg-white border border-[#4E4631]/15 rounded-xl p-3 shadow-md text-xs">
        <p className="font-semibold text-[#2E3A24] mb-1.5">{label}</p>
        {payload.map((p) => <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}: <span className="font-medium">{p.value.toLocaleString()}</span>
          </p>)}
      </div>;
  }
  return null;
};
const AdminDashboard = () => {
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
      const category = getLocalizedValue(product, "category", "en") || "Uncategorized";
      totals[category] = (totals[category] || 0) + product.quantity;
      return totals;
    }, {})
  ).map(([name, value]) => ({ name, value }));
  const stockTrendData = orders.slice(-5).map((order) => ({
    month: new Date(order.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    stock: products.reduce((sum, product) => sum + product.quantity, 0),
    requests: orderItemsArray.filter((item) => sameId(item.order_id, order._id)).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }));
  const recentRequests = orders.slice(0, 3).map((order) => {
    const items = orderItemsArray.filter((item) => sameId(item.order_id, order._id));
    return {
      id: order._id.slice(-8).toUpperCase(),
      kitchen: order.user_id?.name || "Unknown kitchen",
      item: items.map((item) => getLocalizedValue(item.product_id, "name", "en") || getLocalizedValue(item.product, "name", "en") || item.product_name || item.name).filter(Boolean).join(", ") || "No items",
      quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      status: order.status,
      priority: order.status === "pending" ? "high" : "normal",
      time: new Date(order.date).toLocaleDateString()
    };
  });
  const criticalAlerts = notifications.slice(0, 3).map((notification) => ({
    message: formatNotification(notification, "en").message || notification.message,
    severity: notification.type.includes("low") ? "danger" : notification.type.includes("order") ? "success" : "warning",
    time: notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : "Recent"
  }));
  return <div className="p-6 lg:p-8 space-y-8">
      {
    /* KPI stats */
  }
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
        <StatCard title="Total Inventory Items" value={products.reduce((sum, product) => sum + product.quantity, 0).toLocaleString()} icon={Package} trend={{ value: `${products.length} products`, isPositive: true }} color="primary" to="/admin/inventory" />
        <StatCard title="Low Stock Items" value={lowStockItems.length.toString()} icon={AlertTriangle} trend={{ value: "From product thresholds", isPositive: false }} color="warning" to="/admin/inventory?status=low_stock" />
        <StatCard title="Expiring Soon" value={expiringSoon.length.toString()} icon={Calendar} trend={{ value: "Product thresholds", isPositive: false }} color="danger" to="/admin/inventory?filter=expiring" />
        <StatCard title="Pending Requests" value={pendingOrders.length.toString()} icon={FileText} trend={{ value: "Open orders", isPositive: true }} color="success" to="/admin/requests?status=pending" />
        <StatCard title="Consumed Today" value={consumedToday.toLocaleString()} icon={Utensils} trend={{ value: `${consumptions.length} records`, isPositive: true }} color="primary" to="/admin/consumptions" />
      </div>

      {
    /* Charts row */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {
    /* Inventory trends — wider */
  }
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inventory Trends</CardTitle>
            <span className="text-xs text-muted-foreground">Last 5 months</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stockTrendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid key="adm-lc-grid" strokeDasharray="3 3" stroke="#4E4631" opacity={0.07} />
                <XAxis key="adm-lc-xaxis" dataKey="month" stroke="#5A6B50" tick={{ fontSize: 12, fill: "#5A6B50" }} axisLine={false} tickLine={false} />
                <YAxis key="adm-lc-yaxis" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} width={45} />
                <Tooltip key="adm-lc-tooltip" content={<CustomTooltip />} />
                <Legend key="adm-lc-legend" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#5A6B50" }} />
                <Line key="adm-lc-stock" type="monotone" dataKey="stock" stroke="#4B5B3A" strokeWidth={2.5} name="Stock Level" dot={false} activeDot={{ r: 4 }} />
                <Line key="adm-lc-requests" type="monotone" dataKey="requests" stroke="#6A7B4D" strokeWidth={2.5} name="Requests" dot={false} activeDot={{ r: 4 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {
    /* Pie chart — narrower */
  }
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie key="adm-pc-pie" data={categoryData} cx="50%" cy="45%" outerRadius={85} innerRadius={45} dataKey="value" labelLine={false}>
                  {categoryData.map((entry, index) => <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  key="adm-pc-tooltip"
                  formatter={(value, _name, props) => [
                    Number(value || 0).toLocaleString(),
                    props?.payload?.name || "Category"
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #4E4631/15" }}
                />
                <Legend key="adm-pc-legend" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#5A6B50" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {
    /* Bottom row: Requests + Alerts */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {
    /* Recent Requests */
  }
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <Link to="/admin/requests">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests.length === 0 && <p className="text-sm text-[#5A6B50]">No Recorded orders found.</p>}
              {recentRequests.map((req) => <div
    key={req.id}
    className="flex items-start justify-between p-4 rounded-xl bg-[#ECEEE2]/60 hover:bg-[#ECEEE2] border border-transparent hover:border-[#4E4631]/10 transition-all"
  >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#2E3A24]">{req.id}</span>
                      <span
    className={req.priority === "urgent" ? "text-[10px] font-bold text-[#D4183D] uppercase tracking-wide" : req.priority === "high" ? "text-[10px] font-bold text-[#B8862A] uppercase tracking-wide" : "text-[10px] text-[#5A6B50] uppercase tracking-wide"}
  >
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A6B50] mb-1">{req.kitchen}</p>
                    <p className="text-sm text-[#2E3A24]">
                      {req.item} <span className="text-[#5A6B50]">× {req.quantity}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                    <Badge
    variant={req.status === "pending" ? "pending" : req.status === "approved" ? "success" : req.status === "cancelled" ? "danger" : "info"}
  >
                      {req.status}
                    </Badge>
                    <span className="text-[11px] text-[#5A6B50]">{req.time}</span>
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
            <CardTitle>Critical Alerts</CardTitle>
            <span className="text-xs bg-[#D4183D]/10 text-[#D4183D] px-2 py-0.5 rounded-lg font-medium">
              2 Active
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.length === 0 && <p className="text-sm text-[#5A6B50]">No notifications found.</p>}
              {criticalAlerts.map((alert, index) => <div
    key={index}
    className={`flex items-start gap-3 p-4 rounded-xl border ${alert.severity === "danger" ? "bg-[#D4183D]/5 border-[#D4183D]/15" : alert.severity === "warning" ? "bg-[#B8862A]/5 border-[#B8862A]/15" : "bg-[#5B8A4A]/5 border-[#5B8A4A]/15"}`}
  >
                  <div
    className={`w-1.5 flex-shrink-0 rounded-full mt-0.5 self-stretch ${alert.severity === "danger" ? "bg-[#D4183D]" : alert.severity === "warning" ? "bg-[#B8862A]" : "bg-[#5B8A4A]"}`}
  />
                  <div className="flex-1 min-w-0">
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
  AdminDashboard
};
