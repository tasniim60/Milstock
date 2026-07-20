import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { User, Shield, Bell } from "lucide-react";

const labels = {
  en: {
    title: "Profile Settings",
    subtitle: "Manage your account information and preferences",
    personal: "Personal Information",
    fullName: "Full Name",
    email: "Email",
    rank: "Rank",
    kitchen: "Kitchen",
    phone: "Phone",
    base: "Base Location",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    security: "Security",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    updatePassword: "Update Password",
    notifications: "Notification Preferences",
    lowStock: "Low Stock Alerts",
    lowStockHelp: "Receive notifications when items are running low",
    expiration: "Expiration Warnings",
    expirationHelp: "Get notified about items nearing expiration",
    requests: "Request Updates",
    requestsHelp: "Status updates for your supply requests",
    weekly: "Weekly Reports",
    weeklyHelp: "Receive weekly inventory summary emails",
    savePreferences: "Save Preferences",
    preferencesSaved: "Notification preferences saved successfully.",
  },
  ar: {
    title: "إعدادات الملف الشخصي",
    subtitle: "إدارة معلومات الحساب والتفضيلات",
    personal: "المعلومات الشخصية",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    rank: "الرتبة",
    kitchen: "المطبخ",
    phone: "الهاتف",
    base: "موقع القاعدة",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    security: "الأمان",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    updatePassword: "تحديث كلمة المرور",
    notifications: "تفضيلات الإشعارات",
    lowStock: "تنبيهات انخفاض المخزون",
    lowStockHelp: "استلام إشعارات عند انخفاض كميات الأصناف",
    expiration: "تحذيرات انتهاء الصلاحية",
    expirationHelp: "استلام تنبيهات عن الأصناف القريبة من انتهاء الصلاحية",
    requests: "تحديثات الطلبات",
    requestsHelp: "تحديثات حالة طلبات التوريد الخاصة بك",
    weekly: "تقارير أسبوعية",
    weeklyHelp: "استلام ملخص أسبوعي للمخزون عبر البريد",
    savePreferences: "حفظ التفضيلات",
    preferencesSaved: "تم حفظ تفضيلات الإشعارات بنجاح.",
  },
};

const defaultNotificationPreferences = {
  lowStock: true,
  expiration: true,
  requests: true,
  weekly: false,
};

const PreferenceRow = ({ title, help, checked, onChange, isArabic = false }) => (
  <label className={`flex items-center gap-3 cursor-pointer ${isArabic ? "flex-row-reverse text-right" : ""}`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 accent-primary shrink-0" />
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{help}</p>
    </div>
  </label>
);

const ProfilePageView = ({ isArabic = false }) => {
  const t = labels[isArabic ? "ar" : "en"];
  const [preferences, setPreferences] = useState(defaultNotificationPreferences);
  const [preferencesMessage, setPreferencesMessage] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("milstock_notification_preferences") || "{}");
      setPreferences({ ...defaultNotificationPreferences, ...saved });
    } catch {
      setPreferences(defaultNotificationPreferences);
    }
  }, []);

  const updatePreference = (key) => (event) => {
    setPreferences((current) => ({ ...current, [key]: event.target.checked }));
    setPreferencesMessage("");
  };

  const saveNotificationPreferences = () => {
    localStorage.setItem("milstock_notification_preferences", JSON.stringify(preferences));
    setPreferencesMessage(t.preferencesSaved);
  };

  return <div className="p-6 lg:p-8 space-y-6" dir={isArabic ? "rtl" : "ltr"}>
    <PageHeader title={t.title} subtitle={t.subtitle} />

    <div className="max-w-4xl space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            <CardTitle>{t.personal}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t.fullName} defaultValue={isArabic ? "مدير مخزون الأغذية" : "Food Inventory Admin"} />
            <Input label={t.email} type="email" defaultValue="admin@milstock.local" />
            <Input label={t.rank} defaultValue={isArabic ? "مسؤول" : "Administrator"} />
            <Input label={t.kitchen} defaultValue={isArabic ? "إدارة المخزون" : "Inventory Management"} />
            <Input label={t.phone} type="tel" defaultValue="+966 50 123 4567" />
            <Select
              label={t.base}
              options={[
                { value: "central", label: isArabic ? "المطبخ المركزي" : "Central Kitchen" },
                { value: "bakery", label: isArabic ? "مطبخ المخبوزات" : "Bakery Kitchen" },
                { value: "produce", label: isArabic ? "مطبخ المنتجات الطازجة" : "Produce Kitchen" },
              ]}
            />
          </div>
          <div className="mt-6 flex gap-3">
            <Button>{t.saveChanges}</Button>
            <Button variant="outline">{t.cancel}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle>{t.security}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Input label={t.currentPassword} type="password" />
            <Input label={t.newPassword} type="password" />
            <Input label={t.confirmPassword} type="password" />
          </div>
          <div className="mt-6">
            <Button>{t.updatePassword}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <CardTitle>{t.notifications}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PreferenceRow title={t.lowStock} help={t.lowStockHelp} checked={preferences.lowStock} onChange={updatePreference("lowStock")} isArabic={isArabic} />
            <PreferenceRow title={t.expiration} help={t.expirationHelp} checked={preferences.expiration} onChange={updatePreference("expiration")} isArabic={isArabic} />
            <PreferenceRow title={t.requests} help={t.requestsHelp} checked={preferences.requests} onChange={updatePreference("requests")} isArabic={isArabic} />
            <PreferenceRow title={t.weekly} help={t.weeklyHelp} checked={preferences.weekly} onChange={updatePreference("weekly")} isArabic={isArabic} />
          </div>
          {preferencesMessage && <p className="mt-4 text-sm text-[#5B8A4A]">{preferencesMessage}</p>}
          <div className="mt-6">
            <Button type="button" onClick={saveNotificationPreferences}>{t.savePreferences}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>;
};

const ProfilePage = () => <ProfilePageView />;

export {
  ProfilePage,
  ProfilePageView
};
