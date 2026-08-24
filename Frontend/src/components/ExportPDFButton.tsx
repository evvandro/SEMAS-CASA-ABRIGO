import { useState } from 'react';
import { Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import type { ReportColumn } from './ReportTemplate';

interface ExportPDFButtonProps<T> {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  data: T[];
  filename: string;
  orientation?: 'portrait' | 'landscape';
  variant?: 'text' | 'outlined' | 'contained';
  color?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning';
  disabled?: boolean;
}

export const ExportPDFButton = <T,>({
  title,
  subtitle,
  columns,
  data,
  filename,
  orientation = 'portrait',
  variant = 'outlined',
  color = 'primary',
  disabled = false,
}: ExportPDFButtonProps<T>) => {
  const [loading, setLoading] = useState(false);

  // Geração sob demanda: o @react-pdf/renderer (chunk pesado) só é baixado no
  // clique, e o documento é montado uma única vez — não a cada render da página
  // (o PDFDownloadLink re-gerava o PDF sempre que os dados mudavam).
  const handleExport = async () => {
    setLoading(true);

    try {
      const [{ pdf }, { ReportTemplate }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ReportTemplate'),
      ]);

      const blob = await pdf(
        <ReportTemplate
          title={title}
          subtitle={subtitle}
          columns={columns}
          data={data}
          orientation={orientation}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');

      if (!opened) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      startIcon={<PictureAsPdfIcon />}
      disabled={disabled || loading || data.length === 0}
      onClick={() => void handleExport()}
    >
      {loading ? 'Gerando PDF...' : 'Exportar PDF'}
    </Button>
  );
};
