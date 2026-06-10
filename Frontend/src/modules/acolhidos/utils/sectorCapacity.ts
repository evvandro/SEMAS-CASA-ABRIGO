import type { Sector } from '../types';

type SectorCapacityInput = Pick<
  Sector,
  'active' | 'capacity' | 'occupied' | 'blockedBeds'
>;

export function normalizeBlockedBeds(beds?: string[] | null) {
  return Array.from(
    new Set((beds ?? []).map((bed) => normalizeBedKey(bed)).filter(Boolean)),
  );
}

export function bedKey(number: number) {
  return String(number);
}

export function bedLabel(number: number) {
  return `Leito ${String(number).padStart(2, '0')}`;
}

export function parseBedNumber(
  value: string | null | undefined,
  capacity: number,
) {
  const match = value?.match(/\d+/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= capacity
    ? parsed
    : null;
}

export function getBedKeyFromValue(
  value: string | null | undefined,
  capacity: number,
) {
  if (!value) return '';

  const parsed = parseBedNumber(value, capacity);
  return parsed ? bedKey(parsed) : normalizeBedKey(value);
}

export function buildBedOptions({
  capacity,
  active = true,
  blockedBeds = [],
  occupiedBeds = [],
  currentBed = '',
}: {
  capacity: number | null | undefined;
  active?: boolean;
  blockedBeds?: string[] | null;
  occupiedBeds?: Array<string | null | undefined>;
  currentBed?: string | null;
}) {
  const normalizedCapacity = toPositiveInteger(capacity ?? 0);
  const currentValue = currentBed?.trim() ?? '';
  const currentKey = getBedKeyFromValue(currentBed, normalizedCapacity);
  const blocked = new Set(
    normalizeBlockedBeds(blockedBeds).filter((blockedBed) =>
      isBedWithinCapacity(blockedBed, normalizedCapacity),
    ),
  );
  const occupied = new Set(
    occupiedBeds
      .map((bed) => getBedKeyFromValue(bed, normalizedCapacity))
      .filter((bed) => bed && isBedWithinCapacity(bed, normalizedCapacity)),
  );
  const options = Array.from({ length: normalizedCapacity }, (_, index) => {
    const number = index + 1;
    const value = bedKey(number);
    const isCurrent = value === currentKey;
    const unavailable = !active || blocked.has(value) || occupied.has(value);

    if (unavailable && !isCurrent) return null;

    return {
      value: isCurrent && currentValue ? currentValue : value,
      label: isCurrent ? `${bedLabel(number)} (atual)` : bedLabel(number),
    };
  }).filter((option): option is { value: string; label: string } =>
    Boolean(option),
  );

  if (
    currentValue &&
    currentKey &&
    !options.some(
      (option) =>
        getBedKeyFromValue(option.value, normalizedCapacity) === currentKey,
    )
  ) {
    options.unshift({ value: currentValue, label: `${currentValue} (atual)` });
  }

  return options;
}

export function getSectorCapacitySummary(sector: SectorCapacityInput) {
  const capacity = toPositiveInteger(sector.capacity);
  const occupied = toPositiveInteger(sector.occupied);
  const blockedBedKeys = new Set(
    normalizeBlockedBeds(sector.blockedBeds).filter((blocked) => {
      const number = Number(blocked);
      return Number.isInteger(number) && number >= 1 && number <= capacity;
    }),
  );
  const blockedBedsCount = sector.active
    ? blockedBedKeys.size
    : Math.max(capacity - Math.min(occupied, capacity), 0);
  const usableCapacity = sector.active
    ? Math.max(capacity - blockedBedsCount, 0)
    : 0;
  const freeBeds = sector.active ? Math.max(usableCapacity - occupied, 0) : 0;
  const occupancyPercent =
    usableCapacity > 0
      ? Math.min(Math.round((occupied / usableCapacity) * 100), 100)
      : occupied > 0
        ? 100
        : 0;

  return {
    capacity,
    occupied,
    blockedBedKeys,
    blockedBedsCount,
    usableCapacity,
    freeBeds,
    occupancyPercent,
  };
}

function normalizeBedKey(value: string) {
  const trimmed = String(value).trim();
  if (!trimmed) return '';

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? bedKey(parsed) : trimmed;
}

function isBedWithinCapacity(value: string, capacity: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= capacity;
}

function toPositiveInteger(value: number) {
  return Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0;
}
