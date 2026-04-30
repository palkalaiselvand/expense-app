import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import BoltIcon from '@mui/icons-material/Bolt'

export default function PolicyReminder() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
      }}
    >
      {/* ── Expense Policy Reminder ──────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          p: 2.5,
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Thumbnail placeholder */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '10px',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <InfoOutlinedIcon sx={{ color: '#64748b', fontSize: 24 }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#0f172a',
              mb: 0.5,
            }}
          >
            Expense Policy Reminder
          </Typography>
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: '#64748b',
              lineHeight: 1.6,
            }}
          >
            For reports with more than 5 line items, please ensure a brief summary
            is provided in the memo section if applicable.
          </Typography>
        </Box>
      </Paper>

      {/* ── Pro Tip ──────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(16,185,129,0.12)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'rgba(16,185,129,0.08)',
          },
        }}
      >
        {/* Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BoltIcon sx={{ fontSize: 16, color: '#ffffff' }} />
          </Box>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#10b981',
            }}
          >
            Pro Tip
          </Typography>
        </Box>

        <Typography sx={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.65 }}>
          Batching your monthly expenses into one report speeds up reimbursement
          by{' '}
          <Box component="span" sx={{ color: '#ffffff', fontWeight: 600 }}>
            40%
          </Box>
          .
        </Typography>
      </Paper>
    </Box>
  )
}
