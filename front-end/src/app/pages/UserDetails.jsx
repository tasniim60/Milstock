import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Edit, Mail, MapPin, Phone, Shield, User as UserIcon } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate } from "../lib/format";
import { getAssignedWarehouseName } from "../lib/warehouseDisplay";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: users, loading, error } = useApiResource(() => api.users.list(), []);
  const user = useMemo(() => users.find((entry) => entry._id === id), [id, users]);

  if (loading) {
    return <div className="p-6 lg:p-8"><Card><CardContent className="py-10 text-center text-muted-foreground">Loading user...</CardContent></Card></div>;
  }

  if (error || !user) {
    return <div className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm"><ArrowLeft className="w-4 h-4" />Back to Users</button>
      <Card><CardContent className="py-10 text-center text-muted-foreground">{error || "User not found."}</CardContent></Card>
    </div>;
  }

  const status = user.status || "active";

  return <div className="p-6 lg:p-8 space-y-6">
    <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm"><ArrowLeft className="w-4 h-4" />Back to Users</button>
    <PageHeader title={user.name || "User Details"} subtitle={user.email || "No email"} action={{ label: "Edit User", onClick: () => navigate(`/admin/users/${id}/edit`), icon: Edit }} />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#6A7B4D]/10 flex items-center justify-center"><UserIcon className="w-7 h-7 text-[#6A7B4D]" /></div>
          <p className="font-semibold text-foreground">{user.name || "Unknown user"}</p>
          <Badge variant={status === "active" ? "success" : "neutral"}>{status}</Badge>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>User Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              ["Name", user.name, UserIcon],
              ["Email", user.email, Mail],
              ["Employee Code", user.military_number, Shield],
              ["Phone", user.phone, Phone],
              ["Role", user.role === "admin" ? "Admin" : user.role === "supplier" ? "Supplier" : "Kitchen / Unit", Shield],
              ["Warehouse", getAssignedWarehouseName(user), MapPin],
              ["Created", formatDate(user.createdAt), UserIcon],
            ].map(([label, value, Icon]) => <div key={label} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-[#5A6B50] mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p className="font-medium text-foreground">{value || "N/A"}</p>
              </div>
            </div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>;
};

export {
  UserDetails
};
