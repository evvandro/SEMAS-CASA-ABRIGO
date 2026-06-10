import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { type SxProps, type Theme } from '@mui/material'
import { TimePicker } from '@mui/x-date-pickers'
import dayjs, { type Dayjs } from 'dayjs'
import type { FocusEventHandler } from 'react'

export type TimeInputProps = {
  label?: string
  name?: string
  autoFocus?: boolean
  value?: string | null
  onChange?: (value: string) => void
  onBlur?: FocusEventHandler<HTMLInputElement>
  disabled?: boolean
  required?: boolean
  error?: boolean
  helperText?: string | null
  fullWidth?: boolean
  sx?: SxProps<Theme>
}

function parseTime(value?: string | null): Dayjs | null {
  const match = value?.match(/^(\d{2}):(\d{2})/)
  if (!match) return null

  return dayjs().hour(Number(match[1])).minute(Number(match[2])).second(0).millisecond(0)
}

function formatTime(value: Dayjs | null): string {
  return value?.isValid() ? value.format('HH:mm') : ''
}

export function TimeInput({
  label,
  name,
  autoFocus,
  value,
  onChange,
  onBlur,
  disabled,
  required,
  error,
  helperText,
  fullWidth = true,
  sx,
}: TimeInputProps) {
  return (
    <TimePicker
      autoFocus={autoFocus}
      value={parseTime(value)}
      onChange={(nextValue) => onChange?.(formatTime(nextValue))}
      disabled={disabled}
      timeSteps={{ minutes: 1 }}
      slots={{
        openPickerIcon: AccessTimeIcon,
        actionBar: () => null,
      }}
      slotProps={{
        textField: {
          label,
          required,
          error,
          helperText,
          fullWidth,
          name,
          onBlur,
          autoComplete: 'off',
          sx,
        },
        openPickerButton: { sx: { mr: '-10px' } },
      }}
    />
  )
}
