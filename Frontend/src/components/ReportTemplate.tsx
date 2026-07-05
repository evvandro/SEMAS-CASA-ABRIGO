import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import dayjs from 'dayjs';

// Estilos com as cores da marca (baseado no theme.ts: brand.main = '#176f7c')
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottom: '2pt solid #176f7c',
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    textAlign: 'right',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#176f7c',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#60767c',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: '#60767c',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dce7e7',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowZebrada: {
    flexDirection: 'row',
    backgroundColor: '#f6f8f8',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dce7e7',
    backgroundColor: '#176f7c',
    justifyContent: 'center',
    padding: 5,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dce7e7',
    justifyContent: 'center',
    padding: 5,
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableCell: {
    margin: 'auto',
    fontSize: 9,
    color: '#12313a',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1pt solid #dce7e7',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#60767c',
  },
});

export interface ReportColumn {
  header: string;
  key: string;
  width?: string; // e.g. '20%'
}

export interface ReportTemplateProps {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  orientation?: 'portrait' | 'landscape';
}

export const ReportTemplate = ({
  title,
  subtitle,
  columns,
  data,
  orientation = 'portrait',
}: ReportTemplateProps) => {
  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.date}>
              Emitido em: {dayjs().format('DD/MM/YYYY HH:mm')}
            </Text>
            <Text style={styles.date}>SEMAS - Casa Abrigo</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow} fixed>
            {columns.map((col, index) => (
              <View
                key={index}
                style={[
                  styles.tableColHeader,
                  { width: col.width || `${100 / columns.length}%` },
                ]}
              >
                <Text style={styles.tableCellHeader}>{col.header}</Text>
              </View>
            ))}
          </View>

          {/* Table Body */}
          {data.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={
                rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowZebrada
              }
              wrap={false}
            >
              {columns.map((col, colIndex) => {
                let cellValue = row[col.key];
                if (cellValue === null || cellValue === undefined) {
                  cellValue = '-';
                } else if (typeof cellValue !== 'string' && typeof cellValue !== 'number') {
                  cellValue = String(cellValue);
                }

                return (
                  <View
                    key={colIndex}
                    style={[
                      styles.tableCol,
                      { width: col.width || `${100 / columns.length}%` },
                    ]}
                  >
                    <Text style={styles.tableCell}>{cellValue}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Sistema de Gestão - Casa Abrigo</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};
