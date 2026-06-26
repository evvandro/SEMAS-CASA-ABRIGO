import { useState, useMemo, type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  TableContainer,
  Paper,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrintIcon from '@mui/icons-material/Print';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LogoutIcon from '@mui/icons-material/Logout';
import { AlertBadges } from './AlertBadges';
import { SectorPill } from './SectorPill';
import type { Acolhido, AcolhidoAction, Sector } from '../types';
import { dateSortValue, formatEntryDateTime } from '../utils/date';

type SortKey = 'id' | 'name' | 'age' | 'sectorId' | 'entry';
type Sort = { by: SortKey; dir: 'asc' | 'desc' };

interface Props {
  rows: Acolhido[];
  sectorMap: Record<string, Sector>;
  onRowClick: (row: Acolhido) => void;
  onAction: (action: AcolhidoAction, row: Acolhido) => void;
}

export function AcolhidosTable({
  rows,
  sectorMap,
  onRowClick,
  onAction,
}: Props) {
  const [sort, setSort] = useState<Sort>({ by: 'entry', dir: 'desc' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      let av: string | number = a[sort.by];
      let bv: string | number = b[sort.by];
      if (sort.by === 'sectorId') {
        av = sectorMap[a.sectorId]?.name ?? '';
        bv = sectorMap[b.sectorId]?.name ?? '';
      }
      if (sort.by === 'entry') {
        av = dateSortValue(a.entry, a.entryTime);
        bv = dateSortValue(b.entry, b.entryTime);
      }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return out;
  }, [rows, sort, sectorMap]);

  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (by: SortKey) => {
    setSort((s) =>
      s.by === by
        ? { by, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { by, dir: 'asc' },
    );
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <TableContainer>
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
          <TableRow>
            <SortHeaderCell id="id" sort={sort} onSort={toggleSort} width={110}>
              Prontuário
            </SortHeaderCell>
            <SortHeaderCell id="name" sort={sort} onSort={toggleSort}>
              Nome
            </SortHeaderCell>
            <SortHeaderCell id="age" sort={sort} onSort={toggleSort} width={80}>
              Idade
            </SortHeaderCell>
            <SortHeaderCell
              id="sectorId"
              sort={sort}
              onSort={toggleSort}
              width={180}
            >
              Setor
            </SortHeaderCell>
            <TableCell sx={{ width: 140 }}>Alertas</TableCell>
            <SortHeaderCell
              id="entry"
              sort={sort}
              onSort={toggleSort}
              width={140}
            >
              Entrada
            </SortHeaderCell>
            <TableCell sx={{ width: 48 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {pageRows.map((r) => (
            <TableRow
              key={r.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => onRowClick(r)}
            >
              <TableCell
                sx={{
                  fontFamily: 'ui-monospace, monospace',
                  color: 'text.secondary',
                  fontSize: 12.5,
                }}
              >
                {r.id}
              </TableCell>
              <TableCell>
                <Box sx={{ fontWeight: 500 }}>{r.name}</Box>
                <Box sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                  CPF {r.cpf}
                </Box>
                {r.familyCode ? (
                  <Chip
                    size="small"
                    label={`${r.familyCode} | ${r.familyResponsible ?? 'Familia'}`}
                    sx={{ mt: 0.75 }}
                  />
                ) : null}
              </TableCell>
              <TableCell>{r.age} anos</TableCell>
              <TableCell>
                <SectorPill sectorId={r.sectorId} sectorMap={sectorMap} />
              </TableCell>
              <TableCell>
                <AlertBadges alerts={r.alerts} />
              </TableCell>
              <TableCell
                sx={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12.5,
                  color: 'text.secondary',
                }}
              >
                {formatEntryDateTime(r.entry, r.entryTime)}
              </TableCell>
              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                <RowActionsMenu row={r} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}
              >
                Nenhum acolhido encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Por página"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} de ${count}`
        }
      />
    </Paper>
  );
}

function SortHeaderCell({
  id,
  children,
  width,
  sort,
  onSort,
}: {
  id: SortKey;
  children: ReactNode;
  width?: number;
  sort: Sort;
  onSort: (by: SortKey) => void;
}) {
  return (
    <TableCell sx={{ width }}>
      <TableSortLabel
        active={sort.by === id}
        direction={sort.by === id ? sort.dir : 'asc'}
        onClick={() => onSort(id)}
      >
        {children}
      </TableSortLabel>
    </TableCell>
  );
}

function RowActionsMenu({
  row,
  onAction,
}: {
  row: Acolhido;
  onAction: Props['onAction'];
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  const handle = (a: AcolhidoAction) => () => {
    onAction(a, row);
    close();
  };
  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        slotProps={{
          paper: { variant: 'outlined', sx: { mt: 0.5, minWidth: 200 } },
        }}
      >
        <MenuItem onClick={handle('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver ficha completa</ListItemText>
        </MenuItem>
        <MenuItem onClick={handle('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar rápido</ListItemText>
        </MenuItem>
        <MenuItem onClick={handle('editFull')}>
          <ListItemIcon>
            <AssignmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar ficha detalhada</ListItemText>
        </MenuItem>
        <MenuItem onClick={handle('print')}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Gerar PDF da ficha</ListItemText>
        </MenuItem>
        <MenuItem onClick={handle('label')}>
          <ListItemIcon>
            <LocalOfferIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Etiqueta de pertences</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handle('exit')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Registrar saída</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
