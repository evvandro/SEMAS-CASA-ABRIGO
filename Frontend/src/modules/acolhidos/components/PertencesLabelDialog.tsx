import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import type { Acolhido, Sector } from '../types';
import { formatEntryDateTime } from '../utils/date';

interface LabelPayload {
  shelterName: string;
  belongings: string;
}

interface Props {
  row: Acolhido | null;
  sector?: Sector;
  onClose: () => void;
  onGenerate: (payload: LabelPayload) => Promise<void>;
}

const DEFAULT_SHELTER_NAME = 'Casa Abrigo Temporário';

function valueOrFallback(value?: string | null) {
  return value?.trim() || 'Não informado';
}

export function PertencesLabelDialog({
  row,
  sector,
  onClose,
  onGenerate,
}: Props) {
  const [shelterName, setShelterName] = useState(DEFAULT_SHELTER_NAME);
  const [belongings, setBelongings] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!row) return;
    setShelterName(DEFAULT_SHELTER_NAME);
    setBelongings(row.belongings ?? '');
    setError(null);
  }, [row]);

  const location = useMemo(() => {
    if (!row) return 'Não informado';
    const parts = [row.bed, sector?.name].filter(Boolean);
    return parts.length ? parts.join(' / ') : 'Não informado';
  }, [row, sector]);

  const handleGenerate = async () => {
    if (!row) return;

    setSubmitting(true);
    setError(null);

    try {
      await onGenerate({
        shelterName: shelterName.trim() || DEFAULT_SHELTER_NAME,
        belongings: belongings.trim(),
      });
    } catch {
      setError('Não foi possível salvar e gerar a etiqueta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={!!row}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalOfferIcon sx={{ fontSize: 20 }} />
        Etiqueta de pertences
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.25} sx={{ pt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Abrigo"
            value={shelterName}
            onChange={(event) => setShelterName(event.target.value)}
            fullWidth
            disabled={submitting}
          />

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', fontWeight: 700 }}
            >
              Prévia dos dados da etiqueta
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1}>
              <PreviewLine
                label="Data de entrada"
                value={formatEntryDateTime(
                  row?.entry,
                  row?.entryTime,
                  'Não informado',
                )}
              />
              <PreviewLine label="Nome" value={valueOrFallback(row?.name)} />
              <PreviewLine label="Leito / setor" value={location} />
            </Stack>
          </Box>

          <TextField
            label="Item / pertences"
            value={belongings}
            onChange={(event) => setBelongings(event.target.value)}
            fullWidth
            multiline
            minRows={4}
            disabled={submitting}
            placeholder="Ex.: mochila azul, sacola com roupas, documentos pessoais"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={submitting}
          startIcon={<PictureAsPdfIcon />}
        >
          {submitting ? 'Gerando...' : 'Salvar e gerar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}
