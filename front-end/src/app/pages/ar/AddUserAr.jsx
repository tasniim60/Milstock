import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Save, UserPlus } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { getLocalizedValue } from "../../lib/localization";

const initialForm = {
  name: "",
  email: "",
  password: "",
  military_number: "",
  phone: "",
  role: "unit",
  assigned_warehouse: ""
};

const AddUserAr = () => {
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
      setError("يرجى ملء كل الحقول المطلوبة.");
      return;
    }

    if (payload.role === "unit" && !payload.assigned_warehouse) {
      setError("المخزن المسؤول عنه مطلوب لمستخدم الوحدة.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.users.create(payload);
      setSuccess("تم إنشاء المستخدم بنجاح.");
      setForm(initialForm);
      window.setTimeout(() => {
        navigate("/ar/admin/users", { state: { message: "تم إنشاء المستخدم بنجاح." } });
      }, 700);
    } catch (requestError) {
      setError(requestError.message || "تعذر إنشاء المستخدم.");
    } finally {
      setSaving(false);
    }
  };

  return <div dir="rtl" className="p-6 lg:p-8 space-y-6">
    <button
      onClick={() => navigate("/ar/admin/users")}
      className="flex items-center gap-2 text-[#5A6B50] hover:text-[#2E3A24] transition-colors text-sm"
    >
      <ArrowRight className="w-4 h-4" />
      العودة إلى المستخدمين
    </button>

    <PageHeaderAr
      title="إضافة مستخدم"
      subtitle="إنشاء حساب مستخدم في MilStock"
      badge={<UserPlus className="w-5 h-5 text-[#6A7B4D]" />}
    />

    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-right">بيانات المستخدم</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-5 rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D] text-right">{error}</div>}
        {success && <div className="mb-5 rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e] text-right">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="الاسم" value={form.name} onChange={(event) => updateField("name", event.target.value)} required minLength={3} className="text-right" />
            <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required className="text-right" />
            <Input label="كلمة المرور" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={8} className="text-right" />
            <Input label="كود الموظف" value={form.military_number} onChange={(event) => updateField("military_number", event.target.value)} required className="text-right" />
            <Input label="الهاتف" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} required className="text-right" />
            <Select
              label="الدور"
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
              options={[
                { value: "unit", label: "مستخدم وحدة" },
                { value: "admin", label: "مسؤول" },
                { value: "supplier", label: "المورد" }
              ]}
              className="text-right"
            />
            <Select
              label="المخزن المسؤول عنه"
              value={form.assigned_warehouse}
              onChange={(event) => updateField("assigned_warehouse", event.target.value)}
              required={form.role === "unit"}
              disabled={warehousesLoading}
              options={[
                { value: "", label: form.role === "admin" ? "كل المخازن" : warehousesLoading ? "جاري تحميل المخازن..." : warehousesError || "اختر المخزن" },
                ...warehouses.map((warehouse) => ({ value: warehouse._id, label: getLocalizedValue(warehouse, "name", "ar") }))
              ]}
              className="text-right"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/ar/admin/users")} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "جاري الإنشاء..." : "إنشاء المستخدم"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>;
};

export {
  AddUserAr
};
