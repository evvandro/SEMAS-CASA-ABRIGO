import {
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { ReactNode } from 'react';
import { downloadCsv } from '../../../utils/csv';

export interface ReportColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  /** Valor cru da célula — usado na tabela, no CSV e no PDF. */
  value: (row: T) => string | number;
  /** Renderização customizada opcional (a tabela usa `value` como fallback). */
  render?: (row: T) => ReactNode;
}

interface ReportTableProps<T> {
  title: string;
  columns: ReportColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
  /** Quando presente, exibe o botão de exportar esta tabela como CSV. */
  csvFilename?: string;
  maxHeight?: number;
}

export function ReportTable<T>({
  title,
  columns,
  rows,
  rowKey,
  emptyMessage = 'Sem dados no período selecionado.',
  csvFilename,
  maxHeight = 360,
}: ReportTableProps<T>) {
  return (
    <Paper
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.25 }}
      >
        <Typography variant="subtitle2">{title}</Typography>
        {csvFilename && rows.length > 0 && (
          <Tooltip title="Baixar CSV desta tabela">
            <IconButton
              size="small"
              aria-label={`Baixar CSV: ${title}`}
              onClick={() =>
                downloadCsv(
                  csvFilename,
                  columns.map((column) => ({
                    header: column.label,
                    value: column.value,
                  })),
                  rows,
                )
              }
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      {rows.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, pb: 2 }}
        >
          {emptyMessage}
        </Typography>
      ) : (
        <TableContainer sx={{ maxHeight }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align ?? 'left'}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={rowKey(row, index)} hover>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align ?? 'left'}>
                      {column.render ? column.render(row) : column.value(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
