import { cn } from "@/lib/utils";

export function DataTable({
  columns,
  rows,
  footer,
  className,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-auto", className)}>
      <table className="min-w-full border-collapse text-left text-[13px]">
        <thead className="sticky top-0 bg-[#f7f8f5]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-line px-3 py-2 text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-8 text-center text-muted" colSpan={columns.length}>
                No records.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-b border-line hover:bg-[#fafbf8]">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="h-10 px-3 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer}
    </div>
  );
}
