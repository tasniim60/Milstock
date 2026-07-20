import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Edit, Plus, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate } from "../lib/format";
import { getStoredAuth } from "../lib/auth";
import { getLocalizedDisplayName, getLocalizedValue } from "../lib/localization";
import { MAX_DATE_INPUT, MIN_DATE_INPUT, isDateRangeValid, isValidDateInput } from "../lib/dateValidation";

const labelsEn = {
  title: "Consumption",
  subtitle: "Track stock used from warehouses",
  monitorTitle: "Consumption Monitor",
  monitorSubtitle: "Monitor consumption across all warehouses",
  new: "Record Consumption",
  search: "Search product, warehouse, or reason...",
  allStatus: "All Statuses",
  completed: "Completed",
  cancelled: "Cancelled",
  count: (shown, total) => `Showing ${shown} of ${total} consumption records`,
  loading: "Loading consumption records...",
  empty: "No consumption records found.",
  export: "Export Consumption",
  id: "Consumption ID",
  product: "Product",
  warehouse: "Warehouse",
  quantity: "Consumed Quantity",
  reason: "Reason",
  consumedBy: "Consumed By",
  date: "Date/Time",
  status: "Status",
  actions: "Actions",
  view: "View",
  edit: "Edit",
  totalToday: "Total Consumed Today",
  totalWeek: "Total Consumed This Week",
  totalMonth: "Total Consumed This Month",
  topWarehouse: "Top Consumed Warehouse",
  topProduct: "Top Consumed Product",
  consumedByFilter: "Consumed By",
  dateFrom: "Date From",
  dateTo: "Date To",
  allWarehouses: "All Warehouses",
  allProducts: "All Products",
  allUsers: "All Users",
  allReasons: "All Reasons",
  invalidDate: "Enter a valid date between 2000 and 2100",
  invalidDateRange: "Date From cannot be after Date To",
};

const labelsAr = {
  title: "الاستهلاك",
  subtitle: "متابعة الكميات المستهلكة من المخازن",
  monitorTitle: "متابعة الاستهلاك",
  monitorSubtitle: "متابعة الاستهلاك عبر كل المخازن",
  new: "تسجيل استهلاك",
  search: "ابحث بالمنتج أو المخزن أو السبب...",
  allStatus: "كل الحالات",
  completed: "مكتمل",
  cancelled: "ملغي",
  count: (shown, total) => `عرض ${shown} من ${total} سجل استهلاك`,
  loading: "جاري تحميل سجلات الاستهلاك...",
  empty: "لا توجد سجلات استهلاك.",
  export: "تصدير الاستهلاك",
  id: "رقم الاستهلاك",
  product: "المنتج",
  warehouse: "المخزن",
  quantity: "الكمية المستهلكة",
  reason: "السبب",
  consumedBy: "بواسطة",
  date: "التاريخ/الوقت",
  status: "الحالة",
  actions: "إجراءات",
  view: "عرض",
  edit: "تعديل",
  totalToday: "إجمالي المستهلك اليوم",
  totalWeek: "إجمالي المستهلك هذا الأسبوع",
  totalMonth: "إجمالي المستهلك هذا الشهر",
  topWarehouse: "أعلى مخزن استهلاكاً",
  topProduct: "أعلى منتج استهلاكاً",
  consumedByFilter: "تم بواسطة",
  dateFrom: "من تاريخ",
  dateTo: "إلى تاريخ",
  allWarehouses: "كل المخازن",
  allProducts: "كل المنتجات",
  allUsers: "كل المستخدمين",
  allReasons: "كل الأسباب",
  invalidDate: "أدخل تاريخًا صحيحًا بين سنة 2000 و2100",
  invalidDateRange: "تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية",
};

const getBasePath = (role, isArabic) => {
  const prefix = isArabic ? "/ar" : "";
  return role === "admin" ? `${prefix}/admin/consumptions` : `${prefix}/user/consumptions`;
};

const getId = (value) => value?._id || value || "";

