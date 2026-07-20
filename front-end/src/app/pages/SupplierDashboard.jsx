import { CheckCircle, Clock, FileText, Truck, XCircle } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Link } from "react-router";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate } from "../lib/format";

const statusVariant = {
  pending: "pending",
  accepted: "success",
  rejected: "danger",
  in_delivery: "info",
  delivered: "success"
};

const SupplierDashboard = () => {
  const { data: orders, loading, error } = useApiResource(() => api.supplierUsers.orders(), []);
  const count = (status) => orders.filter((order) => order.status === status).length;

  return <div className="p-6 lg:p-8 space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      <StatCard title="Total Requests" value={orders.length.toString()} icon={FileText} trend={{ value: "supplier orders", isPositive: true }} color="primary" />
      <StatCard title="Pending" value={count("pending").toString()} icon={Clock} trend={{ value: "Awaiting response", isPositive: true }} color="warning" />
      <StatCard title="Accepted" value={count("accepted").toString()} icon={CheckCircle} trend={{ value: "Ready to prepare", isPositive: true }} color="success" />
      <StatCard title="In Delivery" value={count("in_delivery").toString()} icon={Truck} trend={{ value: "On the way", isPositive: true }} color="primary" />
      <StatCard title="Delivered" value={count("delivered").toString()} icon={Truck} trend={{ value: "Completed deliveries", isPositive: true }} color="success" />
      <StatCard title="Rejected" value={count("rejected").toString()} icon={XCircle} trend={{ value: "Declined requests", isPositive: false }} color="danger" />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Recent supplier Orders</CardTitle>
        <Link to="/supplier/orders"><Button variant="ghost" size="sm">View All</Button></Link>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-[#5A6B50]">Loading supplier orders...</p>}
        {error && <p className="text-sm text-[#D4183D]">{error}</p>}
        {!loading && !error && orders.length === 0 && <p className="text-sm text-[#5A6B50]">No supplier requests yet.</p>}
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => <Link key={order._id} to={`/supplier/orders/${order._id}`} className="flex items-center justify-between rounded-xl border border-[#4E4631]/10 bg-[#ECEEE2]/60 px-4 py-3">
            <div>
              <p className="font-semibold text-[#2E3A24]">{order._id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-[#5A6B50]">{order.requested_by?.name || order.user_id?.name || "Requester"} - {formatDate(order.createdAt || order.date)}</p>
            </div>
            <Badge variant={statusVariant[order.status] || "neutral"}>{order.status}</Badge>
          </Link>)}
        </div>
      </CardContent>
    </Card>
  </div>;
};

export { SupplierDashboard };
