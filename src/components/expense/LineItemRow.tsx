import { useRef } from 'react'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_LIMITS,
} from '../../constants/expense'
import type { CategoryKey, LineItem, LineItemErrors } from '../../types/expense'

interface LineItemRowProps {
  item: LineItem
  index: number
  errors?: LineItemErrors
  onUpdate: (id: string, field: keyof LineItem, value: unknown) => void
  onRemove: (id: string) => void
  showRemove: boolean
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function LineItemRow({
  item,
  errors,
  onUpdate,
  onRemove,
  showRemove,
}: LineItemRowProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    onUpdate(item.id, 'attachmentFile', file)
    onUpdate(item.id, 'attachmentFileName', file ? file.name.replace(/[/\\]/g, '').trim() : null)
    // Reset the input so the same file can be re-selected after clearing
    e.target.value = ''
  }

  const hasError = (field: keyof LineItemErrors) => Boolean(errors?.[field])

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8125rem',
      backgroundColor: '#ffffff',
    },
  }

  return (
    <TableRow
      sx={{
        '&:last-child td': { borderBottom: 'none' },
        '&:hover': { backgroundColor: '#fafbfc' },
        transition: 'background-color 0.1s',
      }}
    >
      {/* ── Date ───────────────────────────────────────────────────────── */}
      <TableCell sx={{ minWidth: 148, py: '8px !important' }}>
        <Tooltip title={errors?.date ?? ''} placement="top" arrow>
          <TextField
            type="date"
            size="small"
            fullWidth
            value={item.date}
            onChange={(e) => onUpdate(item.id, 'date', e.target.value)}
            error={hasError('date')}
            inputProps={{ max: todayISO(), 'aria-label': 'Expense date' }}
            sx={inputSx}
          />
        </Tooltip>
      </TableCell>

      {/* ── Category ───────────────────────────────────────────────────── */}
      <TableCell sx={{ minWidth: 160, py: '8px !important' }}>
        <Tooltip title={errors?.category ?? ''} placement="top" arrow>
          <FormControl size="small" fullWidth error={hasError('category')}>
            <Select
              value={item.category}
              onChange={(e) => onUpdate(item.id, 'category', e.target.value)}
              displayEmpty
              renderValue={(val) => {
                if (!val)
                  return (
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                      Category
                    </Typography>
                  )
                const key = val as CategoryKey
                return (
                  <Chip
                    label={CATEGORY_LABELS[key]}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: CATEGORY_COLORS[key] + '1a',
                      color: CATEGORY_COLORS[key],
                      border: `1px solid ${CATEGORY_COLORS[key]}33`,
                    }}
                  />
                )
              }}
              sx={{ fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
            >
              {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => (
                <MenuItem key={key} value={key}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: CATEGORY_COLORS[key],
                          flexShrink: 0,
                        }}
                      />
                      <Typography sx={{ fontSize: '0.875rem' }}>
                        {CATEGORY_LABELS[key]}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 }}>
                      up to ${CATEGORY_LIMITS[key].toLocaleString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
      </TableCell>

      {/* ── Merchant ───────────────────────────────────────────────────── */}
      <TableCell sx={{ minWidth: 120, py: '8px !important' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Merchant"
          value={item.merchant}
          onChange={(e) => onUpdate(item.id, 'merchant', e.target.value)}
          inputProps={{ maxLength: 100, 'aria-label': 'Merchant name' }}
          sx={inputSx}
        />
      </TableCell>

      {/* ── Description ────────────────────────────────────────────────── */}
      <TableCell sx={{ minWidth: 160, py: '8px !important' }}>
        <Tooltip title={errors?.description ?? ''} placement="top" arrow>
          <TextField
            size="small"
            fullWidth
            placeholder="Brief note..."
            value={item.description}
            onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
            error={hasError('description')}
            inputProps={{ maxLength: 200, 'aria-label': 'Expense description' }}
            sx={inputSx}
          />
        </Tooltip>
      </TableCell>

      {/* ── Amount ─────────────────────────────────────────────────────── */}
      <TableCell sx={{ minWidth: 130, py: '8px !important' }}>
        <Tooltip title={errors?.amount ?? ''} placement="top" arrow>
          <TextField
            size="small"
            fullWidth
            type="number"
            placeholder="0.00"
            value={item.amount}
            onChange={(e) => onUpdate(item.id, 'amount', e.target.value)}
            error={hasError('amount')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                    $
                  </Typography>
                </InputAdornment>
              ),
            }}
            inputProps={{
              min: 0,
              step: '0.01',
              'aria-label': 'Expense amount in USD',
              style: { textAlign: 'right' },
            }}
            sx={inputSx}
          />
        </Tooltip>
      </TableCell>

      {/* ── Receipt attachment ─────────────────────────────────────────── */}
      <TableCell sx={{ width: 56, textAlign: 'center', py: '8px !important' }}>
        <input
          type="file"
          ref={fileRef}
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-label="Attach receipt for this line item"
        />
        <Tooltip
          title={
            errors?.attachment
              ? errors.attachment
              : item.attachmentFileName
                ? `Attached: ${item.attachmentFileName}`
                : 'Attach receipt (PDF, JPG, PNG · max 5 MB)'
          }
          placement="top"
          arrow
        >
          <IconButton
            size="small"
            onClick={() => fileRef.current?.click()}
            sx={{
              color: item.attachmentFileName
                ? '#10b981'
                : errors?.attachment
                  ? '#ef4444'
                  : '#94a3b8',
              '&:hover': { color: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)' },
            }}
          >
            {item.attachmentFileName ? (
              <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
            ) : (
              <AttachFileIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>
      </TableCell>

      {/* ── Delete ─────────────────────────────────────────────────────── */}
      <TableCell sx={{ width: 48, textAlign: 'center', py: '8px !important' }}>
        {showRemove && (
          <Tooltip title="Remove this line item" placement="top" arrow>
            <IconButton
              size="small"
              onClick={() => onRemove(item.id)}
              aria-label="Remove line item"
              sx={{
                color: '#cbd5e1',
                '&:hover': { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' },
                transition: 'color 0.15s',
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  )
}
