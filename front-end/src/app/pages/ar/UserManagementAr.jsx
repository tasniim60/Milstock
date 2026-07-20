import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Edit, Eye, KeyRound, MoreVertical, Plus, Power, Search, Trash2 } from "lucide-react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Badge } from "../../components/Badge";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { ExportCsvButton } from "../../components/ExportCsvButton";
import { ActionsPortalMenu } from "../../components/ActionsPortalMenu";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatDate } from "../../lib/format";
import { getAssignedWarehouseName } from "../../lib/warehouseDisplay";
import { getLocalizedDisplayName, getLocalizedRoleLabel } from "../../lib/localization";

const t = {
  pageTitle: "إدارة المستخدمين",
  pageSubtitle: "إدارة حسابات المستخدمين وصلاحياتهم",
  addUser: "إضافة مستخدم",
  searchPlaceholder: "ابحث في المستخدمين...",
  loading: "جاري تحميل المستخدمين...",
  userCount: (count) => `${count} مستخدم`,
  export: "تصدير",
  notAssigned: "غير محدد",
  allWarehouses: "كل المخازن",
  active: "نشط",
  inactive: "غير نشط",
  unitUser: "مستخدم وحدة",
  noUsers: "لا يوجد مستخدمون.",
  userOptions: "خيارات المستخدم",
  headers: [
    "كود الموظف",
    "الاسم",
    "البريد الإلكتروني",
    "الدور",
    "الحالة",
    "المخزن",
    "الهاتف",
    "تاريخ الإنشاء",
    "الإجراءات"
  ],
  actions: {
    view: "عرض المستخدم",
    edit: "تعديل المستخدم",
    deactivate: "تعطيل المستخدم",
    activate: "تفعيل المستخدم",
    resetPassword: "إعادة تعيين كلمة المرور",
    delete: "حذف المستخدم"
  },
  messages: {
    activated: "تم تفعيل المستخدم بنجاح.",
    deactivated: "تم تعطيل المستخدم بنجاح.",
    statusFailed: "تعذر تحديث حالة المستخدم.",
    passwordTooShort: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
    passwordUpdated: "تم تحديث كلمة مرور المستخدم بنجاح.",
    passwordFailed: "تعذر تحديث كلمة مرور المستخدم.",
    cannotDeleteSelf: "لا يمكنك حذف حساب المستخدم الحالي.",
    deleted: "تم حذف المستخدم بنجاح.",
    deleteFailed: "تعذر حذف المستخدم."
  },
  resetModal: {
    title: "إعادة تعيين كلمة المرور",
    body: (name) => `اكتب كلمة مرور جديدة للمستخدم ${name}.`,
    label: "كلمة المرور الجديدة",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    save: "حفظ كلمة المرور"
  },
  deleteModal: {
    title: "حذف المستخدم",
    body: (name) => `هل تريد حذف ${name}؟ لا يمكن التراجع عن هذا الإجراء.`,
    cancel: "إلغاء",
    deleting: "جاري الحذف...",
    delete: "حذف المستخدم"
  }
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("milstock_user") || "null");
  } catch {
    return null;
  }
};

