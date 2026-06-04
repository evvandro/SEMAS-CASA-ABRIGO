import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, LinearProgress, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const TOAST_DURATION = 5000

const toastVariantStyles = {
  success: {
    border: '#16a34a33',
    background: '#ecfdf5',
    accent: '#16a34a',
    text: '#065f46',
    description: '#334e52',
  },
  error: {
    border: '#dc262666',
    background: '#fee2e2',
    accent: '#dc2626',
    text: '#991b1b',
    description: '#5f2121',
  },
} as const

type NotificationType = 'success' | 'error'

interface NotificationProps {
  id: string | number
  title: string
  description?: string
  variant: NotificationType
}

export default function NotificationToast({ id, title, description, variant }: NotificationProps) {
  const [remaining, setRemaining] = useState(TOAST_DURATION)
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(TOAST_DURATION)
  const lastTickRef = useRef<number>(0)

  const styles = toastVariantStyles[variant]

  useEffect(() => {
    if (!lastTickRef.current) {
      lastTickRef.current = Date.now()
    }

    if (remainingRef.current <= 0) {
      toast.dismiss(id)
      return
    }

    if (paused) {
      lastTickRef.current = Date.now()
      return
    }

    const interval = window.setInterval(() => {
      const now = Date.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      remainingRef.current = Math.max(remainingRef.current - delta, 0)
      setRemaining(remainingRef.current)

      if (remainingRef.current <= 0) {
        toast.dismiss(id)
      }
    }, 40)

    return () => {
      window.clearInterval(interval)
    }
  }, [id, paused])

  const progress = Math.max((remaining / TOAST_DURATION) * 100, 0)

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        width: 'min(360px, calc(100vw - 24px))',
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${styles.border}`,
        bgcolor: styles.background,
        color: styles.text,
        boxShadow: '0 18px 80px rgba(15, 23, 42, 0.12)',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: styles.accent, mt: 0.5 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: styles.text }}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" sx={{ color: styles.description, mt: 0.5, whiteSpace: 'pre-line' }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        <IconButton
          size="small"
          onClick={() => toast.dismiss(id)}
          sx={{ color: styles.text, p: 0.5 }}
          aria-label="Fechar notificacao"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Box sx={{ mt: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(15, 23, 42, 0.08)',
            '& .MuiLinearProgress-bar': {
              bgcolor: styles.accent,
            },
          }}
        />
      </Box>
    </Box>
  )
}
