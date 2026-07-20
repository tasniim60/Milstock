import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { normalizeArray } from "../lib/normalize";

const NotificationContext = createContext(null);

const isRead = (notification) =>
  notification?.status === "read" || notification?.read === true || notification?.is_read === true;

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await api.notifications.expiration().catch(() => null);
      const response = await api.notifications.list();
      setNotifications(normalizeArray(response));
    } catch (requestError) {
      setNotifications([]);
      setError(requestError.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) => current.map((notification) => ({
      ...notification,
      is_read: true,
      read: true,
      status: "read",
    })));
    await api.notifications.markAllRead();
  }, []);

  const markOneAsRead = useCallback(async (id) => {
    setNotifications((current) => current.map((notification) => notification._id === id ? {
      ...notification,
      is_read: true,
      read: true,
      status: "read",
    } : notification));
    await api.notifications.markRead(id);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !isRead(notification)).length,
    [notifications]
  );

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAllAsRead,
    markOneAsRead,
    isRead,
  }), [notifications, unreadCount, loading, error, fetchNotifications, markAllAsRead, markOneAsRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

export {
  NotificationProvider,
  isRead,
  useNotifications
};
