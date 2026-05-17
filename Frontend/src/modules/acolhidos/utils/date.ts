interface DateParts {
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
}

const pad = (value: number) => String(value).padStart(2, '0')

export const parseDateParts = (value?: string | null): DateParts | null => {
  if (!value) return null

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/)
  if (!match) return null

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] ? Number(match[4]) : undefined,
    minute: match[5] ? Number(match[5]) : undefined,
  }
}

export const formatDateOnly = (value?: string | null, fallback = '-') => {
  const parts = parseDateParts(value)
  if (!parts) return fallback

  return `${pad(parts.day)}/${pad(parts.month)}/${parts.year}`
}

export const formatDateTime = (value: string) => {
  const parts = parseDateParts(value)
  if (!parts) return '-'

  const date = `${pad(parts.day)}/${pad(parts.month)}/${parts.year}`
  if (parts.hour == null || parts.minute == null) return date

  return `${date} ${pad(parts.hour)}:${pad(parts.minute)}`
}

export const formatEntryDateTime = (date?: string | null, time?: string | null, fallback = '-') => {
  const formattedDate = formatDateOnly(date, fallback)
  const parts = parseDateParts(date)
  const normalizedTime = time?.trim() || (parts?.hour != null && parts.minute != null ? `${pad(parts.hour)}:${pad(parts.minute)}` : '')

  if (formattedDate === fallback) return fallback
  return normalizedTime ? `${formattedDate} ${normalizedTime}` : formattedDate
}

export const dateSortValue = (value?: string | null, time?: string | null) => {
  const parts = parseDateParts(value)
  if (!parts) return 0

  const [timeHour, timeMinute] = (time ?? '').split(':').map(Number)
  const hour = Number.isFinite(timeHour) ? timeHour : parts.hour ?? 0
  const minute = Number.isFinite(timeMinute) ? timeMinute : parts.minute ?? 0

  return Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute)
}

export const calculateAgeFromIsoDate = (value?: string | null) => {
  const parts = parseDateParts(value)
  if (!parts) return 0

  const today = new Date()
  let age = today.getFullYear() - parts.year

  if (today.getMonth() + 1 < parts.month || (today.getMonth() + 1 === parts.month && today.getDate() < parts.day)) {
    age--
  }

  return age
}

export const calculateAgeFromBrazilianDate = (date: string) => {
  const [day, month, year] = date.split('/').map(Number)
  const today = new Date()
  let age = today.getFullYear() - year

  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--
  }

  return age
}
