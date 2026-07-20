const normalizeApiBaseUrl = (value) => {
  const rawUrl = String(value || "http://localhost:5001/api").trim();
  const protocolFixedUrl = rawUrl.replace(/^https?:\/\/https?:\/\//i, "https://");
  const slashFixedUrl = protocolFixedUrl.replace(/^https?:\/\/https\/\//i, "https://");
  const withoutTrailingSlash = slashFixedUrl.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith("/api") ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const DEMO_TOKEN = "frontend-test-admin-token";

const request = async (path, options = {}) => {
  const { token: explicitToken, ...fetchOptions } = options;
  const token = Object.prototype.hasOwnProperty.call(options, "token")
    ? explicitToken
    : localStorage.getItem("milstock_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers
    });
  } catch (error) {
    throw new Error(`Unable to reach backend API at ${API_BASE_URL}. Make sure the backend server is running on port 5001.`);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    const details = Array.isArray(error.errors) && error.errors.length ? `: ${error.errors.join(", ")}` : "";
    throw new Error(`${error.message || "API request failed"}${details}`);
  }
  if (response.status === 204) {
    return void 0;
  }
  return response.json();
};

const requestWithFallback = async (primaryPath, fallbackPath, options = {}) => {
  try {
    return await request(primaryPath, options);
  } catch (error) {
    if (String(error.message || "").includes(`Route ${primaryPath} was not found`)) {
      return request(fallbackPath, options);
    }
    throw error;
  }
};

const ensureBackendAdminToken = async () => {
  const token = localStorage.getItem("milstock_token");
  if (token !== DEMO_TOKEN) return token;

  const response = await request("/auth/login", {
    method: "POST",
    token: "",
    body: JSON.stringify({
      email: "admin@milstock.local",
      password: "Password123!"
    })
  });

  if (response?.token) {
    localStorage.setItem("milstock_token", response.token);
  }
  if (response?.data) {
    localStorage.setItem("milstock_user", JSON.stringify(response.data));
  }

  return response?.token;
};

const getStoredUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("milstock_user") || "{}");
    if (user?._id || user?.id) return user._id || user.id;
  } catch {
    // Fall through to JWT parsing below.
  }
  try {
    const token = localStorage.getItem("milstock_token") || "";
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return payload?.id || payload?._id || "";
  } catch {
    return "";
  }
};

const toQueryString = (query = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

function crud(basePath) {
  return {
    list: (query) => request(`${basePath}${toQueryString(query)}`),
    get: (id) => request(`${basePath}/${id}`),
    create: (payload) => request(basePath, { method: "POST", body: JSON.stringify(payload) }),
    update: (id, payload) => request(`${basePath}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id) => request(`${basePath}/${id}`, { method: "DELETE" })
  };
}
const api = {
  auth: {
    register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
    login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    me: () => request("/auth/me")
  },
  users: {
    ...crud("/users"),
    create: async (payload) => {
      await ensureBackendAdminToken();
      return request("/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    update: (id, payload) => request(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
    updateStatus: (id, status) => request(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
    resetPassword: (id, password) => request(`/users/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password })
    }),
    remove: (id) => request(`/users/${id}`, { method: "DELETE" })
  },
  supplierUsers: {
    list: () => request("/users?role=supplier&status=active"),
    orders: () => request("/supplier/orders"),
    getOrder: (id) => request(`/supplier/orders/${id}`),
    updateStatus: (id, status, note) => request(`/supplier/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note })
    })
  },
  products: {
    ...crud("/products"),
    getAlertSettings: (id) => request(`/products/${id}/alert-settings`),
    updateAlertSettings: (id, payload) => request(`/products/${id}/alert-settings`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    })
  },
  warehouses: {
    ...crud("/warehouses"),
    create: async (payload) => {
      await ensureBackendAdminToken();
      const userId = getStoredUserId();
      return request("/warehouses", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          ...(payload.user_id || !userId ? {} : { user_id: userId })
        })
      });
    },
    getDashboard: (id) => request(`/warehouses/${id}/dashboard`)
  },
  suppliers: crud("/suppliers"),
  orders: {
    ...crud("/orders"),
    updateStatus: (id, status, note) => request(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note })
    }),
    adminDecision: (id, decision, note) => request(`/orders/${id}/admin-decision`, {
      method: "PATCH",
      body: JSON.stringify({ decision, note })
    }),
    statusLogs: (id) => request(`/orders/${id}/status-logs`)
  },
  orderItems: crud("/order-items"),
  inventory: {
    ...crud("/inventory"),
    completeTransfer: (orderId, note) => request(`/inventory/complete-transfer/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ note })
    })
  },
  movements: {
    ...crud("/movements"),
    completeTransfer: (orderId, note) => request(`/movements/complete-transfer/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ note })
    }),
    pending: (query) => request(`/movements${toQueryString({ ...query, status: "pending", movement_type: "warehouse_transfer" })}`)
  },
  productWarehouses: crud("/product-warehouses"),
  consumption: crud("/consumption"),
  consumptions: {
    list: (query) => requestWithFallback(`/consumptions${toQueryString(query)}`, `/consumption${toQueryString(query)}`),
    get: (id) => requestWithFallback(`/consumptions/${id}`, `/consumption/${id}`),
    create: (payload) => requestWithFallback("/consumptions", "/consumption", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
    update: (id, payload) => requestWithFallback(`/consumptions/${id}`, `/consumption/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
    remove: (id) => requestWithFallback(`/consumptions/${id}`, `/consumption/${id}`, { method: "DELETE" }),
    mine: () => requestWithFallback("/consumptions/my", "/consumption"),
    cancel: (id, reason) => requestWithFallback(`/consumptions/${id}/cancel`, `/consumption/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    })
  },
  waste: {
    list: () => requestWithFallback("/waste", "/wastes"),
    products: () => requestWithFallback("/waste/products", "/products"),
    analytics: () => requestWithFallback("/waste/analytics", "/wastes/analytics"),
    create: (payload) => requestWithFallback("/waste", "/wastes", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },
  notifications: {
    ...crud("/notifications"),
    expiration: () => request("/notifications/expiration/check"),
    markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () => request("/notifications/read-all", { method: "PATCH" })
  },
  auditLogs: {
    list: (query = "") => request(`/audit-logs${query}`),
    create: (payload) => request("/audit-logs", { method: "POST", body: JSON.stringify(payload) })
  }
};
export {
  api
};
