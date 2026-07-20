import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Plus, Search, Trash2 } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Badge } from "../../components/Badge";
import { Table } from "../../components/Table";
import { ExportCsvButton } from "../../components/ExportCsvButton";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatDate, getProductStatus, uniqueOptions } from "../../lib/format";
import { getLocalizedValue } from "../../lib/localization";
import { isValidDateValue } from "../../lib/dateValidation";
import { getStoredAuth } from "../../lib/auth";

const unitLabelsAr = {
  kg: "كجم",
  kilogram: "كجم",
  kilograms: "كجم",
  g: "جم",
  gram: "جم",
  grams: "جم",
  liter: "لتر",
  liters: "لتر",
  litre: "لتر",
  litres: "لتر",
  Tons: "طن",
  ton: "طن",
  tons: "طن",
  piece: "قطعة",
  pieces: "قطعة",
  pcs: "قطعة",
  unit: "وحدة",
  units: "وحدة",
  box: "صندوق",
  boxes: "صندوق",
  bottle: "زجاجة",
  bottles: "زجاجة"
};

const formatQuantityAr = (quantity, unit) => {
  const normalizedUnit = String(unit || "").trim();
  const unitLabel = unitLabelsAr[normalizedUnit] || unitLabelsAr[normalizedUnit.toLowerCase()] || normalizedUnit;
  return `${Number(quantity || 0).toLocaleString("ar-EG")} ${unitLabel}`.trim();
};

const statusLabels = {
  "in-stock": "متوفر",
  critical: "حرج",
  "low-stock": "مخزون منخفض",
  "out-of-stock": "نفد المخزون",
  "expiring-soon": "ينتهي قريباً"
};

const variantMap = {
  "in-stock": "success",
  critical: "danger",
  "low-stock": "warning",
  "out-of-stock": "danger",
  "expiring-soon": "warning"
};

