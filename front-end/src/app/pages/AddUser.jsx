import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { getLocalizedValue } from "../lib/localization";

const initialForm = {
  name: "",
  email: "",
  password: "",
  military_number: "",
  phone: "",
  role: "unit",
  assigned_warehouse: ""
};

const AddUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { data: warehouses, loading: warehousesLoading, error: warehousesError } = useApiResource(() => api.warehouses.list(), []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      military_number: form.military_number.trim(),
      phone: form.phone.trim(),
      role: form.role,
      assigned_warehouse: form.assigned_warehouse || null
    };

    if (!payload.name || !payload.email || !payload.password || !payload.military_number || !payload.phone || !payload.role) {
      setError("Please fill in all required fields.");
      return;
    }
    if (payload.role === "unit" && !payload.assigned_warehouse) {
      setError("Assigned Warehouse is required for Kitchen / Unit users.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.users.create(payload);
      setSuccess("User created successfully.");
      setForm(initialForm);
      window.setTimeout(() => {
        navigate("/admin/users", { state: { message: "User created successfully." } });
      }, 700);
    } catch (requestError) {
      setError(requestError.message || "Unable to create user.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="p-6 lg:p-8 space-y-6">
    <button
      onClick={() => navigate("/admin/users")}
      className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] transition-colors text-sm"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Users
    </button>

    <PageHeader
      title="Add User"
      subtitle="Create a MilStock user account"
      badge={<UserPlus className="w-5 h-5 text-[#6A7B4D]" />}
    />

    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-5 rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{error}</div>}
        {success && <div className="mb-5 rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e]">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
              minLength={3}
              placeholder="Food inventory admin"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              autoComplete="email"
              placeholder="user@milstock.local"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <Input
              label="Employee Code"
              value={form.military_number}
              onChange={(event) => updateField("military_number", event.target.value)}
              required
              placeholder="EMP-010"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              required
              placeholder="+20 100 000 0000"
            />
            <Select
              label="Role"
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
              options={[
                { value: "unit", label: "Kitchen / Unit" },
                { value: "admin", label: "Admin" },
                { value: "supplier", label: "Supplier" }
              ]}
            />
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/users")} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>;
};

export {
  AddUser
};
