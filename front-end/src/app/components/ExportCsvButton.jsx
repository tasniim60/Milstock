import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileText } from "lucide-react";
import { Button } from "./Button";
import { exportToCsv, exportToPdf, getDatedFilename } from "../lib/exportUtils";
import { api } from "../lib/api";

const ExportCsvButton = ({
  rows,
  columns,
  filenamePrefix,
  filename,
  title,
  children = "Export",
  size = "sm",
  className
}) => {
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const isArabic = typeof children === "string" && /[\u0600-\u06FF]/.test(children);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const logExport = (format, success) => {
    api.auditLogs.create({
      action: `export_${format}`,
      module: "export",
      description: `${format.toUpperCase()} export ${success ? "completed" : "attempted"} for ${filenamePrefix || "data"}`,
      new_data: { filenamePrefix, rows: Array.isArray(rows) ? rows.length : 0 }
    }).catch(() => {});
  };

  const handleExport = (format) => {
    setExporting(true);
    setOpen(false);
    try {
      const success = format === "pdf"
        ? exportToPdf({
          title: title || children || "MilStock Export",
          filename: filename?.replace(/\.csv$/i, ".pdf") || getDatedFilename(filenamePrefix, "pdf"),
          columns,
          rows,
          orientation: "landscape"
        })
        : exportToCsv({
          filename: filename || getDatedFilename(filenamePrefix, "csv"),
          columns,
          rows
        });
      logExport(format, success);
    } finally {
      window.setTimeout(() => setExporting(false), 150);
    }
  };

  return <div className="relative inline-flex" ref={menuRef}>
    <Button
      variant="outline"
      size={size}
      className={className}
      onClick={() => setOpen((current) => !current)}
      disabled={exporting}
    >
      <Download className="w-3.5 h-3.5" />
      {exporting ? "Exporting..." : children}
      <ChevronDown className="w-3.5 h-3.5" />
    </Button>
    {open && <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-[#4E4631]/10 bg-white p-1 shadow-xl">
      <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#2E3A24] hover:bg-[#ECEEE2]" onClick={() => handleExport("csv")}>
        <Download className="w-4 h-4" />
        {isArabic ? "تصدير CSV" : "Export CSV"}
      </button>
      <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#2E3A24] hover:bg-[#ECEEE2]" onClick={() => handleExport("pdf")}>
        <FileText className="w-4 h-4" />
        {isArabic ? "تصدير PDF" : "Export PDF"}
      </button>
    </div>}
  </div>;
};

export {
  ExportCsvButton
};
