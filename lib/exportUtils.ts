export interface ExportColumn<T extends Record<string, unknown>> {
  key: keyof T & string;
  header: string;
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv<T extends Record<string, unknown>>(
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const raw = row[column.key];
          const value = raw === undefined || raw === null ? "" : String(raw);
          return escapeCsvValue(value);
        })
        .join(","),
    )
    .join("\n");

  return [header, body].filter(Boolean).join("\n");
}

function buildHtmlTable<T extends Record<string, unknown>>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const headerCells = columns.map((column) => `<th>${column.header}</th>`).join("");
  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const raw = row[column.key];
          const value = raw === undefined || raw === null ? "" : String(raw);
          return `<td>${value.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 18px; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
      th { background: #f8fafc; font-weight: 700; }
      tr:nth-child(even) td { background: #f8fafc; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportTableAsCsv<T extends Record<string, unknown>>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  downloadTextFile(filename, buildCsv(columns, rows), "text/csv;charset=utf-8");
}

export function exportTableAsExcel<T extends Record<string, unknown>>(
  filename: string,
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const html = buildHtmlTable(title, columns, rows);
  downloadTextFile(
    filename.endsWith(".xls") ? filename : `${filename.replace(/\.[^.]+$/, "")}.xls`,
    html,
    "application/vnd.ms-excel;charset=utf-8",
  );
}

export function exportTableAsPdf<T extends Record<string, unknown>>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const html = buildHtmlTable(title, columns, rows);
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    throw new Error("Pop-up blocked. Allow pop-ups to export as PDF.");
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
