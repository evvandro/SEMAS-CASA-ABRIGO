import { Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportTemplate } from './ReportTemplate';
import type { ReportColumn } from './ReportTemplate';

interface ExportPDFButtonProps {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  filename: string;
  orientation?: 'portrait' | 'landscape';
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  disabled?: boolean;
}

export const ExportPDFButton = ({
  title,
  subtitle,
  columns,
  data,
  filename,
  orientation = 'portrait',
  variant = 'outlined',
  color = 'primary',
  disabled = false,
}: ExportPDFButtonProps) => {
  return (
    <PDFDownloadLink
      document={
        <ReportTemplate
          title={title}
          subtitle={subtitle}
          columns={columns}
          data={data}
          orientation={orientation}
        />
      }
      fileName={filename}
      style={{ textDecoration: 'none' }}
    >
      {/* We use an internal function to get loading state from PDFDownloadLink */}
      {({ loading }) => (
        <Button
          variant={variant}
          color={color}
          startIcon={<PictureAsPdfIcon />}
          disabled={disabled || loading || data.length === 0}
        >
          {loading ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};
