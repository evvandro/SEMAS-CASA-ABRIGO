import type { ReportColumn } from '../components/ReportTable';
import type { PdfTabela } from './relatorioPdf';

export function toPdfTabela<T>(
  titulo: string,
  columns: ReportColumn<T>[],
  rows: T[],
): PdfTabela {
  return {
    titulo,
    colunas: columns.map((column) => column.label),
    linhas: rows.map((row) => columns.map((column) => column.value(row))),
    alinhamentos: columns.map((column) =>
      column.align === 'right' ? 'right' : 'left',
    ),
  };
}

export function formatPercent(taxa: number | null): string {
  return taxa == null ? '—' : `${Math.round(taxa * 100)}%`;
}
