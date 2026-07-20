import { clsx } from "clsx";
function Table({
  columns,
  data,
  onRowClick,
  className,
  emptyMessage = "No items found"
}) {
  return <div className={clsx("overflow-x-auto rounded-2xl border border-[#4E4631]/10 bg-white", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#4E4631]/10 bg-[#ECEEE2]/60">
            {columns.map((column) => <th
    key={column.key}
    className="px-5 py-3.5 text-start text-xs font-semibold text-[#5A6B50] uppercase tracking-wide"
  >
                {column.header}
              </th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#4E4631]/6">
          {data.map((row, index) => <tr
    key={index}
    onClick={() => onRowClick?.(row)}
    className={clsx(
      "transition-colors",
      onRowClick && "cursor-pointer hover:bg-[#ECEEE2]/50"
    )}
  >
              {columns.map((column) => <td key={column.key} className="px-5 py-3.5 text-sm text-[#2E3A24] text-start">
                  {column.render ? column.render(row) : row[column.key]}
                </td>)}
            </tr>)}
          {data.length === 0 && <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-[#5A6B50]">
                {emptyMessage}
              </td>
            </tr>}
        </tbody>
      </table>
    </div>;
}
export {
  Table
};
