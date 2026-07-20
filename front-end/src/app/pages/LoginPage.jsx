import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, Lock, User, Globe, BarChart3 } from "lucide-react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { BrandLogo } from "../components/BrandLogo";
import { api } from "../lib/api";
import { getRoleHomePath } from "../lib/auth";

const copy = {
  en: {
    heroSubtitle: "Food Warehouse Operations",
    heroTitle: "Reliable Food Inventory Control for Warehouse Operations",
    heroBody: "Secure, real-time tracking of food supplies across kitchens, suppliers, and warehouses.",
    secure: "Secure Access",
    role: "Role-Based Control",
    analytics: "Real-Time Analytics",
    copyright: "© 2026 MilStock. All rights reserved.",
    switchHero: "العربية",
    switchForm: "التبديل إلى العربية",
    welcome: "Welcome Back",
    subtitle: "Sign in to access your food inventory dashboard",
    email: "Email or Username",
    emailPlaceholder: "Enter your email or username",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    forgot: "Forgot password?",
    signing: "Signing in...",
    submit: "Sign In to MilStock",
    demo: "Demo Credentials",
    admin: "Admin:",
    kitchen: "Kitchen User:",
    frontend: "Frontend Test:",
    passwordDemo: "Password: Password123!",
    testPassword: "Frontend test password: 123",
    error: "Unable to sign in",
    targetLogin: "/ar/login",
    roleHomeArabic: false,
  },
  ar: {
    heroSubtitle: "إدارة مستودعات الأغذية",
    heroTitle: "تحكم موثوق في مخزون الأغذية لعمليات المخازن",
    heroBody: "تتبع آمن وفوري لإمدادات الأغذية عبر المطابخ والموردين والمخازن.",
    secure: "وصول آمن",
    role: "تحكم حسب الدور",
    analytics: "تحليلات فورية",
    copyright: "© 2026 MilStock. جميع الحقوق محفوظة.",
    switchHero: "English",
    switchForm: "التبديل إلى الإنجليزية",
    welcome: "مرحبًا بعودتك",
    subtitle: "سجّل الدخول للوصول إلى لوحة إدارة مخزون الأغذية",
    email: "البريد الإلكتروني أو اسم المستخدم",
    emailPlaceholder: "اكتب البريد الإلكتروني أو اسم المستخدم",
    password: "كلمة المرور",
    passwordPlaceholder: "اكتب كلمة المرور",
    remember: "تذكرني",
    forgot: "نسيت كلمة المرور؟",
    signing: "جاري تسجيل الدخول...",
    submit: "تسجيل الدخول إلى MilStock",
    demo: "حسابات تجريبية",
    admin: "المسؤول:",
    kitchen: "مستخدم المطبخ:",
    frontend: "اختبار الواجهة:",
    passwordDemo: "كلمة المرور: Password123!",
    testPassword: "كلمة مرور الاختبار: 123",
    error: "تعذر تسجيل الدخول",
    targetLogin: "/login",
    roleHomeArabic: true,
  },
};