const UserManagementAr = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useMemo(getCurrentUser, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [resetUser, setResetUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const { data: users, loading, error } = useApiResource(() => api.users.list(), []);

  useEffect(() => {
    setRows(users.map((user) => ({ ...user, status: user.status || "active" })));
  }, [users]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setResetUser(null);
        setDeleteUser(null);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const filtered = rows.filter((user) => {
    const search = String(searchTerm ?? "").toLowerCase();
    return (
      String(getLocalizedDisplayName(user, "ar") ?? "").toLowerCase().includes(search) ||
      String(user.email ?? "").toLowerCase().includes(search) ||
      String(user.military_number ?? "").toLowerCase().includes(search)
    );
  });

  const exportColumns = [
    { key: "military_number", header: t.headers[0] },
    { header: t.headers[1], value: (row) => getLocalizedDisplayName(row, "ar") },
    { key: "email", header: t.headers[2] },
    { header: t.headers[3], value: (row) => getLocalizedRoleLabel(row.role, "ar") },
    { header: t.headers[4], value: (row) => (row.status || "active") === "active" ? t.active : t.inactive },
    { header: t.headers[5], value: (row) => getAssignedWarehouseName(row, t.allWarehouses, t.notAssigned) },
    { key: "phone", header: t.headers[6] },
    { header: t.headers[7], value: (row) => formatDate(row.createdAt) }
  ];

  const showSuccess = (text) => {
    setErrorMessage("");
    setMessage(text);
  };

  const showError = (text) => {
    setMessage("");
    setErrorMessage(text);
  };

  const updateStatus = async (user) => {
    const nextStatus = (user.status || "active") === "active" ? "inactive" : "active";
    setBusyId(user._id);
    setOpenMenu(null);

    try {
      const response = await api.users.updateStatus(user._id, nextStatus);
      const updated = response?.data || response?.user || { ...user, status: nextStatus };
      setRows((current) =>
        current.map((row) =>
          row._id === user._id ? { ...row, ...updated, status: updated.status || nextStatus } : row
        )
      );
      showSuccess(nextStatus === "active" ? t.messages.activated : t.messages.deactivated);
    } catch (requestError) {
      showError(requestError.message || t.messages.statusFailed);
    } finally {
      setBusyId("");
    }
  };

  const resetPassword = async () => {
    if (!resetUser || newPassword.length < 8) {
      showError(t.messages.passwordTooShort);
      return;
    }

    setBusyId(resetUser._id);
    try {
      await api.users.resetPassword(resetUser._id, newPassword);
      setResetUser(null);
      setNewPassword("");
      showSuccess(t.messages.passwordUpdated);
    } catch (requestError) {
      showError(requestError.message || t.messages.passwordFailed);
    } finally {
      setBusyId("");
    }
  };

  const removeUser = async () => {
    if (!deleteUser) return;
    if (currentUser?._id && currentUser._id === deleteUser._id) {
      showError(t.messages.cannotDeleteSelf);
      setDeleteUser(null);
      return;
    }

    setBusyId(deleteUser._id);
    try {
      await api.users.remove(deleteUser._id);
      setRows((current) => current.filter((row) => row._id !== deleteUser._id));
      setDeleteUser(null);
      showSuccess(t.messages.deleted);
    } catch (requestError) {
      showError(requestError.message || t.messages.deleteFailed);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div dir="rtl" className="p-6 lg:p-8 space-y-6 text-right">
      <PageHeaderAr
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        action={{ label: t.addUser, onClick: () => navigate("/ar/admin/users/new"), icon: Plus }}
      />

      {message && (
        <div className="rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e]">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">
          {errorMessage}
        </div>
      )}

      <div className="relative max-w-md mr-auto">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B50]" />
        <Input
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pr-10 text-right"
        />
      </div>

      <div className="flex justify-start">
        <ExportCsvButton filenamePrefix="users-export" columns={exportColumns} rows={loading ? [] : filtered}>
          {t.export}
        </ExportCsvButton>
      </div>

      <p className="text-sm text-[#5A6B50] text-right">
        {loading ? t.loading : error || t.userCount(filtered.length)}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[#4E4631]/10 bg-white">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-[#4E4631]/10 bg-[#ECEEE2]/60">
              {t.headers.map((header) => (
                <th key={header} className="px-5 py-3.5 text-xs font-semibold text-[#5A6B50] uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4E4631]/6">
            {(loading ? [] : filtered).map((user) => (
              <tr key={user._id} className="hover:bg-[#ECEEE2]/40 transition-colors">
                <td className="px-5 py-3.5 text-sm text-[#2E3A24]">{user.military_number || t.notAssigned}</td>
                <td className="px-5 py-3.5 text-sm text-[#2E3A24] font-medium">
                  {getLocalizedDisplayName(user, "ar") || t.notAssigned}
                </td>
                <td className="px-5 py-3.5 text-sm text-[#2E3A24]">{user.email || t.notAssigned}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={user.role === "admin" ? "info" : "neutral"}>
                    {getLocalizedRoleLabel(user.role, "ar") || t.unitUser}
                  </Badge>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={(user.status || "active") === "active" ? "success" : "neutral"}>
                    {(user.status || "active") === "active" ? t.active : t.inactive}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#2E3A24]">
                  {getAssignedWarehouseName(user, t.allWarehouses, t.notAssigned)}
                </td>
                <td className="px-5 py-3.5 text-sm text-[#2E3A24]">{user.phone || t.notAssigned}</td>
                <td className="px-5 py-3.5 text-sm text-[#2E3A24]">{formatDate(user.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    aria-label={t.userOptions}
                    disabled={busyId === user._id}
                    onClick={(event) => {
                      event.stopPropagation();
                      const rect = event.currentTarget.getBoundingClientRect();
                      setOpenMenu((current) =>
                        current?.id === user._id ? null : { id: user._id, row: user, rect }
                      );
                    }}
                    className="p-2 hover:bg-[#E0E1B7] rounded-lg transition-colors disabled:opacity-50"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-sm text-[#5A6B50]">
                  {error || t.noUsers}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openMenu && (
        <ActionsPortalMenu
          rtl
          anchorRect={openMenu.rect}
          onClose={() => setOpenMenu(null)}
          items={[
            { label: t.actions.view, icon: Eye, action: () => navigate(`/ar/admin/users/${openMenu.row._id}`) },
            { label: t.actions.edit, icon: Edit, action: () => navigate(`/ar/admin/users/${openMenu.row._id}/edit`) },
            {
              label: (openMenu.row.status || "active") === "active" ? t.actions.deactivate : t.actions.activate,
              icon: Power,
              action: () => updateStatus(openMenu.row)
            },
            {
              label: t.actions.resetPassword,
              icon: KeyRound,
              action: () => {
                setResetUser(openMenu.row);
                setNewPassword("");
              }
            },
            { label: t.actions.delete, icon: Trash2, danger: true, action: () => setDeleteUser(openMenu.row) }
          ]}
        />
      )}

      {resetUser && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#4E4631]/10 shadow-xl p-6 text-right">
            <h3 className="text-[#2E3A24] font-semibold mb-2">{t.resetModal.title}</h3>
            <p className="text-sm text-[#5A6B50] mb-4">
              {t.resetModal.body(getLocalizedDisplayName(resetUser, "ar") || t.notAssigned)}
            </p>
            <Input
              label={t.resetModal.label}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              className="text-right"
            />
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="outline" type="button" onClick={() => setResetUser(null)} disabled={busyId === resetUser._id}>
                {t.resetModal.cancel}
              </Button>
              <Button type="button" onClick={resetPassword} disabled={busyId === resetUser._id}>
                {busyId === resetUser._id ? t.resetModal.saving : t.resetModal.save}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#4E4631]/10 shadow-xl p-6 text-right">
            <h3 className="text-[#2E3A24] font-semibold mb-2">{t.deleteModal.title}</h3>
            <p className="text-sm text-[#5A6B50] mb-5">
              {t.deleteModal.body(getLocalizedDisplayName(deleteUser, "ar") || t.notAssigned)}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setDeleteUser(null)} disabled={busyId === deleteUser._id}>
                {t.deleteModal.cancel}
              </Button>
              <Button variant="danger" type="button" onClick={removeUser} disabled={busyId === deleteUser._id}>
                {busyId === deleteUser._id ? t.deleteModal.deleting : t.deleteModal.delete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export {
  UserManagementAr
};