const InventoryListAr = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = getStoredAuth();
  const isAdmin = role === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: products, loading, error } = useApiResource(() => api.products.list(), []);
  const query = new URLSearchParams(location.search);
  const urlFilter = query.get("filter");
  const warehouseFilter = query.get("warehouse_id");
  const itemFilter = query.get("item_id");

  useEffect(() => {
    const urlStatus = new URLSearchParams(location.search).get("status");
    const normalizedStatus = urlStatus === "low_stock" ? "low-stock" : urlStatus;
    if (normalizedStatus) {
      setStatusFilter(normalizedStatus);
    } else if (new URLSearchParams(location.search).get("filter") === "expiring") {
      setStatusFilter("all");
    }
  }, [location.search]);

  const isExpiringWithin30Days = (value) => {
    if (!value || !isValidDateValue(value)) return false;
    const days = (new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };

  const inventoryData = products.map((product) => {
    const status = getProductStatus(product);
    return {
      id: product._id.slice(-8).toUpperCase(),
      mongoId: product._id,
      name: getLocalizedValue(product, "name", "ar"),
      category: getLocalizedValue(product, "category", "ar"),
      quantity: product.quantity,
      unit: product.unit,
      expirationRaw: product.expiration_date || product.expiry_date,
      expirationDate: formatDate(product.expiration_date || product.expiry_date, "ar-EG"),
      warehouse: getLocalizedValue(product.warehouse_id, "name", "ar") || "غير محدد",
      warehouseId: product.warehouse_id?._id || product.warehouse_id || "",
      storageSection: product.storage_section || "غير محدد",
      status
    };
  });

  const filteredData = inventoryData.filter((item) => {
    const search = String(searchTerm ?? "").toLowerCase();
    const matchesSearch = String(item.name ?? "").toLowerCase().includes(search) || String(item.id ?? "").toLowerCase().includes(search);
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesUrlFilter = urlFilter !== "expiring" || isExpiringWithin30Days(item.expirationRaw);
    const matchesWarehouse = !warehouseFilter || String(item.warehouseId) === String(warehouseFilter);
    const matchesItem = !itemFilter || String(item.mongoId) === String(itemFilter);
    return matchesSearch && matchesCategory && matchesStatus && matchesUrlFilter && matchesWarehouse && matchesItem;
  });

  const columns = [
    { key: "id", header: "رمز الصنف" },
    { key: "name", header: "اسم الصنف" },
    { key: "category", header: "الفئة" },
    { key: "quantity", header: "الكمية", render: (row) => formatQuantityAr(row.quantity, row.unit) },
    { key: "expirationDate", header: "تاريخ الصلاحية" },
    {
      key: "warehouse",
      header: "المستودع",
      render: (row) => <div className="text-start">
        <p className="font-medium text-foreground">{row.warehouse}</p>
        <p className="text-xs text-muted-foreground">{row.storageSection}</p>
      </div>
    },
    {
      key: "status",
      header: "الحالة",
      render: (row) => <Badge variant={variantMap[row.status]}>{statusLabels[row.status]}</Badge>
    },
    isAdmin && {
      key: "actions",
      header: "حذف",
      render: (row) => <button
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#D4183D] rounded-lg hover:bg-[#b81434] transition-colors"
        onClick={async (event) => {
          event.stopPropagation();
          if (!window.confirm(`Delete ${row.name}?`)) return;
          await api.products.remove(row.mongoId);
          window.location.reload();
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        حذف
      </button>
    }
  ].filter(Boolean);
  const exportColumns = [
    { key: "id", header: "\u0631\u0645\u0632 \u0627\u0644\u0635\u0646\u0641" },
    { key: "name", header: "\u0627\u0633\u0645 \u0627\u0644\u0635\u0646\u0641" },
    { key: "category", header: "\u0627\u0644\u0641\u0626\u0629" },
    { header: "\u0627\u0644\u0643\u0645\u064a\u0629", value: (row) => formatQuantityAr(row.quantity, row.unit) },
    { key: "expirationDate", header: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629" },
    { key: "warehouse", header: "\u0627\u0644\u0645\u0633\u062a\u0648\u062f\u0639" },
    { key: "storageSection", header: "\u0642\u0633\u0645 \u0627\u0644\u062a\u062e\u0632\u064a\u0646" },
    { header: "\u0627\u0644\u062d\u0627\u0644\u0629", value: (row) => statusLabels[row.status] || row.status }
  ];

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <PageHeaderAr
      title="إدارة المخزون"
      subtitle="نفس البيانات المستخدمة في الواجهة الإنجليزية"
      action={isAdmin ? {
        label: "إضافة صنف جديد",
        onClick: () => navigate("/ar/admin/inventory/add"),
        icon: Plus
      } : null}
    />

    <div className="bg-white rounded-2xl border border-[#4E4631]/10 p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B50]" />
          <Input
            placeholder="ابحث باسم الصنف أو الرمز..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pr-10 text-right"
          />
        </div>
        <Select
          options={uniqueOptions(products.map((product) => getLocalizedValue(product, "category", "ar")), "جميع الفئات")}
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          disabled={loading}
        />
        <Select
          options={[
            { value: "all", label: "جميع الحالات" },
            { value: "in-stock", label: "متوفر" },
            { value: "critical", label: "حرج" },
            { value: "low-stock", label: "مخزون منخفض" },
            { value: "expiring-soon", label: "ينتهي قريباً" },
            { value: "out-of-stock", label: "نفد المخزون" }
          ]}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </div>
    </div>

    <div className="flex justify-start">
      <ExportCsvButton filenamePrefix="inventory-export" columns={exportColumns} rows={loading ? [] : filteredData}>
        {"\u062a\u0635\u062f\u064a\u0631"}
      </ExportCsvButton>
    </div>

    <p className="text-sm text-[#5A6B50] text-start">
      {loading ? "جاري تحميل بيانات المخزون..." : error || `عرض ${filteredData.length} من ${inventoryData.length} صنف`}
    </p>

    <Table
      columns={columns}
      data={loading ? [] : filteredData}
      emptyMessage={error || "لا توجد منتجات. أضف أصنافًا أو شغّل seed."}
      onRowClick={isAdmin ? (row) => navigate(`/ar/admin/inventory/${row.mongoId}`) : undefined}
      className="text-start"
    />
  </div>;
};

export {
  InventoryListAr
};
