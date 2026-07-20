import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
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

const SupplierOrders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: orders, loading, error } = useApiResource(() => api.supplierUsers.orders(), []);

  const rows = useMemo(() => orders.map((order) => ({
    id: order._id.slice(-8).toUpperCase(),
    mongoId: order._id,
    requester: order.requested_by?.name || order.user_id?.name || "Unknown requester",
    warehouse: order.source_warehouse?.name || order.destination_warehouse?.name || order.user_id?.assigned_warehouse?.name || "Not assigned",
    status: order.status,
    created: formatDate(order.createdAt || order.date)
  })), [orders]);

  const filteredRows = rows.filter((row) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = row.id.toLowerCase().includes(search) || row.requester.toLowerCase().includes(search) || row.warehouse.toLowerCase().includes(search);
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: "id", header: "Request ID" },
    { key: "requester", header: "Requester" },
    { key: "warehouse", header: "Warehouse" },
    { key: "created", header: "Created" },
    { key: "status", header: "Status", render: (row) => <Badge variant={statusVariant[row.status] || "neutral"}>{row.status}</Badge> },
    { key: "open", header: "", render: () => <span className="text-xs font-semibold text-[#4B5B3A]">Open details</span> }
  ];

  return <div className="p-6 lg:p-8 space-y-6">
    <PageHeader title="supplier Orders" subtitle="Review and update requests assigned to you" />
    <div className="bg-white rounded-2xl border border-[#4E4631]/10 p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B50]" />
          <Input placeholder="Search supplier orders..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} options={[
          { value: "all", label: "All Status" },
          { value: "pending", label: "Pending" },
          { value: "accepted", label: "Accepted" },
          { value: "in_delivery", label: "In Delivery" },
          { value: "delivered", label: "Delivered" },
          { value: "rejected", label: "Rejected" }
        ]} />
      </div>
    </div>
    <Table columns={columns} data={loading ? [] : filteredRows} emptyMessage={error || "No supplier requests found."} onRowClick={(row) => navigate(`/supplier/orders/${row.mongoId}`)} />
  </div>;
};

export { SupplierOrders };
