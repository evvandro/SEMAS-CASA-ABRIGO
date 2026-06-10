/* eslint-disable react-refresh/only-export-components */
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { ReactElement, ReactNode } from 'react';
import type { Acolhido, AlertCategory, Sector } from '../types';
import { formatDateOnly, formatEntryDateTime } from './date';

const alertLabels: Record<AlertCategory, string> = {
  pcd: 'Pessoa com deficiencia',
  gestante: 'Gestante',
  cronica: 'Doenca cronica',
  idoso: 'Idoso 60+',
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
    lineHeight: 1.45,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 18,
  },
  section: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#374151',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    width: '48%',
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 500,
  },
  box: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 8,
    minHeight: 42,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 32,
    right: 32,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    color: '#6B7280',
    fontSize: 8,
  },
  labelPage: {
    padding: 14,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  labelCard: {
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 6,
    padding: 10,
    height: '100%',
  },
  labelTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    textAlign: 'center',
  },
  labelRow: {
    marginBottom: 5,
  },
  labelRowName: {
    fontSize: 7,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  labelRowValue: {
    fontSize: 9,
    fontWeight: 600,
  },
  itemBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 6,
    marginTop: 2,
    minHeight: 34,
  },
});

function valueOrFallback(value?: string | number | null) {
  const normalized = value == null ? '' : String(value).trim();
  return normalized || 'Nao informado';
}

function sectorLabel(sector?: Sector) {
  if (!sector) return 'Nao informado';
  return sector.sub ? `${sector.name} - ${sector.sub}` : sector.name;
}

function alertsLabel(row: Acolhido) {
  if (!row.alerts.length) return 'Nenhuma condicao prioritaria registrada';
  return row.alerts.map((alert) => alertLabels[alert]).join(', ');
}

function sanitizeFilePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{valueOrFallback(value)}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function AcolhidoFichaDocument({
  row,
  sector,
  operatorName,
}: {
  row: Acolhido;
  sector?: Sector;
  operatorName?: string | null;
}) {
  return (
    <Document title={`Ficha do acolhido ${row.id}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Ficha do acolhido</Text>
        <Text style={styles.subtitle}>
          Documento gerado pelo sistema SEMAS Casa Abrigo Temporario.
        </Text>

        <Section title="Identificacao">
          <View style={styles.grid}>
            <Field label="Prontuario / pulseira" value={row.id} />
            <Field label="Nome completo" value={row.name} />
            <Field label="CPF" value={row.cpf} />
            <Field
              label="Data de nascimento"
              value={formatDateOnly(row.birthDate, 'Nao informado')}
            />
            <Field label="Idade" value={`${row.age} anos`} />
            <Field label="Genero" value={row.gender} />
            <Field label="Telefone" value={row.phone} />
            <Field label="Familia / prontuario" value={row.familyCode} />
          </View>
        </Section>

        <Section title="Acolhimento">
          <View style={styles.grid}>
            <Field
              label="Data e hora de entrada"
              value={formatEntryDateTime(
                row.entry,
                row.entryTime,
                'Nao informado',
              )}
            />
            <Field label="Setor" value={sectorLabel(sector)} />
            <Field label="Leito" value={row.bed} />
            <Field label="Responsavel familiar" value={row.familyResponsible} />
            <Field label="Operador / emissor" value={operatorName} />
          </View>
        </Section>

        <Section title="Perfil preferencial">
          <Text style={styles.value}>{alertsLabel(row)}</Text>
        </Section>

        <Section title="Observacoes">
          <View style={styles.box}>
            <Text>{valueOrFallback(row.notes)}</Text>
          </View>
        </Section>

        <Section title="Pertences registrados">
          <View style={styles.box}>
            <Text>{valueOrFallback(row.belongings)}</Text>
          </View>
        </Section>

        <Text style={styles.footer}>
          Emitido por {valueOrFallback(operatorName)} em{' '}
          {new Date().toLocaleString('pt-BR')}.
        </Text>
      </Page>
    </Document>
  );
}

function PertencesLabelDocument({
  row,
  sector,
  shelterName,
  belongings,
}: {
  row: Acolhido;
  sector?: Sector;
  shelterName: string;
  belongings: string;
}) {
  const location = [row.bed, sectorLabel(sector)]
    .filter((item) => item && item !== 'Nao informado')
    .join(' / ');

  return (
    <Document title={`Etiqueta de pertences ${row.id}`}>
      <Page size={[288, 180]} style={styles.labelPage}>
        <View style={styles.labelCard}>
          <Text style={styles.labelTitle}>Etiqueta de pertences</Text>
          <View style={styles.labelRow}>
            <Text style={styles.labelRowName}>Abrigo</Text>
            <Text style={styles.labelRowValue}>
              {valueOrFallback(shelterName)}
            </Text>
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.labelRowName}>Data de entrada</Text>
            <Text style={styles.labelRowValue}>
              {formatEntryDateTime(row.entry, row.entryTime, 'Nao informado')}
            </Text>
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.labelRowName}>Nome</Text>
            <Text style={styles.labelRowValue}>
              {valueOrFallback(row.name)}
            </Text>
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.labelRowName}>Leito / setor</Text>
            <Text style={styles.labelRowValue}>
              {valueOrFallback(location)}
            </Text>
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.labelRowName}>Item</Text>
            <View style={styles.itemBox}>
              <Text>{valueOrFallback(belongings)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

async function openPdf(
  pdfDocument: ReactElement<DocumentProps>,
  filename: string,
) {
  const blob = await pdf(pdfDocument).toBlob();
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank', 'noopener,noreferrer');

  if (!opened) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function openAcolhidoFichaPdf(
  row: Acolhido,
  sector?: Sector,
  operatorName?: string | null,
) {
  return openPdf(
    <AcolhidoFichaDocument
      row={row}
      sector={sector}
      operatorName={operatorName}
    />,
    `ficha-${sanitizeFilePart(row.id)}.pdf`,
  );
}

export function openPertencesLabelPdf(
  row: Acolhido,
  sector: Sector | undefined,
  shelterName: string,
  belongings: string,
) {
  return openPdf(
    <PertencesLabelDocument
      row={row}
      sector={sector}
      shelterName={shelterName}
      belongings={belongings}
    />,
    `etiqueta-pertences-${sanitizeFilePart(row.id)}.pdf`,
  );
}
