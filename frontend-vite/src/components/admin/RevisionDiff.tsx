/**
 * RevisionDiff — Admin pending-edits diff visualization (Phase A, Task A5).
 *
 * Renders a clean field-by-field comparison between an approved snapshot
 * (`before`) and the pending submission (`after`). Diff computed client-side
 * with jsondiffpatch; rendered with a custom Tailwind layout (the library's
 * default HTML formatter is intentionally avoided).
 */

import { useMemo, useState } from 'react'
import { create, type Delta } from 'jsondiffpatch'

export interface RevisionDiffProps {
  before: Record<string, unknown> | null
  after: Record<string, unknown>
}

type FieldChange =
  | { kind: 'added'; key: string; after: unknown }
  | { kind: 'removed'; key: string; before: unknown }
  | { kind: 'changed'; key: string; before: unknown; after: unknown }

const URL_FIELD_HINT = /(_url|_image|_logo|image_url|logo_url|video|website|link)$/i

const diffPatcher = create()

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function classifyDelta(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  delta: Delta
): FieldChange[] {
  if (!delta || !isPlainObject(delta)) return []
  const changes: FieldChange[] = []
  for (const key of Object.keys(delta)) {
    if (key === '_t') continue
    const d = (delta as Record<string, unknown>)[key]
    if (Array.isArray(d)) {
      if (d.length === 1) {
        changes.push({ kind: 'added', key, after: d[0] })
      } else if (d.length === 2) {
        changes.push({ kind: 'changed', key, before: d[0], after: d[1] })
      } else if (d.length === 3 && d[1] === 0 && d[2] === 0) {
        changes.push({ kind: 'removed', key, before: d[0] })
      } else {
        changes.push({
          kind: 'changed',
          key,
          before: before[key],
          after: after[key],
        })
      }
    } else {
      // Nested object/array delta — surface as a coarse "changed" entry.
      changes.push({
        kind: 'changed',
        key,
        before: before[key],
        after: after[key],
      })
    }
  }
  return changes
}

function StatusBadge({ kind }: { kind: FieldChange['kind'] }) {
  const styles: Record<FieldChange['kind'], string> = {
    added: 'bg-green-100 text-green-700',
    removed: 'bg-red-100 text-red-700',
    changed: 'bg-amber-100 text-amber-700',
  }
  const labels: Record<FieldChange['kind'], string> = {
    added: 'Added',
    removed: 'Removed',
    changed: 'Changed',
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${styles[kind]}`}>
      {labels[kind]}
    </span>
  )
}

function renderScalar(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function ValueBlock({
  value,
  tone,
  strike,
}: {
  value: unknown
  tone: 'before' | 'after'
  strike?: boolean
}) {
  const isUrl = typeof value === 'string' && /^https?:\/\//.test(value)
  const isArray = Array.isArray(value)
  const baseTone =
    tone === 'before'
      ? 'bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200'
      : 'bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-200'

  if (isUrl) {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noreferrer"
        className={`block break-all rounded px-2 py-1 text-xs underline ${baseTone} ${strike ? 'line-through' : ''}`}
      >
        {String(value)}
      </a>
    )
  }
  if (isArray) {
    return (
      <ul className={`space-y-1 rounded px-2 py-1 text-xs ${baseTone}`}>
        {(value as unknown[]).length === 0 ? (
          <li className="italic opacity-70">(empty list)</li>
        ) : (
          (value as unknown[]).map((item, i) => (
            <li key={i} className={strike ? 'line-through' : ''}>
              · {renderScalar(item)}
            </li>
          ))
        )}
      </ul>
    )
  }
  const text = renderScalar(value)
  const isLong = text.length > 80 || text.includes('\n')
  return (
    <pre
      className={`whitespace-pre-wrap break-words rounded px-2 py-1 text-xs ${baseTone} ${strike ? 'line-through' : ''} ${isLong ? 'max-h-48 overflow-auto' : ''}`}
    >
      {text}
    </pre>
  )
}

function ChangedField({ change }: { change: FieldChange }) {
  const label = humanizeKey(change.key)
  const isUrlField = URL_FIELD_HINT.test(change.key)
  return (
    <li className="space-y-1 rounded-lg border border-[#e5e5e5] p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#0a0a0a]">{label}</span>
        <StatusBadge kind={change.kind} />
      </div>
      {change.kind === 'added' && <ValueBlock value={change.after} tone="after" />}
      {change.kind === 'removed' && <ValueBlock value={change.before} tone="before" strike />}
      {change.kind === 'changed' && (
        <div className="grid gap-1">
          {isUrlField ? (
            <>
              <div className="text-[10px] uppercase text-[#737373]">Was</div>
              <ValueBlock value={change.before} tone="before" strike />
              <div className="text-[10px] uppercase text-[#737373]">Now</div>
              <ValueBlock value={change.after} tone="after" />
            </>
          ) : (
            <>
              <ValueBlock value={change.before} tone="before" strike />
              <ValueBlock value={change.after} tone="after" />
            </>
          )}
        </div>
      )}
    </li>
  )
}

function FirstSubmission({ after }: { after: Record<string, unknown> }) {
  const keys = Object.keys(after)
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
        First submission — no prior version to diff against.
      </div>
      <ul className="space-y-2">
        {keys.map((k) => (
          <li key={k} className="space-y-1 rounded-lg border border-[#e5e5e5] p-3">
            <div className="text-sm font-medium text-[#0a0a0a]">{humanizeKey(k)}</div>
            <ValueBlock value={after[k]} tone="after" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RevisionDiff({ before, after }: RevisionDiffProps): JSX.Element {
  const [showUnchanged, setShowUnchanged] = useState(false)

  const { changes, unchangedKeys } = useMemo(() => {
    if (before === null) return { changes: [] as FieldChange[], unchangedKeys: [] as string[] }
    const delta = diffPatcher.diff(before, after)
    const changed = classifyDelta(before, after, delta)
    const changedSet = new Set(changed.map((c) => c.key))
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
    const unchanged = allKeys.filter((k) => !changedSet.has(k))
    return { changes: changed, unchangedKeys: unchanged }
  }, [before, after])

  if (before === null) {
    return <FirstSubmission after={after} />
  }

  if (changes.length === 0) {
    return (
      <div className="rounded-md border border-[#e5e5e5] bg-gray-50 px-3 py-2 text-sm text-[#737373]">
        No field changes detected between the approved version and the pending submission.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {changes.map((c) => (
          <ChangedField key={c.key} change={c} />
        ))}
      </ul>

      {unchangedKeys.length > 0 && (
        <div className="rounded-md border border-[#e5e5e5] bg-gray-50 p-2 text-xs">
          <button
            type="button"
            onClick={() => setShowUnchanged((v) => !v)}
            className="text-[#737373] hover:text-[#0a0a0a]"
          >
            {showUnchanged ? '▾' : '▸'} {unchangedKeys.length} unchanged field
            {unchangedKeys.length === 1 ? '' : 's'}
          </button>
          {showUnchanged && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {unchangedKeys.map((k) => (
                <li key={k} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-[#404040]">
                  {humanizeKey(k)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
