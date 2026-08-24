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
import type { ReactElement } from 'react';

export interface PdfStat {
  label: string;
  value: string | number;
}

export interface PdfTabela {
  titulo: string;
  colunas: string[];
  linhas: (string | number)[][];
  /** Alinhamento por coluna; default: primeira à esquerda, demais à direita. */
  alinhamentos?: ('left' | 'right')[];
}

interface RelatorioPdfOptions {
  titulo: string;
  periodoLabel: string;
  filtroLabel?: string;
  emissor?: string | null;
  stats: PdfStat[];
  tabelas: PdfTabela[];
  filename: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    paddingBottom: 48,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
    lineHeight: 1.4,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  statBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 8,
    minWidth: 110,
    flexGrow: 1,
  },
  statLabel: {
    fontSize: 7,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  tableTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#374151',
    marginTop: 14,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#9CA3AF',
    paddingBottom: 3,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  tableRowZebra: {
    backgroundColor: '#F9FAFB',
  },
  cell: {
    fontSize: 8,
    paddingRight: 6,
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
});

function TabelaPdf({ tabela }: { tabela: PdfTabela }) {
  const alinhamento = (index: number): 'left' | 'right' =>
    tabela.alinhamentos?.[index] ?? (index === 0 ? 'left' : 'right');

  return (
    <View>
      <Text style={styles.tableTitle}>{tabela.titulo}</Text>
      <View style={styles.tableHeader}>
        {tabela.colunas.map((coluna, index) => (
          <Text
            key={coluna}
            style={[
              styles.tableHeaderCell,
              { flex: 1, textAlign: alinhamento(index) },
            ]}
          >
            {coluna}
          </Text>
        ))}
      </View>
      {tabela.linhas.length === 0 ? (
        <Text style={[styles.cell, { color: '#6B7280', paddingVertical: 3 }]}>
          Sem dados no período selecionado.
        </Text>
      ) : (
        tabela.linhas.map((linha, linhaIndex) => (
          <View
            key={linhaIndex}
            style={
              linhaIndex % 2 === 1
                ? [styles.tableRow, styles.tableRowZebra]
                : styles.tableRow
            }
            wrap={false}
          >
            {linha.map((celula, celulaIndex) => (
              <Text
                key={celulaIndex}
                style={[
                  styles.cell,
                  { flex: 1, textAlign: alinhamento(celulaIndex) },
                ]}
              >
                {String(celula)}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

function RelatorioDocument({
  titulo,
  periodoLabel,
  filtroLabel,
  emissor,
  stats,
  tabelas,
}: Omit<RelatorioPdfOptions, 'filename'>) {
  return (
    <Document title={titulo}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{titulo}</Text>
        <Text style={styles.subtitle}>
          {periodoLabel}
          {filtroLabel ? ` · ${filtroLabel}` : ''} · SEMAS Casa Abrigo
          Temporário
        </Text>

        {stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{String(stat.value)}</Text>
              </View>
            ))}
          </View>
        )}

        {tabelas.map((tabela) => (
          <TabelaPdf key={tabela.titulo} tabela={tabela} />
        ))}

        <Text style={styles.footer} fixed>
          Emitido por {emissor?.trim() || 'operador não identificado'} em{' '}
          {new Date().toLocaleString('pt-BR')}.
        </Text>
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

export function openRelatorioPdf(options: RelatorioPdfOptions) {
  const { filename, ...documento } = options;
  return openPdf(<RelatorioDocument {...documento} />, filename);
}
