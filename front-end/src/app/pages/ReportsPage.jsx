import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { ExportCsvButton } from "../components/ExportCsvButton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";
import { TrendingUp, TrendingDown, Package, AlertCircle } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
const COLORS = ["#4B5B3A", "#6A7B4D", "#8A9B6D", "#C9A961"];
const wasteData = [
  { month: "Dec", expired: 45, damaged: 12 },
  { month: "Jan", expired: 38, damaged: 8 },
  { month: "Feb", expired: 52, damaged: 15 },
  { month: "Mar", expired: 41, damaged: 9 },
  { month: "Apr", expired: 36, damaged: 11 },
  { month: "May", expired: 29, damaged: 7 }
];
const wasteExportColumns = [
  { key: "month", header: "Month" },
  { key: "expired", header: "Expired Items" },
  { key: "damaged", header: "Damaged Items" }
];
const reportLabels = {
  en: {
    title: "Reports & Analytics",
    subtitle: "Insights and trends for inventory management",
    exportConsumption: "Export Consumption",
    exportWaste: "Export Waste",
    avgMonthly: "Avg Monthly Consumption",
    records: (count) => `${count} records`,
    wasteReduction: "Waste Reduction",
    sinceLastMonth: "Since last month",
    supplyEfficiency: "Supply Efficiency",
    improvement: "+2.1% improvement",
    criticalShortages: "Critical Shortages",
    fromLastWeek: "-2 from last week",
    consumptionTrends: "Consumption Trends by Category",
    lastSixMonths: "Last 6 months",
    wasteAnalysis: "Waste Analysis",
    wasteSubtitle: "Expired vs Damaged",
    expiredItems: "Expired Items",
    damagedItems: "Damaged Items",
    insights: "Key Insights & Recommendations",
    efficiencyTitle: "Improved Efficiency",
    efficiencyBody: "Supply efficiency has improved by 2.1% this month due to better expiration monitoring and reduced waste.",
    seasonalTitle: "Seasonal Trends",
    seasonalBody: "Food consumption peaks in March and May, suggesting seasonal operational patterns that require planning.",
    wasteTitle: "Waste Reduction",
    wasteBody: "Expired items decreased by 24% compared to February, showing effectiveness of the new alert system.",
    monthLocale: "en",
    uncategorized: "Uncategorized",
  },
  ar: {
    title: "التقارير والتحليلات",
    subtitle: "رؤى واتجاهات لإدارة المخزون",
    exportConsumption: "تصدير الاستهلاك",
    exportWaste: "تصدير الهدر",
    avgMonthly: "متوسط الاستهلاك الشهري",
    records: (count) => `${count} سجل`,
    wasteReduction: "تقليل الهدر",
    sinceLastMonth: "منذ الشهر الماضي",
    supplyEfficiency: "كفاءة الإمداد",
    improvement: "+2.1% تحسن",
    criticalShortages: "نواقص حرجة",
    fromLastWeek: "-2 عن الأسبوع الماضي",
    consumptionTrends: "اتجاهات الاستهلاك حسب الفئة",
    lastSixMonths: "آخر 6 أشهر",
    wasteAnalysis: "تحليل الهدر",
    wasteSubtitle: "منتهي الصلاحية مقابل التالف",
    expiredItems: "أصناف منتهية الصلاحية",
    damagedItems: "أصناف تالفة",
    insights: "رؤى وتوصيات رئيسية",
    efficiencyTitle: "تحسن الكفاءة",
    efficiencyBody: "تحسنت كفاءة الإمداد بنسبة 2.1% هذا الشهر بفضل متابعة الصلاحية وتقليل الهدر.",
    seasonalTitle: "اتجاهات موسمية",
    seasonalBody: "يرتفع استهلاك الأغذية في مارس ومايو، مما يشير إلى أنماط تشغيل موسمية تحتاج إلى تخطيط.",
    wasteTitle: "تقليل الهدر",
    wasteBody: "انخفضت الأصناف منتهية الصلاحية بنسبة 24% مقارنة بفبراير، مما يوضح فعالية نظام التنبيهات الجديد.",
    monthLocale: "ar-EG",
    uncategorized: "غير مصنف",
  },
};
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return <div className="bg-white border border-[#4E4631]/15 rounded-xl p-3 shadow-md text-xs">
        <p className="font-semibold text-[#2E3A24] mb-1.5">{label}</p>
        {payload.map((p) => <p key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}: <span className="font-medium">{p.value}</span>
          </p>)}
      </div>;
  }
  return null;
};
const ReportsPageView = ({ isArabic = false }) => {
  const labels = reportLabels[isArabic ? "ar" : "en"];
  const { data: consumptions } = useApiResource(() => api.consumptions.list(), []);
  const activeConsumptions = consumptions.filter((item) => item.status !== "cancelled");
  const categoryNames = Array.from(new Set(activeConsumptions.map((item) => item.product_id?.category || labels.uncategorized))).slice(0, 4);
  const chartKeys = categoryNames.map((name, index) => ({ key: `category${index}`, name, color: COLORS[index % COLORS.length] }));
  const groupedConsumption = activeConsumptions.reduce((totals, item) => {
    const date = new Date(item.consumption_date || item.createdAt);
    const month = Number.isNaN(date.getTime()) ? labels.uncategorized : date.toLocaleDateString(labels.monthLocale, { month: "short" });
    const category = item.product_id?.category || labels.uncategorized;
    const categoryIndex = categoryNames.indexOf(category);
    if (!totals[month]) totals[month] = { month };
    if (categoryIndex >= 0) {
      const key = `category${categoryIndex}`;
      totals[month][key] = Number(totals[month][key] || 0) + Number(item.consumed_quantity || item.quantity || 0);
    }
    return totals;
  }, {});
  const consumptionData = Object.values(groupedConsumption).slice(-6);
  const totalConsumption = activeConsumptions.reduce((sum, item) => sum + Number(item.consumed_quantity || item.quantity || 0), 0);
  const avgMonthlyConsumption = consumptionData.length ? Math.round(totalConsumption / consumptionData.length) : 0;
  const consumptionExportColumns = [
    { key: "month", header: "Month" },
    ...chartKeys.map((item) => ({ key: item.key, header: item.name })),
  ];
  return <div className="p-6 lg:p-8 space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      <PageHeader
    title={labels.title}
    subtitle={labels.subtitle}
  />

      {
    /* Export actions */
  }
      <div className="flex items-center gap-3 -mt-4">
        <ExportCsvButton filenamePrefix="reports-consumption-export" columns={consumptionExportColumns} rows={consumptionData} className="flex items-center gap-1.5">
          {labels.exportConsumption}
        </ExportCsvButton>
        <ExportCsvButton filenamePrefix="reports-waste-export" columns={wasteExportColumns} rows={wasteData} className="flex items-center gap-1.5">
          {labels.exportWaste}
        </ExportCsvButton>
      </div>

      {
    /* KPI Stats */
  }
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <StatCard title={labels.avgMonthly} value={avgMonthlyConsumption.toLocaleString()} icon={Package} trend={{ value: labels.records(activeConsumptions.length), isPositive: true }} color="primary" />
        <StatCard title={labels.wasteReduction} value="15%" icon={TrendingDown} trend={{ value: labels.sinceLastMonth, isPositive: true }} color="success" />
        <StatCard title={labels.supplyEfficiency} value="94.2%" icon={TrendingUp} trend={{ value: labels.improvement, isPositive: true }} color="primary" />
        <StatCard title={labels.criticalShortages} value="3" icon={AlertCircle} trend={{ value: labels.fromLastWeek, isPositive: true }} color="warning" />
      </div>

      {
    /* Charts */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>{labels.consumptionTrends}</CardTitle>
            <span className="text-xs text-muted-foreground">{labels.lastSixMonths}</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={consumptionData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }} barSize={8} barGap={2}>
                <CartesianGrid key="rpt-bc-grid" strokeDasharray="3 3" stroke="#4E4631" opacity={0.07} vertical={false} />
                <XAxis key="rpt-bc-xaxis" dataKey="month" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} />
                <YAxis key="rpt-bc-yaxis" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip key="rpt-bc-tooltip" content={<CustomTooltip />} />
                <Legend key="rpt-bc-legend" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#5A6B50" }} />
                {chartKeys.map((item) => <Bar key={`rpt-bc-${item.key}`} dataKey={item.key} fill={item.color} name={item.name} radius={[3, 3, 0, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{labels.wasteAnalysis}</CardTitle>
            <span className="text-xs text-muted-foreground">{labels.wasteSubtitle}</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={wasteData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid key="rpt-lc-grid" strokeDasharray="3 3" stroke="#4E4631" opacity={0.07} />
                <XAxis key="rpt-lc-xaxis" dataKey="month" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} />
                <YAxis key="rpt-lc-yaxis" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip key="rpt-lc-tooltip" content={<CustomTooltip />} />
                <Legend key="rpt-lc-legend" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#5A6B50" }} />
                <Line key="rpt-lc-expired" type="monotone" dataKey="expired" stroke="#D4183D" strokeWidth={2.5} name={labels.expiredItems} dot={false} activeDot={{ r: 4 }} />
                <Line key="rpt-lc-damaged" type="monotone" dataKey="damaged" stroke="#C9A961" strokeWidth={2.5} name={labels.damagedItems} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {
    /* Key Insights */
  }
      <Card>
        <CardHeader>
          <CardTitle>{labels.insights}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-[#5B8A4A]/8 rounded-xl border border-[#5B8A4A]/15">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#5B8A4A]/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#5B8A4A]" />
                </div>
                <h4 className="font-semibold text-[#2E3A24]">{labels.efficiencyTitle}</h4>
              </div>
              <p className="text-sm text-[#5A6B50] leading-relaxed">
                {labels.efficiencyBody}
              </p>
            </div>
            <div className="p-5 bg-[#B8862A]/8 rounded-xl border border-[#B8862A]/15">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#B8862A]/15 flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#B8862A]" />
                </div>
                <h4 className="font-semibold text-[#2E3A24]">{labels.seasonalTitle}</h4>
              </div>
              <p className="text-sm text-[#5A6B50] leading-relaxed">
                {labels.seasonalBody}
              </p>
            </div>
            <div className="p-5 bg-[#4B5B3A]/8 rounded-xl border border-[#4B5B3A]/15">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#4B5B3A]/15 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-[#4B5B3A]" />
                </div>
                <h4 className="font-semibold text-[#2E3A24]">{labels.wasteTitle}</h4>
              </div>
              <p className="text-sm text-[#5A6B50] leading-relaxed">
                {labels.wasteBody}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
const ReportsPage = () => <ReportsPageView />;
export {
  ReportsPage,
  ReportsPageView
};
