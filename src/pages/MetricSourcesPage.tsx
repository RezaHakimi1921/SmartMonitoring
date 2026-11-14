import { useMemo, useState } from 'react'
import { Box, Card, Select, Stack, TextField, Typography } from '@smartx/design-system'
import { METRIC_QUERY_DOCS } from '../data/metricQueries'

export function MetricSourcesPage() {
  const [featureId, setFeatureId] = useState(METRIC_QUERY_DOCS[0]?.featureId || '')
  const [open, setOpen] = useState(false)
  const [fromKey, setFromKey] = useState('14050717')
  const [toKey, setToKey] = useState('14050817')
  const [sw, setSw] = useState('11202')
  const [branchId, setBranchId] = useState('7220')

  const options = useMemo(
    () => METRIC_QUERY_DOCS.map((d) => ({ id: d.featureId, label: d.title })),
    [],
  )
  const doc = METRIC_QUERY_DOCS.find((d) => d.featureId === featureId) || METRIC_QUERY_DOCS[0]

  const filledSql = useMemo(() => {
    if (!doc) return ''
    return doc.sql
      .replaceAll('@sw', sw || '@sw')
      .replaceAll('@branchId', branchId || '@branchId')
      .replaceAll('@fromKey', fromKey || '@fromKey')
      .replaceAll('@toKey', toKey || '@toKey')
  }, [doc, sw, branchId, fromKey, toKey])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="headlineSmall" display="block">
          منابع محاسبه شاخص‌ها
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          همان کوئری‌هایی که دیدبان روی سرور اجرا می‌کند. DateKey شمسی است.
          شناسهٔ نمونه کیا فود: sw=
          <Box component="span" sx={{ direction: 'ltr', display: 'inline' }}>
            11202
          </Box>
          ، branch=
          <Box component="span" sx={{ direction: 'ltr', display: 'inline' }}>
            7220
          </Box>
          ، قفل ۹۱۷۳۰۲.
        </Typography>
      </Box>

      <Card elevation={1} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="labelMedium" display="block" sx={{ mb: 0.75 }}>
              شاخص
            </Typography>
            <Select
              value={featureId}
              options={options}
              open={open}
              onOpenChange={setOpen}
              onChange={setFeatureId}
            />
          </Box>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            }}
          >
            <TextField
              label="fromKey شمسی"
              value={fromKey}
              onChange={(e) => setFromKey(e.target.value)}
              fullWidth
            />
            <TextField
              label="toKey شمسی"
              value={toKey}
              onChange={(e) => setToKey(e.target.value)}
              fullWidth
            />
            <TextField
              label="SmartwifiBranchId (@sw)"
              value={sw}
              onChange={(e) => setSw(e.target.value)}
              fullWidth
            />
            <TextField
              label="BranchId"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              fullWidth
            />
          </Box>
        </Stack>
      </Card>

      {doc ? (
        <Card elevation={1} sx={{ p: 2 }}>
          <Typography variant="titleMedium" display="block">
            {doc.title}
          </Typography>
          <Typography variant="bodySmall" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            منبع: {doc.source}
          </Typography>
          <Typography variant="bodyMedium" display="block" sx={{ mt: 1.5 }}>
            {doc.note}
          </Typography>
          <Box
            component="pre"
            dir="ltr"
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'grey.900',
              color: 'grey.100',
              overflow: 'auto',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {filledSql}
          </Box>
        </Card>
      ) : null}
    </Stack>
  )
}
