import { StatCard } from "../components/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FileText, Plus, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { getProductStatus } from "../lib/format";
import { normalizeArray, sameId } from "../lib/normalize";
import { getStoredAssignedWarehouse } from "../lib/warehouseDisplay";
import { getLocalizedValue } from "../lib/localization";
const statusVariant = {
  pending: "pending",
  approved: "success",
  completed: "info",
  cancelled: "danger"
};
const UserDashboard = () => {
  const navigate = useNavigate();
  const assignedWarehouse = getStoredAssignedWarehouse();
  const { data: orders } = useApiResource(() => api.orders.list(), []);
  const { data: orderItems } = useApiResource(() => api.orderItems.list(), []);
  const { data: products } = useApiResource(() => api.products.list(), []);
  const { data: notifications } = useApiResource(() => api.notifications.list(), []);
  const orderItemsArray = normalizeArray(orderItems);
  const myRequests = orders.slice(0, 3).map((order) => {
    const items = orderItemsArray.filter((item) => sameId(item.order_id, order._id));
    return {
      id: order._id.slice(-8).toUpperCase(),
      mongoId: order._id,
      item: items.map((item) => getLocalizedValue(item.product_id, "name", "en") || getLocalizedValue(item.product, "name", "en") || item.product_name || item.name).filter(Boolean).join(", ") || "No items",
      quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      status: order.status,
      requestedDate: new Date(order.date).toLocaleDateString(),
      deliveryDate: order.status === "completed" ? "Completed" : "TBD"
    };
  });
  const stockData = products.slice(0, 7).map((product) => ({
    day: getLocalizedValue(product, "name", "en").slice(0, 8),
    level: product.min_quantity ? Math.min(100, Math.round(product.quantity / (product.min_quantity * 3) * 100)) : 100
  }));
  const availableStock = Object.entries(
    products.reduce((totals, product) => {
      const category = getLocalizedValue(product, "category", "en") || "Uncategorized";
      totals[category] = (totals[category] || 0) + 1;
      return totals;
    }, {})
  ).map(([category, items]) => {
    const hasLowStock = products.some((product) => (getLocalizedValue(product, "category", "en") || "Uncategorized") === category && ["low-stock", "critical"].includes(getProductStatus(product)));
    return { category, items, status: hasLowStock ? "Low Stock" : "In Stock" };
  });
  const pendingRequests = orders.filter((order) => order.status === "pending").length;
  const completedRequests = orders.filter((order) => order.status === "completed").length;
  if (!assignedWarehouse.id) {
    return <div className="p-6 lg:p-8">
      <Card>
        <CardContent className="py-10 text-center text-[#D4183D]">
          No warehouse assigned to this user. Please contact admin.
        </CardContent>
      </Card>
    </div>;
  }
  return <div className="p-6 lg:p-8 space-y-8">
      {
    /* Header action */
  }
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm font-medium text-[#2E3A24]">Warehouse: {assignedWarehouse.name || "Not assigned"}</p>
        <Button onClick={() => navigate("/user/requests/create")} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {
    /* KPI Stats */
  }
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        <StatCard title="Active Requests" value={orders.length.toString()} icon={FileText} trend={{ value: "Recorded orders", isPositive: true }} color="primary" />
        <StatCard title="Pending Approval" value={pendingRequests.toString()} icon={Clock} trend={{ value: "Awaiting review", isPositive: true }} color="warning" />
        <StatCard title="Completed This Month" value={completedRequests.toString()} icon={CheckCircle} trend={{ value: "Completed orders", isPositive: true }} color="success" />
      </div>

      {
    /* Charts + Notifications */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {
    /* Stock trend */
  }
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stock Level — This Week</CardTitle>
            <span className="text-xs text-muted-foreground">% of capacity</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stockData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid key="usr-lc-grid" strokeDasharray="3 3" stroke="#4E4631" opacity={0.07} />
                <XAxis key="usr-lc-xaxis" dataKey="day" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} />
                <YAxis key="usr-lc-yaxis" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} domain={[60, 100]} width={35} />
                <Tooltip
    key="usr-lc-tooltip"
    contentStyle={{ backgroundColor: "#fff", border: "1px solid rgba(78,70,49,0.15)", borderRadius: 10, fontSize: 12 }}
    formatter={(value) => [`${value}%`, "Stock Level"]}
  />
                <Line key="usr-lc-level" type="monotone" dataKey="level" stroke="#6A7B4D" strokeWidth={2.5} dot={{ fill: "#6A7B4D", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {
    /* Notifications */
  }
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <Link to="/user/notifications">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 && <p className="text-sm text-[#5A6B50]">No notifications found.</p>}
              {notifications.slice(0, 3).map((n) => <div
    key={n._id}
    className={`flex items-start gap-3 p-3.5 rounded-xl border ${n.type.includes("order") ? "bg-[#5B8A4A]/5 border-[#5B8A4A]/15" : n.type.includes("low") ? "bg-[#B8862A]/5 border-[#B8862A]/15" : "bg-[#6A7B4D]/5 border-[#6A7B4D]/15"}`}
  >
                  <div className={`w-1.5 flex-shrink-0 rounded-full self-stretch mt-0.5 ${n.type.includes("order") ? "bg-[#5B8A4A]" : n.type.includes("low") ? "bg-[#B8862A]" : "bg-[#6A7B4D]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#2E3A24] mb-0.5">{n.message}</p>
                    <p className="text-xs text-[#5A6B50]">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Recent"}</p>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {
    /* Requests + Available Stock */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {
    /* Requests table */
  }
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Recent Requests</CardTitle>
            <Link to="/user/requests">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myRequests.length === 0 && <p className="text-sm text-[#5A6B50]">No Recorded orders found.</p>}
              {myRequests.map((req) => <Link
    key={req.id}
    to={`/user/requests/${req.mongoId}`}
    className="flex items-start justify-between p-4 rounded-xl bg-[#ECEEE2]/60 hover:bg-[#ECEEE2] border border-transparent hover:border-[#4E4631]/10 transition-all group"
  >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#2E3A24]">{req.id}</span>
                    </div>
                    <p className="text-sm text-[#2E3A24] mb-1">{req.item} <span className="text-[#5A6B50]">× {req.quantity}</span></p>
                    <div className="flex items-center gap-4 text-xs text-[#5A6B50]">
                      <span>Requested: {req.requestedDate}</span>
                      <span>Delivery: {req.deliveryDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <Badge variant={statusVariant[req.status]}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</Badge>
                    <ArrowRight className="w-4 h-4 text-[#5A6B50] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>)}
            </div>
          </CardContent>
        </Card>

        {
    /* Available Stock */
  }
        <Card>
          <CardHeader>
            <CardTitle>Available Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableStock.length === 0 && <p className="text-sm text-[#5A6B50]">No products found.</p>}
              {availableStock.map((stock) => <div key={stock.category} className="flex items-center justify-between p-3.5 rounded-xl bg-[#ECEEE2]/60 border border-[#4E4631]/8">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2E3A24] truncate">{stock.category}</p>
                    <p className="text-xs text-[#5A6B50] mt-0.5">{stock.items} items</p>
                  </div>
                  <Badge variant={stock.status === "Low Stock" ? "warning" : "success"} size="sm">
                    {stock.status}
                  </Badge>
                </div>)}
              <Link to="/user/inventory" className="block mt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Browse Inventory
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export {
  UserDashboard
};