const mapConsumption = (item, locale = "en") => ({
  raw: item,
  id: item._id,
  shortId: String(item._id || "").slice(-8).toUpperCase(),
  product: getLocalizedValue(item.product_id, "name", locale) || "Unknown product",
  warehouse: getLocalizedValue(item.warehouse_id, "name", locale) || "Unknown warehouse",
  quantity: `${item.consumed_quantity ?? item.quantity ?? 0} ${item.unit || item.product_id?.unit || ""}`.trim(),
  reason: item.reason || "N/A",
  consumedBy: getLocalizedDisplayName(item.consumed_by, locale) || getLocalizedDisplayName(item.user_id, locale) || (locale === "ar" ? "مستخدم غير معروف" : "Unknown user"),
  date: formatDate(item.consumption_date || item.createdAt),
  status: item.status || "completed",
  productId: getId(item.product_id),
  warehouseId: getId(item.warehouse_id),
});

const ConsumptionListView = ({ isArabic = false }) => {
  const labels = isArabic ? labelsAr : labelsEn;
  const locale = isArabic ? "ar" : "en";
  const navigate = useNavigate();
  const { role } = getStoredAuth();
  const isAdmin = role === "admin";
  const basePath = getBasePath(role, isArabic);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [message, setMessage] = useState("");
  const datesHaveValidValues = isValidDateInput(dateFrom) && isValidDateInput(dateTo);
  const datesAreValid = datesHaveValidValues && isDateRangeValid(dateFrom, dateTo);
  const { data, loading, error, refresh } = useApiResource(() => api.consumptions.list({
    warehouse_id: isAdmin ? warehouseFilter : "",
    product_id: isAdmin ? productFilter : "",
    consumed_by: isAdmin ? userFilter : "",
    reason: isAdmin ? reasonFilter : "",
    dateFrom: isAdmin && datesAreValid ? dateFrom : "",
    dateTo: isAdmin && datesAreValid ? dateTo : "",
    status: statusFilter === "all" ? "" : statusFilter,
  }), [isAdmin, warehouseFilter, productFilter, userFilter, reasonFilter, dateFrom, dateTo, datesAreValid, statusFilter]);
  const { data: warehouses } = useApiResource(() => isAdmin ? api.warehouses.list() : Promise.resolve([]), [isAdmin]);
  const { data: products } = useApiResource(() => isAdmin ? api.products.list() : Promise.resolve([]), [isAdmin]);
  const { data: users } = useApiResource(() => isAdmin ? api.users.list() : Promise.resolve([]), [isAdmin]);

  const rows = useMemo(() => data.map((item) => mapConsumption(item, locale)), [data, locale]);
  const filteredRows = rows.filter((row) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = [row.shortId, row.product, row.warehouse, row.reason, row.consumedBy]
      .some((value) => String(value || "").toLowerCase().includes(search));
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeRows = rows.filter((row) => row.status !== "cancelled");
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const quantityOf = (row) => Number(row.raw?.consumed_quantity || row.raw?.quantity || 0);
  const sumSince = (date) => activeRows
    .filter((row) => new Date(row.raw?.consumption_date || row.raw?.createdAt) >= date)
    .reduce((sum, row) => sum + quantityOf(row), 0);
  const topBy = (key) => {
    const totals = activeRows.reduce((acc, row) => {
      const name = row[key] || "N/A";
      acc[name] = (acc[name] || 0) + quantityOf(row);
      return acc;
    }, {});
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  };
  const reasonOptions = Array.from(new Set(rows.map((row) => row.reason).filter(Boolean)));
  const dateRangeError = datesAreValid ? "" : datesHaveValidValues ? labels.invalidDateRange : labels.invalidDate;

  const columns = [
    { key: "shortId", header: labels.id },
    { key: "product", header: labels.product },
    { key: "warehouse", header: labels.warehouse },
    { key: "quantity", header: labels.quantity },
    { key: "reason", header: labels.reason },
    { key: "consumedBy", header: labels.consumedBy },
    { key: "date", header: labels.date },
    {
      key: "status",
      header: labels.status,
      render: (row) => <Badge variant={row.status === "cancelled" ? "warning" : "success"}>
        {row.status === "cancelled" ? labels.cancelled : labels.completed}
      </Badge>
    },
    {
      key: "actions",
      header: labels.actions,
      render: (row) => <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={(event) => {
          event.stopPropagation();
          navigate(`${basePath}/${row.id}`);
        }}>{labels.view}</Button>
        {row.status !== "cancelled" && <Button type="button" variant="outline" size="sm" onClick={(event) => {
          event.stopPropagation();
          navigate(`${basePath}/${row.id}/edit`);
        }}>
          <Edit className="w-4 h-4" />
          {labels.edit}
        </Button>}
      </div>
    }
  ];

  const exportColumns = columns.filter((column) => column.key !== "actions").map((column) => ({ key: column.key, header: column.header }));

  return <div className={`p-6 lg:p-8 space-y-6 ${isArabic ? "rtl text-right" : ""}`} dir={isArabic ? "rtl" : "ltr"}>
    <PageHeader
      title={isAdmin ? labels.monitorTitle : labels.title}
      subtitle={isAdmin ? labels.monitorSubtitle : labels.subtitle}
      action={!isAdmin ? { label: labels.new, icon: Plus, onClick: () => navigate(`${basePath}/new`) } : null}
    />
    {message && <div className="rounded-xl border border-[#4E4631]/10 bg-white px-4 py-3 text-sm text-[#2E3A24]">{message}</div>}
    {isAdmin && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {[
        [labels.totalToday, sumSince(startOfToday).toLocaleString()],
        [labels.totalWeek, sumSince(startOfWeek).toLocaleString()],
        [labels.totalMonth, sumSince(startOfMonth).toLocaleString()],
        [labels.topWarehouse, topBy("warehouse")],
        [labels.topProduct, topBy("product")],
      ].map(([title, value]) => <div key={title} className="rounded-2xl border border-[#4E4631]/10 bg-white p-4 shadow-sm">
        <p className="text-xs text-[#5A6B50]">{title}</p>
        <p className="mt-2 text-xl font-semibold text-[#2E3A24]">{value}</p>
      </div>)}
    </div>}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-2 relative">
        <Search className={`absolute ${isArabic ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A6B50]`} />
        <Input
          placeholder={labels.search}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={isArabic ? "pr-12" : "pl-12"}
        />
      </div>
      <Select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        options={[
          { value: "all", label: labels.allStatus },
          { value: "completed", label: labels.completed },
          { value: "cancelled", label: labels.cancelled },
        ]}
      />
      <ExportCsvButton filenamePrefix="consumption-export" columns={exportColumns} rows={filteredRows}>
        {labels.export}
      </ExportCsvButton>
    </div>
    {isAdmin && <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <Select label={labels.warehouse} value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)} options={[
        { value: "", label: labels.allWarehouses },
        ...warehouses.map((warehouse) => ({ value: warehouse._id, label: getLocalizedValue(warehouse, "name", locale) })),
      ]} />
      <Select label={labels.product} value={productFilter} onChange={(event) => setProductFilter(event.target.value)} options={[
        { value: "", label: labels.allProducts },
        ...products.map((product) => ({ value: product._id, label: getLocalizedValue(product, "name", locale) })),
      ]} />
      <Select label={labels.consumedByFilter} value={userFilter} onChange={(event) => setUserFilter(event.target.value)} options={[
        { value: "", label: labels.allUsers },
        ...users.map((user) => ({ value: user._id, label: user.name })),
      ]} />
      <Select label={labels.reason} value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)} options={[
        { value: "", label: labels.allReasons },
        ...reasonOptions.map((reason) => ({ value: reason, label: reason })),
      ]} />
      <Input label={labels.dateFrom} type="date" min={MIN_DATE_INPUT} max={MAX_DATE_INPUT} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
      <Input label={labels.dateTo} type="date" min={MIN_DATE_INPUT} max={MAX_DATE_INPUT} value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
    </div>}
    {dateRangeError && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{dateRangeError}</div>}
    <p className="text-sm text-[#5A6B50]">{loading ? labels.loading : error || labels.count(filteredRows.length, rows.length)}</p>
    <Table
      columns={columns}
      data={loading ? [] : filteredRows}
      emptyMessage={error || labels.empty}
      onRowClick={(row) => navigate(`${basePath}/${row.id}`)}
    />
  </div>;
};

const ConsumptionList = () => <ConsumptionListView />;

export {
  ConsumptionList,
  ConsumptionListView
};
