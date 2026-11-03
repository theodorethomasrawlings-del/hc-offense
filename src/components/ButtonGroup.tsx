import type React from 'react'
interface Option<K extends string | number> {
  key: K
  label: string
  tone?: 'stop' | 'score'
}

interface Props<K extends string | number> {
  title?: string
  options: Option<K>[]
  selected: K | K[] | undefined
  onSelect(key: K): void
  columns?: number
  height?: number
  fontSize?: number
  ariaLabel?: string
  /** Rendered as one more cell at the end of the grid. */
  extra?: React.ReactNode
}

export default function ButtonGroup<K extends string | number>({
  title,
  options,
  selected,
  onSelect,
  columns = 1,
  height,
  fontSize,
  ariaLabel,
  extra,
}: Props<K>) {
  const isOn = (k: K) => (Array.isArray(selected) ? selected.includes(k) : selected === k)
  return (
    <div className="grid" style={{ gap: 6 }} role="group" aria-label={ariaLabel ?? title}>
      {title && <h2>{title}</h2>}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 6 }}>
        {options.map((o) => (
          <button
            key={String(o.key)}
            className={`btn ${o.tone ?? ''} ${isOn(o.key) ? 'on' : ''}`}
            style={{ ...(height ? { minHeight: height } : {}), ...(fontSize ? { fontSize } : {}), minWidth: 0, padding: '0 6px' }}
            aria-pressed={isOn(o.key)}
            onClick={() => onSelect(o.key)}
          >
            {o.label}
          </button>
        ))}
        {extra}
      </div>
    </div>
  )
}
