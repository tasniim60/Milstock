import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { getWarehouseId } from "../lib/warehouseDisplay";
import { getLocalizedValue } from "../lib/localization";

const initialForm = {
  name: "",
  email: "",
  military_number: "",
  phone: "",
  role: "unit",
  status: "active",
  assigned_warehouse: ""
};

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: users, loading, error } = useApiResource(() => api.users.list(), []);
  const { data: warehouses, loading: warehousesLoading, error: warehousesError } = useApiResource(() => api.warehouses.list(), []);
  const user = useMemo(() => users.find((entry) => entry._id === id), [id, users]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      military_number: user.military_number || "",
      phone: user.phone || "",
      role: user.role || "unit",
      status: user.status || "active",
      assigned_warehouse: getWarehouseId(user.assigned_warehouse)
    });
  }, [user]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = { ...form, assigned_warehouse: form.assigned_warehouse || null };
      if (payload.role === "unit" && !payload.assigned_warehouse) {
        setMessageType("error");
        setMessage("Assigned Warehouse is required for Kitchen / Unit users.");
        setSaving(false);
        return;
      }
      await api.users.update(id, payload);
      setMessageType("success");
      setMessage("User updated successfully.");
      window.setTimeout(() => navigate("/admin/users", { state: { message: "User updated successfully." } }), 700);
    } catch (requestError) {
      setMessageType("error");
      setMessage(requestError.message || "Unable to update user.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 lg:p-8"><Card><CardContent className="py-10 text-center text-muted-foreground">Loading user...</CardContent></Card></div>;
  }

  if (error || !user) {
    return <div className="p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm"><ArrowLeft className="w-4 h-4" />Back to Users</button>
      <Card><CardContent className="py-10 text-center text-muted-foreground">{error || "User not found."}</CardContent></Card>
    </div>;
  }

  return <div className="p-6 lg:p-8 space-y-6">
    <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] text-sm"><ArrowLeft className="w-4 h-4" />Back to Users</button>
    <PageHeader title="Edit User" subtitle={user.email || id} />
    <Card className="max-w-3xl">
      <CardHeader><CardTitle>User Information</CardTitle></CardHeader>
      <CardContent>
        {message && <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${messageType === "success" ? "border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 text-[#3d6b2e]" : "border border-[#D4183D]/20 bg-[#D4183D]/10 text-[#D4183D]"}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required minLength={3} />
            <Input label="Email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            <Input label="Employee Code" value={form.military_number} onChange={(event) => updateField("military_number", event.target.value)} required />
            <Input label="Phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} required />
            <Select label="Role" value={form.role} onChange={(event) => updateField("role", event.target.value)} options={[{ value: "unit", label: "Kitchen / Unit" }, { value: "admin", label: "Admin" }, { value: "supplier", label: "Supplier" }]} />
            <Select label="Status" value={form.status} onChange={(event) => updateField("status", event.target.value)} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
            <Select
              label="Assigned Warehouse"
              value={form.assigned_warehouse}
              onChange={(event) => updateField("assigned_warehouse", event.target.value)}
              required={form.role === "unit"}
              disabled={warehousesLoading}
              options={[
                { value: "", label: form.role === "admin" ? "All Warehouses" : warehousesLoading ? "Loading warehouses..." : warehousesError || "Select warehouse..." },
                ...warehouses.map((warehouse) => ({ value: warehouse._id, label: getLocalizedValue(warehouse, "name", "en") }))
              ]}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/users")} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}><Save className="w-4 h-4" />{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>;
};

export {
  EditUser
};