const LoginPageView = ({ isArabic = false }) => {
  const navigate = useNavigate();
  const locale = isArabic ? "ar" : "en";
  const t = copy[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === "testadmin@milstock.local" && password === "123") {
      const testUser = {
        _id: "frontend-test-admin",
        name: "Frontend Test Admin",
        email: "testadmin@milstock.local",
        phone: "",
        military_number: "TEST-ADMIN",
        role: "admin",
      };
      localStorage.setItem("milstock_token", "frontend-test-admin-token");
      localStorage.setItem("milstock_user", JSON.stringify(testUser));
      navigate(isArabic ? "/ar/admin/dashboard" : "/admin/dashboard", { replace: true });
      setLoading(false);
      return;
    }

    try {
      const response = await api.auth.login({ email, password });
      localStorage.setItem("milstock_token", response.token);
      const user = response.user || response.data;
      localStorage.setItem("milstock_user", JSON.stringify(user));
      navigate(getRoleHomePath(user?.role, isArabic), { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen flex bg-[#ECEEE2]" dir={isArabic ? "rtl" : "ltr"}>
    <div className="hidden lg:flex lg:w-[45%] bg-[#2E3A24] p-12 flex-col justify-between relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(#E0E1B7 1px, transparent 1px), linear-gradient(90deg, #E0E1B7 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#4B5B3A] rounded-full filter blur-3xl opacity-30 -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6A7B4D] rounded-full filter blur-3xl opacity-20 translate-y-1/3 -translate-x-1/3" />

      <div className="relative z-10">
        <BrandLogo className="mb-14" subtitle={t.heroSubtitle} />
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl font-bold text-white leading-tight">{t.heroTitle}</h2>
          <p className="text-[#E0E1B7]/70 leading-relaxed">{t.heroBody}</p>
        </div>

        <div className="flex flex-wrap gap-3 mt-10">
          {[
            { icon: Shield, label: t.secure },
            { icon: Lock, label: t.role },
            { icon: BarChart3, label: t.analytics },
          ].map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2">
            <Icon className="w-4 h-4 text-[#6A7B4D]" />
            <span className="text-sm text-[#E0E1B7]/80">{label}</span>
          </div>)}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <p className="text-xs text-[#E0E1B7]/40">{t.copyright}</p>
        <Link to={t.targetLogin} className="flex items-center gap-1.5 text-[#C9A961] hover:text-[#C9A961]/80 transition-colors text-sm">
          <Globe className="w-4 h-4" />
          {t.switchHero}
        </Link>
      </div>
    </div>

    <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-md">
        <BrandLogo
          className="mb-8 lg:hidden"
          subtitle={isArabic ? "مخزون الأغذية" : "Food Inventory"}
          textColor="text-[#2E3A24]"
          subtitleColor="text-[#5A6B50]"
        />

        <div className="mb-8">
          <h1 className="text-[#2E3A24] mb-2">{t.welcome}</h1>
          <p className="text-sm text-[#5A6B50]">{t.subtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <p className="text-sm text-[#D4183D]">{error}</p>}
          <Input
            label={t.email}
            type="text"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label={t.password}
            type="password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="w-4 h-4 rounded border border-[#4B5B3A]/30 accent-[#6A7B4D] cursor-pointer"
              />
              <span className="text-sm text-[#2E3A24]">{t.remember}</span>
            </label>
            <button type="button" className="text-sm text-[#6A7B4D] hover:text-[#4B5B3A] transition-colors font-medium">
              {t.forgot}
            </button>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            <User className="w-5 h-5" />
            {loading ? t.signing : t.submit}
          </Button>

          <div className="p-4 bg-[#6A7B4D]/8 rounded-xl border border-[#6A7B4D]/15">
            <p className="text-xs font-semibold text-[#4B5B3A] uppercase tracking-wide mb-2.5">{t.demo}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5A6B50]">{t.admin}</span>
                <code className="bg-white px-2 py-0.5 rounded-lg text-[#2E3A24] border border-[#4E4631]/10">admin@milstock.local</code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5A6B50]">{t.kitchen}</span>
                <code className="bg-white px-2 py-0.5 rounded-lg text-[#2E3A24] border border-[#4E4631]/10">kitchen@milstock.local</code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5A6B50]">{t.frontend}</span>
                <code className="bg-white px-2 py-0.5 rounded-lg text-[#2E3A24] border border-[#4E4631]/10">testadmin@milstock.local</code>
              </div>
              <p className="text-xs text-[#5A6B50] mt-1.5">{t.passwordDemo}</p>
              <p className="text-xs text-[#5A6B50]">{t.testPassword}</p>
            </div>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Globe className="w-4 h-4 text-[#5A6B50]" />
          <Link to={t.targetLogin} className="text-sm text-[#4B5B3A] hover:text-[#6A7B4D] font-medium transition-colors">
            {t.switchForm}
          </Link>
        </div>
      </div>
    </div>
  </div>;
};

const LoginPage = () => <LoginPageView />;

export {
  LoginPage,
  LoginPageView
};
