import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { Search, Shield } from "lucide-react";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate } from "../lib/format";
import { MAX_DATE_INPUT, MIN_DATE_INPUT } from "../lib/dateValidation";

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: auditData, loading, error } = useApiResource(() => api.auditLogs.list(), []);
  const logs = auditData.map((log) => ({
    id: log._id,
    timestamp: log.createdAt,
    user: log.user_name || log.user_id?.name || "System",
    role: log.user_role || log.user_id?.role || "N/A",
    action: log.action || "unknown",
    category: log.module || "system",
    details: log.description || "",
    ipAddress: log.ip_address || "",
    status: "success",
  }));
  const filteredData = logs.filter((log) => {
    const search = String(searchTerm ?? "").toLowerCase();
    const matchesSearch = String(log.id ?? "").toLowerCase().includes(search) || String(log.user ?? "").toLowerCase().includes(search) || String(log.action ?? "").toLowerCase().includes(search) || String(log.details ?? "").toLowerCase().includes(search);
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const columns = [
    { key: "id", header: "Log ID" },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (row) => <div className="text-sm">
          <p className="font-medium text-[#2E3A24]">{formatDate(row.timestamp)}</p>
          <p className="text-[#5A6B50]">{row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : ""}</p>
        </div>
    },
    {
      key: "user",
      header: "User",
      render: (row) => <div>
          <p className="font-medium text-[#2E3A24]">{row.user}</p>
          <p className="text-xs text-[#5A6B50]">{row.role}</p>
        </div>
    },
    { key: "action", header: "Action" },
    {
      key: "category",
      header: "Category",
      render: (row) => {
        const variantMap = { inventory: "info", requests: "success", users: "warning", system: "neutral", security: "danger", notifications: "info", warehouses: "success", export: "neutral" };
        return <Badge variant={variantMap[row.category]}>{row.category}</Badge>;
      }
    },
    { key: "details", header: "Details", render: (row) => <span className="text-sm text-[#5A6B50]">{row.details}</span> },
    { key: "ipAddress", header: "IP Address" },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={row.status === "success" ? "success" : "danger"}>{row.status}</Badge>
    }
  ];
  const exportColumns = [
    { key: "id", header: "Log ID" },
    { header: "Timestamp", value: (row) => formatDate(row.timestamp) },
    { key: "user", header: "User" },
    { key: "role", header: "Role" },
    { key: "action", header: "Action" },
    { key: "category", header: "Category" },
    { key: "details", header: "Details" },
    { key: "ipAddress", header: "IP Address" },
    { key: "status", header: "Status" }
  ];
  return <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Audit Logs" subtitle="Comprehensive system activity and security monitoring" />

      {
    /* Summary stats */
  }
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
    { icon: Shield, label: "Total Logs", value: logs.length, color: "bg-[#4B5B3A]/10 border-[#4B5B3A]/20 text-[#4B5B3A]" },
    { icon: Shield, label: "Successful Actions", value: logs.filter((l) => l.status === "success").length, color: "bg-[#5B8A4A]/10 border-[#5B8A4A]/20 text-[#5B8A4A]" },
    { icon: Shield, label: "Failed Actions", value: logs.filter((l) => l.status === "failed").length, color: "bg-[#D4183D]/8 border-[#D4183D]/15 text-[#D4183D]" },
    { icon: Shield, label: "Security Events", value: logs.filter((l) => l.category === "security").length, color: "bg-[#B8862A]/10 border-[#B8862A]/20 text-[#B8862A]" }
  ].map((stat) => <div key={stat.label} className={`p-5 rounded-2xl border ${stat.color} bg-white border-[#4E4631]/10 shadow-sm`}>
            <p className="text-xs font-medium text-[#5A6B50] mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-[#2E3A24]">{stat.value}</p>
          </div>)}
      </div>

      {
    /* Filters */
  }
      <div className="bg-white rounded-2xl border border-[#4E4631]/10 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B50]" />
              <Input placeholder="Search logs by user, action, or details..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Select options={[{ value: "all", label: "All Categories" }, { value: "inventory", label: "Inventory" }, { value: "requests", label: "Requests" }, { value: "users", label: "User Mgmt" }, { value: "warehouses", label: "Warehouses" }, { value: "notifications", label: "Notifications" }, { value: "export", label: "Export" }, { value: "security", label: "Security" }]} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} />
          <Select options={[{ value: "all", label: "All Status" }, { value: "success", label: "Success" }, { value: "failed", label: "Failed" }]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          <Input type="date" min={MIN_DATE_INPUT} max={MAX_DATE_INPUT} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5A6B50]">
          {loading ? "Loading audit logs..." : error || <>Showing <span className="font-semibold text-[#2E3A24]">{filteredData.length}</span> of {logs.length} audit logs</>}
        </p>
        <ExportCsvButton filenamePrefix="audit-logs-export" columns={exportColumns} rows={filteredData}>
          Export
        </ExportCsvButton>
      </div>

      <Table columns={columns} data={loading ? [] : filteredData} emptyMessage={error || "No audit logs found yet."} />
    </div>;
};
export {
  AuditLogs
};
