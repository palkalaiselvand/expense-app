import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import LineItemRow from './LineItemRow'
import type { LineItem, LineItemErrors } from '../../types/expense'
import type { CategorySetting } from '../../types/settings'
import { MAX_LINE_ITEMS } from '../../constants/expense'

interface LineItemsTableProps {
  items: LineItem[]
  errors: Record<string, LineItemErrors>
  categories: CategorySetting[]
  maxItems?: number
  onUpdate: (id: string, field: keyof LineItem, value: unknown) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export default function LineItemsTable({
  items,
  errors,
  categories,
  maxItems,
  onUpdate,
  onAdd,
  onRemove,
}: LineItemsTableProps) {
  const effectiveMax = maxItems ?? MAX_LINE_ITEMS
  const atMax = items.length >= effectiveMax
  const hasErrors = Object.keys(errors).length > 0

  // Prevent adding a new row while the last row's required fields are unfilled
  const lastItem = items[items.length - 1]
  const lastIncomplete =
    !lastItem ||
    !lastItem.date ||
    !lastItem.category ||
    !lastItem.merchant ||
    !String(lastItem.amount).trim()
  const addDisabled = atMax || lastIncomplete

  return (
    <Box>
      <TableContainer
        sx={{
          border: hasErrors ? '1px solid #fecaca' : '1px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'auto',
          maxHeight: 420,
          transition: 'border-color 0.15s',
        }}
      >
        <Table size="small" sx={{ tableLayout: 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Merchant</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="center">Receipt</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <LineItemRow
                key={item.id}
                item={item}
                index={index}
                errors={errors[item.id]}
                categories={categories}
                onUpdate={onUpdate}
                onRemove={onRemove}
                showRemove={items.length > 1}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Add line item ──────────────────────────────────────────────── */}
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, pl: 0.5 }}>
        <Button
          size="small"
          startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
          onClick={onAdd}
          disabled={addDisabled}
          sx={{
            color: '#10b981',
            fontWeight: 500,
            fontSize: '0.875rem',
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(16,185,129,0.08)',
            },
            '&.Mui-disabled': {
              color: '#cbd5e1',
            },
          }}
        >
          Add Line Item
        </Button>

        {atMax && (
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Maximum of {effectiveMax} line items reached
          </Typography>
        )}
        {!atMax && lastIncomplete && (
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Fill in the current row before adding another
          </Typography>
        )}
      </Box>
    </Box>
  )
}
