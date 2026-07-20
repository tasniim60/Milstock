import { StatCardAr } from "../../components/ar/StatCardAr";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { FileText, Clock, CheckCircle, ArrowRight, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getStoredAssignedWarehouse } from "../../lib/warehouseDisplay";
import { getLocalizedValue, localizeText } from "../../lib/localization";

const myRequests = [
  { id: "REQ-1230", item: "أرز", quantity: 100, status: "approved", requestedDate: "2026-05-01", deliveryDate: "2026-05-05" },
  { id: "REQ-1228", item: "قوارير مياه", quantity: 200, status: "pending", requestedDate: "2026-04-30", deliveryDate: "قيد التحديد" },
  { id: "REQ-1225", item: "جبن", quantity: 50, status: "delivered", requestedDate: "2026-04-25", deliveryDate: "2026-04-28" },
];

const notifications = [
  { message: "تمت الموافقة على طلبك REQ-1230", type: "success", time: "منذ ساعتين" },
  { message: "إمدادات جديدة متوفرة: منتجات ألبان", type: "info", time: "منذ 5 ساعات" },
  { message: "طلب REQ-1228 قيد المراجعة", type: "pending", time: "منذ يوم" },
];

const stockData = [
  { day: "السبت", level: 88 },
  { day: "الأحد", level: 85 },
  { day: "الاثنين", level: 82 },
  { day: "الثلاثاء", level: 79 },
  { day: "الأربعاء", level: 83 },
  { day: "الخميس", level: 80 },
  { day: "الجمعة", level: 77 },
];

const availableStock = [
  { category: "غذاء وحصص", items: 45, status: "In Stock" },
  { category: "أغذية ألبان", items: 23, status: "Low Stock" },
  { category: "مياه ومشروبات", items: 67, status: "In Stock" },
  { category: "مخبوزات", items: 34, status: "In Stock" },
];

const statusLabels = {
  pending: "قيد المراجعة",
  approved: "موافق عليه",
  delivered: "تم التسليم",
};

const statusVariant = {
  pending: "pending",
  approved: "success",
  delivered: "info",
};

const UserDashboardAr = () => {
  const navigate = useNavigate();
  const assignedWarehouse = getStoredAssignedWarehouse();

  if (!assignedWarehouse.id) {
    return (
      <div dir="rtl" className="p-6 lg:p-8">
        <Card>
          <CardContent className="py-10 text-center text-[#D4183D]">
            لم يتم تعيين مخزن لهذا المستخدم. يرجى التواصل مع المسؤول.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm font-medium text-[#2E3A24] text-right">
          المخزن: {getLocalizedValue(assignedWarehouse, "name", "ar") || localizeText(assignedWarehouse.name, "ar") || "غير محدد"}
        </p>
        <Button onClick={() => navigate("/ar/user/requests/create")} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إنشاء طلب جديد
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        <StatCardAr title="الطلبات النشطة" value="2" icon={FileText} trend={{ value: "موافقة على 1 اليوم", isPositive: true }} color="primary" />
        <StatCardAr title="بانتظار الموافقة" value="1" icon={Clock} trend={{ value: "وقت المعالجة ~18 ساعة", isPositive: true }} color="warning" />
        <StatCardAr title="مكتملة هذا الشهر" value="8" icon={CheckCircle} trend={{ value: "+3 مقارنة بالشهر الماضي", isPositive: true }} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader className="text-right">
            <span className="text-xs text-muted-foreground">% من الطاقة الاستيعابية</span>
            <CardTitle>مستوى المخزون - هذا الأسبوع</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stockData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4E4631" opacity={0.07} />
                <XAxis dataKey="day" stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} />
                <YAxis stroke="#5A6B50" tick={{ fontSize: 11, fill: "#5A6B50" }} axisLine={false} tickLine={false} domain={[60, 100]} width={35} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid rgba(78,70,49,0.15)", borderRadius: 10, fontSize: 12 }}
                  formatter={(value) => [`${value}%`, "مستوى المخزون"]}
                />
                <Line type="monotone" dataKey="level" stroke="#6A7B4D" strokeWidth={2.5} dot={{ fill: "#6A7B4D", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-right">الإشعارات</CardTitle>
            <Link to="/ar/user/notifications">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                الكل
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                    notification.type === "success"
                      ? "bg-[#5B8A4A]/5 border-[#5B8A4A]/15"
                      : notification.type === "pending"
                        ? "bg-[#B8862A]/5 border-[#B8862A]/15"
                        : "bg-[#6A7B4D]/5 border-[#6A7B4D]/15"
                  }`}
                >
                  <div className={`w-1.5 flex-shrink-0 rounded-full self-stretch mt-0.5 ${
                    notification.type === "success" ? "bg-[#5B8A4A]" : notification.type === "pending" ? "bg-[#B8862A]" : "bg-[#6A7B4D]"
                  }`} />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm text-[#2E3A24] mb-0.5">{notification.message}</p>
                    <p className="text-xs text-[#5A6B50]">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-right">طلباتي الأخيرة</CardTitle>
            <Link to="/ar/user/requests">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                عرض الكل
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myRequests.map((request) => (
                <Link
                  key={request.id}
                  to={`/ar/user/requests/${request.id}`}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#ECEEE2]/60 hover:bg-[#ECEEE2] border border-transparent hover:border-[#4E4631]/10 transition-all group text-right"
                >
                  <div className="text-right min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#2E3A24] mb-1">{request.id}</p>
                    <p className="text-sm text-[#2E3A24] mb-1">
                      {request.item} <span className="text-[#5A6B50]">× {request.quantity}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5A6B50] justify-start">
                      <span>التسليم: {request.deliveryDate}</span>
                      <span>تاريخ الطلب: {request.requestedDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-[#5A6B50] opacity-0 group-hover:opacity-100 transition-opacity rotate-180" />
                    <Badge variant={statusVariant[request.status]}>{statusLabels[request.status]}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">المخزون المتاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableStock.length === 0 && <p className="text-sm text-[#5A6B50] text-right">لا توجد أصناف متاحة.</p>}
              {availableStock.map((stock) => (
                <div key={stock.category} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#ECEEE2]/60 border border-[#4E4631]/8 text-right">
                  <div className="text-right min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2E3A24] truncate">{stock.category}</p>
                    <p className="text-xs text-[#5A6B50] mt-0.5">{stock.items} صنف</p>
                  </div>
                  <Badge variant={stock.status === "Low Stock" ? "warning" : "success"} size="sm" className="shrink-0">
                    {stock.status === "Low Stock" ? "مخزون منخفض" : "متوفر"}
                  </Badge>
                </div>
              ))}
              <Link to="/ar/user/inventory" className="block mt-2">
                <Button variant="outline" size="sm" className="w-full">
                  تصفح المخزون
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { UserDashboardAr };
