import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, Edit, Mail, MapPin, Phone, Shield, User as UserIcon } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatDate } from "../../lib/format";
import { getAssignedWarehouseName } from "../../lib/warehouseDisplay";
import { getLocalizedDisplayName, getLocalizedRoleLabel } from "../../lib/localization";

const UserDetailsAr = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: users, loading, error } = useApiResource(() => api.users.list(), []);
  const user = useMemo(() => users.find((entry) => entry._id === id), [id, users]);

  if (loading) return <div dir="rtl" className="p-6 lg:p-8"><Card><CardContent className="py-10 text-center text-muted-foreground">جار تحميل المستخدم...</CardContent></Card></div>;

  if (error || !user) {
    return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate("/ar/admin/users")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm"><ArrowRight className="w-4 h-4" />العودة إلى المستخدمين</button>
      <Card><CardContent className="py-10 text-center text-muted-foreground">{error || "المستخدم غير موجود."}</CardContent></Card>
    </div>;
  }

  const status = user.status || "active";
  const displayName = getLocalizedDisplayName(user, "ar") || "مستخدم غير محدد";

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <button onClick={() => navigate("/ar/admin/users")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm"><ArrowRight className="w-4 h-4" />العودة إلى المستخدمين</button>
    <PageHeaderAr title={displayName} subtitle={user.email || "لا يوجد بريد"} action={{ label: "تعديل المستخدم", onClick: () => navigate(`/ar/admin/users/${id}/edit`), icon: Edit }} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card><CardContent className="pt-6 text-center space-y-3"><div className="mx-auto w-14 h-14 rounded-2xl bg-[#6A7B4D]/10 flex items-center justify-center"><UserIcon className="w-7 h-7 text-[#6A7B4D]" /></div><p className="font-semibold text-foreground">{displayName}</p><Badge variant={status === "active" ? "success" : "neutral"}>{status === "active" ? "نشط" : "غير نشط"}</Badge></CardContent></Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-right">معلومات المستخدم</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
            {[
              ["الاسم", displayName, UserIcon],
              ["البريد الإلكتروني", user.email, Mail],
              ["كود الموظف", user.military_number, Shield],
              ["الهاتف", user.phone, Phone],
              ["الدور", getLocalizedRoleLabel(user.role, "ar"), Shield],
              ["تاريخ الإنشاء", formatDate(user.createdAt), UserIcon],
              ["المخزن المسؤول عنه", getAssignedWarehouseName(user, "كل المخازن", "غير محدد"), MapPin],
            ].map(([label, value, Icon]) => <div key={label} className="flex items-start gap-3 flex-row-reverse"><Icon className="w-4 h-4 text-[#5A6B50] mt-0.5" /><div><p className="text-sm text-muted-foreground mb-1">{label}</p><p className="font-medium text-foreground">{value || "غير محدد"}</p></div></div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>;
};

export {
  UserDetailsAr
};
