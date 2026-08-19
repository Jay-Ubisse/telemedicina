/**
 * Exportação para Excel.
 *
 * O protótipo exportava um CSV separado por `;`, que o Excel abre com colunas
 * desalinhadas conforme as definições regionais de cada máquina — foi o que o
 * relatório de testes apanhou. Passa a gerar um livro SpreadsheetML 2003
 * (`.xls`), formato XML aberto que o Excel e o LibreOffice abrem directamente,
 * já com folhas separadas, cabeçalhos a negrito, colunas dimensionadas e
 * números tratados como números.
 */

export type SheetValue = string | number | null | undefined;

export type Sheet = {
  name: string;
  columns: { header: string; width?: number }[];
  rows: SheetValue[][];
  /** Linhas de contexto colocadas acima da tabela (título, data, totais). */
  notes?: string[];
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Caracteres de controlo não são válidos em XML.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

function cell(value: SheetValue, styleId?: string) {
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";

  if (value === null || value === undefined || value === "") {
    return `<Cell${style}/>`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell${style}><Data ss:Type="Number">${value}</Data></Cell>`;
  }

  return `<Cell${style}><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`;
}

/** Nome de folha aceite pelo Excel: sem `:\/?*[]` e no máximo 31 caracteres. */
function sheetName(name: string) {
  return escapeXml(name.replace(/[\\/?*[\]:]/g, "-").slice(0, 31));
}

export function toExcelWorkbook(sheets: Sheet[]) {
  const body = sheets
    .map((sheet) => {
      const notes = (sheet.notes ?? [])
        .map((note) => `<Row>${cell(note, "sNote")}</Row>`)
        .join("");

      const spacer = sheet.notes?.length ? "<Row/>" : "";

      const columns = sheet.columns
        .map(
          (column) =>
            `<Column ss:AutoFitWidth="0" ss:Width="${column.width ?? 110}"/>`,
        )
        .join("");

      const header = `<Row ss:Height="20">${sheet.columns
        .map((column) => cell(column.header, "sHeader"))
        .join("")}</Row>`;

      const rows = sheet.rows
        .map((row) => `<Row>${row.map((value) => cell(value)).join("")}</Row>`)
        .join("");

      return `<Worksheet ss:Name="${sheetName(sheet.name)}">
<Table ss:ExpandedColumnCount="${sheet.columns.length}" ss:ExpandedRowCount="${
        sheet.rows.length + (sheet.notes?.length ?? 0) + 4
      }" x:FullColumns="1" x:FullRows="1">
${columns}${notes}${spacer}${header}${rows}
</Table>
<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
<FreezePanes/><FrozenNoSplit/><SplitHorizontal>${
        (sheet.notes?.length ?? 0) + (sheet.notes?.length ? 2 : 1)
      }</SplitHorizontal><TopRowBottomPane>${
        (sheet.notes?.length ?? 0) + (sheet.notes?.length ? 2 : 1)
      }</TopRowBottomPane><ActivePane>2</ActivePane>
</WorksheetOptions>
</Worksheet>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
<Author>HGM TelePediatria</Author>
<Company>Hospital Geral de Mavalane</Company>
</DocumentProperties>
<Styles>
<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
<Style ss:ID="sHeader"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0B6BB5" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
<Style ss:ID="sNote"><Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#4A5A6A"/></Style>
</Styles>
${body}
</Workbook>`;
}

/** Descarrega o livro no browser. */
export function downloadExcel(filename: string, workbook: string) {
  const blob = new Blob([`\uFEFF${workbook}`], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
