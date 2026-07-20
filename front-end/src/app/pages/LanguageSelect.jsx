import { useNavigate } from "react-router";
import { BrandLogo } from "../components/BrandLogo";

const LanguageSelect = () => {
  const navigate = useNavigate();

  return <div className="min-h-screen bg-gradient-to-br from-[#2E3A24] via-[#4B5B3A] to-[#6A7B4D] flex items-center justify-center p-8">
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMThjMCAzLjMxNC0yLjY4NiA2LTYgNnMtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTYgNiAyLjY4NiA2IDZ6Ii8+PC9nPjwvZz48L3N2Zz4=")`,
      }}
    />

    <div className="relative z-10 text-center">
      <div className="flex items-center justify-center gap-4 mb-12">
        <BrandLogo subtitle="Food Inventory Management System" />
      </div>

      <p className="text-white text-xl opacity-90 mb-10">Select your language / اختر لغتك</p>

      <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
        <button
          onClick={() => navigate("/login")}
          className="group w-64 p-7 bg-white bg-opacity-10 hover:bg-opacity-20 backdrop-blur-sm rounded-2xl border border-white border-opacity-20 hover:border-opacity-40 transition-all hover:scale-105 text-white"
        >
          <div className="text-sm mb-3 inline-flex rounded-full border border-white/30 px-3 py-1">EN</div>
          <h2 className="text-2xl font-bold mb-2">English</h2>
          <p className="text-sm opacity-75">Left-to-right layout</p>
          <div className="mt-4 h-0.5 w-0 group-hover:w-full bg-white opacity-50 transition-all duration-300" />
        </button>

        <button
          onClick={() => navigate("/ar/login")}
          className="group w-64 p-7 bg-white bg-opacity-10 hover:bg-opacity-20 backdrop-blur-sm rounded-2xl border border-white border-opacity-20 hover:border-opacity-40 transition-all hover:scale-105 text-white"
          style={{ fontFamily: "'Cairo', 'IBM Plex Sans Arabic', sans-serif" }}
        >
          <div className="text-sm mb-3 inline-flex rounded-full border border-white/30 px-3 py-1">AR</div>
          <h2 className="text-2xl font-bold mb-2">العربية</h2>
          <p className="text-sm opacity-75">تخطيط من اليمين إلى اليسار</p>
          <div className="mt-4 h-0.5 w-0 group-hover:w-full bg-white opacity-50 transition-all duration-300" />
        </button>
      </div>

      <p className="text-white text-sm opacity-50 mt-12">
        © 2026 MilStock. All rights reserved. • جميع الحقوق محفوظة.
      </p>
    </div>
  </div>;
};

export {
  LanguageSelect
};
