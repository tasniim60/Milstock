import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Edit, Eye, KeyRound, MoreVertical, Power, Search, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { ActionsPortalMenu } from "../components/ActionsPortalMenu";
import { api } from "../lib/api";
import { useApiResource } from "../lib/useApiResource";
import { formatDate } from "../lib/format";
import { getAssignedWarehouseName } from "../lib/warehouseDisplay";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("milstock_user") || "null");
  } catch {
    return null;
  }
};

const UserManagement = () => {
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
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const showSuccess = (text) => {
    setErrorMessage("");
    setMessage(text);
  };

  const showError = (text) => {
    setMessage("");
    setErrorMessage(text);
  };

  const filteredUsers = rows.filter((user) => {
    const search = String(searchTerm ?? "").toLowerCase();
    return String(user.name ?? "").toLowerCase().includes(search) || String(user.email ?? "").toLowerCase().includes(search) || String(user.military_number ?? "").toLowerCase().includes(search);
  });
  const exportColumns = [
    { key: "military_number", header: "Employee Code" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "status", header: "Status" },
    { header: "Warehouse", value: (row) => getAssignedWarehouseName(row) },
    { key: "phone", header: "Phone" },
    { header: "Created", value: (row) => formatDate(row.createdAt) }
  ];

  const updateStatus = async (user) => {
    const nextStatus = (user.status || "active") === "active" ? "inactive" : "active";
    setBusyId(user._id);
    setOpenMenu(null);
    try {
      const response = await api.users.updateStatus(user._id, nextStatus);
      const updated = response?.data || response?.user || { ...user, status: nextStatus };
      setRows((current) => current.map((row) => row._id === user._id ? { ...row, ...updated, status: updated.status || nextStatus } : row));
      showSuccess(`User ${nextStatus === "active" ? "activated" : "deactivated"} successfully.`);
    } catch (requestError) {
      showError(requestError.message || "Unable to update user status.");
    } finally {
      setBusyId("");
    }
  };

  const resetPassword = async () => {
    if (!resetUser || newPassword.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }
    setBusyId(resetUser._id);
    try {
      await api.users.resetPassword(resetUser._id, newPassword);
      setResetUser(null);
      setNewPassword("");
      showSuccess("Password reset successfully.");
    } catch (requestError) {
      showError(requestError.message || "Unable to reset password.");
    } finally {
      setBusyId("");
    }
  };

  const removeUser = async () => {
    if (!deleteUser) return;
    if (currentUser?._id && currentUser._id === deleteUser._id) {
      showError("You cannot delete your own admin account.");
      setDeleteUser(null);
      return;
    }
    setBusyId(deleteUser._id);
    try {
      await api.users.remove(deleteUser._id);
      setRows((current) => current.filter((row) => row._id !== deleteUser._id));
      setDeleteUser(null);
      showSuccess("User deleted successfully.");
    } catch (requestError) {
      showError(requestError.message || "Unable to delete user.");
    } finally {
      setBusyId("");
    }
  };

  const columns = [
    { key: "military_number", header: "Employee Code" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) => <Badge variant={row.role === "admin" ? "info" : row.role === "supplier" ? "success" : "neutral"}>{row.role === "admin" ? "Admin" : row.role === "supplier" ? "Supplier" : "Kitchen"}</Badge>
    },
    { key: "warehouse", header: "Warehouse", render: (row) => getAssignedWarehouseName(row) },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={(row.status || "active") === "active" ? "success" : "neutral"}>{row.status || "active"}</Badge>
    },
    { key: "phone", header: "Phone" },
    { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => <div className="relative">
        <button
          type="button"
          aria-label={`Open actions for ${row.name || "user"}`}
          disabled={busyId === row._id}
          onClick={(event) => {
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            setOpenMenu((current) => current?.id === row._id ? null : { id: row._id, row, rect });
          }}
          className="p-2 hover:bg-[#E0E1B7] rounded-lg transition-colors disabled:opacity-50"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    }
  ];

  return <div className="p-6 lg:p-8 space-y-6">
    <PageHeader title="User Management" subtitle="Manage user accounts and permissions" action={{ label: "Add User", onClick: () => navigate("/admin/users/new"), icon: UserPlus }} />
    {message && <div className="rounded-xl border border-[#5B8A4A]/20 bg-[#5B8A4A]/10 px-4 py-3 text-sm text-[#3d6b2e]">{message}</div>}
    {errorMessage && <div className="rounded-xl border border-[#D4183D]/20 bg-[#D4183D]/10 px-4 py-3 text-sm text-[#D4183D]">{errorMessage}</div>}

    <div className="mb-5">
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B50]" />
        <Input placeholder="Search users..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-10" />
      </div>
    </div>

    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-[#5A6B50]">{loading ? "Loading users..." : error || `${filteredUsers.length} users loaded`}</p>
      <ExportCsvButton filenamePrefix="users-export" columns={exportColumns} rows={loading ? [] : filteredUsers}>
        Export
      </ExportCsvButton>
    </div>
    <Table columns={columns} data={loading ? [] : filteredUsers} emptyMessage={error || "No users found. Add users or run the backend seed."} />

    {openMenu && <ActionsPortalMenu
      anchorRect={openMenu.rect}
      onClose={() => setOpenMenu(null)}
      items={[
        { label: "View Details", icon: Eye, action: () => navigate(`/admin/users/${openMenu.row._id}`) },
        { label: "Edit User", icon: Edit, action: () => navigate(`/admin/users/${openMenu.row._id}/edit`) },
        { label: (openMenu.row.status || "active") === "active" ? "Deactivate User" : "Activate User", icon: Power, action: () => updateStatus(openMenu.row) },
        { label: "Reset Password", icon: KeyRound, action: () => { setResetUser(openMenu.row); setNewPassword(""); } },
        { label: "Delete User", icon: Trash2, danger: true, action: () => setDeleteUser(openMenu.row) }
      ]}
    />}

    {resetUser && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#4E4631]/10 shadow-xl p-6">
        <h3 className="text-[#2E3A24] font-semibold mb-2">Reset Password</h3>
        <p className="text-sm text-[#5A6B50] mb-4">Set a new password for {resetUser.name || "this user"}.</p>
        <Input label="New Password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} placeholder="At least 8 characters" />
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="outline" type="button" onClick={() => setResetUser(null)} disabled={busyId === resetUser._id}>Cancel</Button>
          <Button type="button" onClick={resetPassword} disabled={busyId === resetUser._id}>{busyId === resetUser._id ? "Resetting..." : "Reset Password"}</Button>
        </div>
      </div>
    </div>}

    {deleteUser && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#4E4631]/10 shadow-xl p-6">
        <h3 className="text-[#2E3A24] font-semibold mb-2">Delete User</h3>
        <p className="text-sm text-[#5A6B50] mb-5">Are you sure you want to delete {deleteUser.name || "this user"}? This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => setDeleteUser(null)} disabled={busyId === deleteUser._id}>Cancel</Button>
          <Button variant="danger" type="button" onClick={removeUser} disabled={busyId === deleteUser._id}>{busyId === deleteUser._id ? "Deleting..." : "Delete User"}</Button>
        </div>
      </div>
    </div>}
  </div>;
};

export {
  UserManagement
};
