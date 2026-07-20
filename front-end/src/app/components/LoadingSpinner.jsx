import { Shield } from "lucide-react";
const LoadingSpinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-9 h-9 border-[3px]",
    lg: "w-14 h-14 border-4"
  };
  return <div className="flex items-center justify-center p-8">
      <div
    className={`${sizeClasses[size]} border-[#E0E1B7] border-t-[#6A7B4D] rounded-full animate-spin`}
  />
    </div>;
};
const LoadingPage = () => {
  return <div className="min-h-screen bg-[#ECEEE2] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex p-4 bg-[#4B5B3A]/10 rounded-2xl border border-[#4B5B3A]/15 mb-5">
          <Shield className="w-10 h-10 text-[#4B5B3A]" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-8 h-8 border-[3px] border-[#E0E1B7] border-t-[#6A7B4D] rounded-full animate-spin" />
          <p className="text-sm text-[#5A6B50]">Loading MilStock...</p>
        </div>
      </div>
    </div>;
};
export {
  LoadingPage,
  LoadingSpinner
};
