import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import CloseIcon from '@mui/icons-material/Close'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'

interface GlobalReceiptUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.zip']
const MAX_TOTAL_BYTES = 25 * 1024 * 1024 // 25 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function GlobalReceiptUpload({ files, onFilesChange }: GlobalReceiptUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const incoming = Array.from(fileList).filter((f) => {
      const ext = ('.' + (f.name.split('.').pop() ?? '')).toLowerCase()
      return ACCEPTED_EXTENSIONS.includes(ext)
    })
    const merged = [...files, ...incoming]
    const totalSize = merged.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_TOTAL_BYTES) {
      // Only add files up to the limit
      const kept: File[] = []
      let size = files.reduce((s, f) => s + f.size, 0)
      for (const f of incoming) {
        if (size + f.size <= MAX_TOTAL_BYTES) {
          kept.push(f)
          size += f.size
        }
      }
      onFilesChange([...files, ...kept])
    } else {
      onFilesChange(merged)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <Box>
      <Typography
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#64748b',
          mb: 1.5,
        }}
      >
        Attach Receipts (ZIP or multiple files)
      </Typography>

      {/* ── Drop zone ───────────────────────────────────────────────────── */}
      <Box
        role="button"
        tabIndex={0}
        aria-label="Upload receipts — click or drag and drop files here"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragOver ? '#10b981' : '#cbd5e1'}`,
          borderRadius: '12px',
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? 'rgba(16,185,129,0.04)' : '#fafafa',
          transition: 'all 0.2s ease',
          outline: 'none',
          '&:hover': {
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.04)',
          },
          '&:focus-visible': {
            outline: '3px solid rgba(16,185,129,0.4)',
            outlineOffset: 2,
          },
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.zip"
          style={{ display: 'none' }}
          onChange={(e) => processFiles(e.target.files)}
          aria-hidden="true"
        />

        {/* Icon circle */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: dragOver ? '#10b981' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
            transition: 'transform 0.15s',
            transform: dragOver ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <UploadFileOutlinedIcon sx={{ color: '#ffffff', fontSize: 26 }} />
        </Box>

        <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '0.9375rem', mb: 0.5 }}>
          {dragOver ? 'Drop files here' : 'Click to upload receipts'}
        </Typography>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
          Bundle all relevant files (PDF, PNG, JPG &ndash; max 25MB total)
        </Typography>
      </Box>

      {/* ── Attached file list ──────────────────────────────────────────── */}
      {files.length > 0 && (
        <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {files.map((file, index) => (
            <Box
              key={`${file.name}-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                px: 1.5,
                py: 0.625,
                maxWidth: 220,
              }}
            >
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 14, color: '#64748b', flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: '#334155',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                  {formatBytes(file.size)}
                </Typography>
              </Box>
              <Tooltip title="Remove file" placement="top">
                <IconButton
                  size="small"
                  onClick={() => removeFile(index)}
                  sx={{ p: 0.25, color: '#94a3b8', flexShrink: 0, '&:hover': { color: '#ef4444' } }}
                  aria-label={`Remove ${file.name}`}
                >
                  <CloseIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
