const USER_STORAGE_KEY = "milstock_user";
const TOKEN_STORAGE_KEY = "milstock_token";

const normalizeRole = (role) => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "admin") return "admin";
  if (["supplier", "provider"].includes(normalized)) return "supplier";
  if (["unit", "kitchen", "user"].includes(normalized)) return "user";
  return "";
};

const getStoredAuth = () => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const user = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
    return {
      token,
      user,
      role: normalizeRole(user?.role)
    };
  } catch {
    return { token: "", user: null, role: "" };
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

const getRoleHomePath = (role, isArabic = false) => {
  const prefix = isArabic ? "/ar" : "";
  const normalized = normalizeRole(role);
  if (normalized === "admin") return `${prefix}/admin/dashboard`;
  if (normalized === "supplier") return `${prefix}/supplier/dashboard`;
  return `${prefix}/user/dashboard`;
};

const getLoginPath = (isArabic = false) => isArabic ? "/ar/login" : "/login";

export {
  clearStoredAuth,
  getLoginPath,
  getRoleHomePath,
  getStoredAuth,
  normalizeRole
};
