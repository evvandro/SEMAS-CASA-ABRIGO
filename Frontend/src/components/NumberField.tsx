import { useState } from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

type NumberFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function NumberField({
  value,
  onChange,
  min,
  max,
  ...rest
}: NumberFieldProps) {
  const [state, setState] = useState({ text: String(value), value });
  if (value !== state.value) {
    setState({ text: String(value), value });
  }
  const { text } = state;

  const setText = (next: string) =>
    setState((current) => ({ ...current, text: next }));

  const clamp = (n: number) => {
    let next = n;
    if (min != null && next < min) next = min;
    if (max != null && next > max) next = max;
    return next;
  };

  const emit = (n: number) => {
    setState({ text: String(n), value: n });
    onChange(n);
  };

  return (
    <TextField
      {...rest}
      value={text}
      inputMode="numeric"
      onChange={(event) => {
        const sanitized = event.target.value.replace(/\D/g, '');
        if (sanitized === '') {
          setText(''); // permite vazio enquanto edita
          return;
        }
        emit(clamp(parseInt(sanitized, 10)));
      }}
      onBlur={(event) => {
        const parsed = parseInt(text, 10);
        const next = clamp(Number.isNaN(parsed) ? (min ?? 0) : parsed);
        setText(String(next));
        emit(next);
        rest.onBlur?.(event);
      }}
    />
  );
}
