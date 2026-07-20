import { useNavigate } from "react-router";
import { Button } from "../../components/Button";
import { Home, ArrowRight, ShieldAlert } from "lucide-react";
const AccessDeniedAr = () => {
  const navigate = useNavigate();
  return <div
    dir="rtl"
    className="min-h-screen bg-[#ECEEE2] flex items-center justify-center p-8 relative overflow-hidden"
    style={{ fontFamily: "'Cairo', 'IBM Plex Sans Arabic', sans-serif" }}
  >
      {
    /* Background grid texture */
  }
      <div
    className="absolute inset-0 opacity-[0.03]"
    style={{
      backgroundImage: `linear-gradient(#2E3A24 1px, transparent 1px), linear-gradient(90deg, #2E3A24 1px, transparent 1px)`,
      backgroundSize: "40px 40px"
    }}
  />
      <div className="relative z-10 max-w-md text-center">
        <div className="inline-flex p-5 bg-[#D4183D]/8 rounded-2xl mb-8 border border-[#D4183D]/15">
          <ShieldAlert className="w-14 h-14 text-[#D4183D]" />
        </div>
        <p className="text-[120px] font-black text-[#D4183D]/8 leading-none select-none -mb-4">403</p>
        <h1 className="text-[#2E3A24] mb-3">وصول مرفوض</h1>
        <p className="text-[#5A6B50] mb-2 leading-relaxed">
          ليس لديك صلاحية للوصول إلى هذا المورد.
        </p>
        <p className="text-sm text-[#5A6B50]/70 mb-8">
          إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مسؤول النظام.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="w-4 h-4" />
            الرئيسية
          </Button>
        </div>
      </div>
    </div>;
};
export {
  AccessDeniedAr
};
