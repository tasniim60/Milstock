const getColumnValue = (row, column) => {
  if (typeof column.value === "function") return column.value(row);
  if (column.key) return row?.[column.key];
  return "";
};

const formatExportValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value);
};

const csvSafeValue = (value) => {
  const text = formatExportValue(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const getDatedFilename = (prefix, extension = "csv") => {
  const date = new Date().toISOString().slice(0, 10);
  const cleanPrefix = String(prefix || "export").replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${cleanPrefix || "export"}-${date}.${extension}`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportToCsv = ({ filename, columns, rows }) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  if (!safeRows.length) {
    window.alert("No data available to export.");
    return false;
  }

  const header = safeColumns.map((column) => csvSafeValue(column.header || column.label || column.key)).join(",");
  const body = safeRows.map((row) => safeColumns.map((column) => csvSafeValue(getColumnValue(row, column))).join(","));
  const csv = `\uFEFF${[header, ...body].join("\r\n")}`;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename || getDatedFilename("export", "csv"));
  return true;
};

const escapePdfText = (value) => formatExportValue(value)
  .replace(/\\/g, "\\\\")
  .replace(/\(/g, "\\(")
  .replace(/\)/g, "\\)")
  .replace(/\r?\n/g, " ");

const buildPdf = ({ title, columns, rows, orientation = "landscape" }) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];
  const width = orientation === "portrait" ? 595 : 842;
  const height = orientation === "portrait" ? 842 : 595;
  const margin = 36;
  const colWidth = (width - margin * 2) / Math.max(safeColumns.length, 1);
  const lines = [];
  let y = height - margin;
  let page = 1;

  const addLine = (text, x, size = 9) => {
    lines.push(`BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
  };
  const newPage = () => {
    page += 1;
    y = height - margin;
    lines.push(`BT /F1 8 Tf ${width - margin - 55} 20 Td (Page ${page}) Tj ET`);
  };

  addLine(title || "MilStock Export", margin, 16);
  y -= 18;
  addLine(`Generated: ${new Date().toLocaleString()}`, margin, 9);
  y -= 22;
  safeColumns.forEach((column, index) => addLine(column.header || column.label || column.key || "", margin + index * colWidth, 8));
  y -= 14;

  safeRows.forEach((row) => {
    if (y < margin + 20) newPage();
    safeColumns.forEach((column, index) => {
      const value = escapePdfText(getColumnValue(row, column)).slice(0, 42);
      addLine(value, margin + index * colWidth, 7);
    });
    y -= 12;
  });
  lines.push(`BT /F1 8 Tf ${width - margin - 55} 20 Td (Page 1) Tj ET`);

  const stream = lines.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
};

const exportToPdf = ({ title, filename, columns, rows, orientation }) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    window.alert("No data available to export.");
    return false;
  }
  const pdf = buildPdf({ title, columns, rows, orientation });
  downloadBlob(new Blob([pdf], { type: "application/pdf" }), filename || getDatedFilename("export", "pdf"));
  return true;
};

export {
  exportToCsv,
  exportToPdf,
  formatExportValue,
  getDatedFilename
};
