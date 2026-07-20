import { useState } from "react";
import { Search, Shield } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Badge } from "../../components/Badge";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { ExportCsvButton } from "../../components/ExportCsvButton";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatDate } from "../../lib/format";
import { getLocalizedDisplayName, getLocalizedRoleLabel } from "../../lib/localization";

const moduleLabels = {
  inventory: "المخزون",
  requests: "الطلبات",
  users: "المستخدمون",
  warehouses: "المخازن",
  notifications: "الإشعارات",
  export: "التصدير",
  security: "الأمان",
};

const AuditLogsAr = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const { data: auditData, loading, error } = useApiResource(() => api.auditLogs.list(), []);
  const logs = auditData.map((log) => ({
    id: log._id,
    action: log.action || "unknown",
    module: log.module || "system",
    moduleLabel: moduleLabels[log.module] || log.module || "النظام",
    performedBy: getLocalizedDisplayName(log.user_id, "ar") || getLocalizedRoleLabel(log.user_name, "ar") || "النظام",
    role: getLocalizedRoleLabel(log.user_role || log.user_id?.role, "ar") || "N/A",
    ipAddress: log.ip_address || "",
    timestamp: log.createdAt,
    details: log.description || "",
    status: "success",
  }));

  const filtered = logs.filter((log) => {
    const search = String(searchTerm ?? "").toLowerCase();
    const matchSearch = String(log.action ?? "").toLowerCase().includes(search) || String(log.performedBy ?? "").toLowerCase().includes(search) || String(log.details ?? "").toLowerCase().includes(search);
    const matchModule = moduleFilter === "all" || log.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const exportColumns = [
    { key: "id", header: "رقم السجل" },
    { key: "action", header: "الإجراء" },
    { key: "moduleLabel", header: "الوحدة" },
    { key: "performedBy", header: "منفذ بواسطة" },
    { key: "role", header: "الصلاحية" },
    { key: "ipAddress", header: "عنوان IP" },
    { header: "التاريخ", value: (row) => formatDate(row.timestamp) },
    { key: "details", header: "التفاصيل" }
  ];

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <PageHeaderAr title="سجل العمليات" subtitle="مراجعة الأنشطة المهمة المسجلة" />

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "إجمالي السجلات", value: logs.length, color: "border-[#4B5B3A]/20" },
        { label: "عمليات المخزون", value: logs.filter((l) => l.module === "inventory").length, color: "border-[#5B8A4A]/20" },
        { label: "عمليات المستخدمين", value: logs.filter((l) => l.module === "users").length, color: "border-[#B8862A]/20" },
        { label: "عمليات التصدير", value: logs.filter((l) => l.module === "export").length, color: "border-[#D4183D]/15" }
      ].map((stat) => <div key={stat.label} className={`p-5 rounded-2xl border bg-white ${stat.color} shadow-sm text-right`}>
        <p className="text-xs font-medium text-[#5A6B50] mb-2">{stat.label}</p>
        <p className="text-3xl font-bold text-[#2E3A24]">{stat.value}</p>
      </div>)}
    </div>

    <div className="bg-white rounded-2xl border border-[#4E4631]/10 p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A6B50] pointer-events-none" />
          <Input placeholder="ابحث في السجلات..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-12 text-right" />
        </div>
        <Select
          options={[
            { value: "all", label: "جميع الوحدات" },
            { value: "inventory", label: "المخزون" },
            { value: "requests", label: "الطلبات" },
            { value: "users", label: "المستخدمون" },
            { value: "warehouses", label: "المخازن" },
            { value: "notifications", label: "الإشعارات" },
            { value: "export", label: "التصدير" }
          ]}
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        />
      </div>
    </div>

    <div className="flex items-center justify-between">
      <p className="text-sm text-[#5A6B50]">
        {loading ? "جار تحميل السجلات..." : error || <>عرض <span className="font-semibold text-[#2E3A24]">{filtered.length}</span> من {logs.length} سجل</>}
      </p>
      <ExportCsvButton filenamePrefix="audit-logs-export" columns={exportColumns} rows={loading ? [] : filtered} className="flex items-center gap-2">
        تصدير السجل
      </ExportCsvButton>
    </div>

    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              {["رقم السجل", "الإجراء", "الوحدة", "منفذ بواسطة", "الصلاحية", "عنوان IP", "التاريخ", "الحالة"].map((header) => <th key={header} className="px-4 py-3 text-sm font-medium text-muted-foreground">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(loading ? [] : filtered).map((log) => <tr key={log.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-mono text-sm">{log.id}</td>
              <td className="px-4 py-3 font-medium text-foreground">{log.action}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-2 flex-row-reverse justify-end"><Shield className="w-4 h-4 text-muted-foreground" />{log.moduleLabel}</div></td>
              <td className="px-4 py-3 text-foreground">{log.performedBy}</td>
              <td className="px-4 py-3 text-muted-foreground">{log.role}</td>
              <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{log.ipAddress}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(log.timestamp)}</td>
              <td className="px-4 py-3"><Badge variant="success">نجاح</Badge></td>
            </tr>)}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[#5A6B50]">{error || "لا توجد سجلات بعد."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
};

export {
  AuditLogsAr
};
