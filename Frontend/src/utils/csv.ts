export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCell(raw: string | number | null | undefined): string {
  const text = raw == null ? '' : String(raw);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Gera e baixa um CSV com BOM UTF-8 e separador ';' (aberto direto pelo
 * Excel pt-BR com acentos corretos).
 */
export function downloadCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[],
): void {
  const lines = [
    columns.map((column) => escapeCell(column.header)).join(';'),
    ...rows.map((row) =>
      columns.map((column) => escapeCell(column.value(row))).join(';'),
    ),
  ];

  const blob = new Blob(['﻿' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
