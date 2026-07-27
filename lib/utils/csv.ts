function escapeCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Record<string, unknown>[], headers?: string[]) {
  if (rows.length === 0) return "";

  const columns = headers ?? Object.keys(rows[0]);
  const head = columns.map(escapeCell).join(";");
  const body = rows
    .map((row) => columns.map((column) => escapeCell(row[column])).join(";"))
    .join("\n");

  return `${head}\n${body}`;
}

/** Descarrega o CSV no browser. O BOM garante os acentos no Excel. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
