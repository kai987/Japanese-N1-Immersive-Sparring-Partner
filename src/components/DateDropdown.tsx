import { useState } from 'react'
import { historyItems } from '../data/history'
import type { SectionId } from '../types'

const formatCurrentDate = (date: string) => {
  const parsed = new Date(`${date}T12:00:00+09:00`)
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(parsed)
}

const formatOptionDate = (date: string) => {
  const parsed = new Date(`${date}T12:00:00+09:00`)
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(parsed)
}

export function DateDropdown({
  date,
  day,
  activeSection,
  onOpen,
}: {
  date: string
  day: number
  activeSection: SectionId
  onOpen: (date: string, section: SectionId) => void
}) {
  const [open, setOpen] = useState(false)

  const choose = (nextDate: string) => {
    onOpen(nextDate, activeSection)
    setOpen(false)
  }

  return (
    <div
      className="date-dropdown"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        className="date-dropdown-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        <span className="date-dropdown-copy">
          <strong>{formatCurrentDate(date)}</strong>
          <small>Day {day} · 99日N1计划</small>
        </span>
        <svg className={open ? 'open' : ''} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 9 5 5 5-5" />
        </svg>
      </button>

      {open ? (
        <div className="date-dropdown-menu" role="listbox" aria-label="选择日报日期">
          <div className="date-dropdown-head">
            <strong>历史日报</strong>
            <span>{historyItems.length} 天</span>
          </div>
          <div className="date-dropdown-list">
            {historyItems.map((item) => {
              const selected = item.date === date
              return (
                <button
                  type="button"
                  key={item.date}
                  className={`date-dropdown-option ${selected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item.date)}
                >
                  <span className="date-dropdown-day">Day {item.day}</span>
                  <span className="date-dropdown-option-main">
                    <strong>{formatOptionDate(item.date)}</strong>
                    <small>{item.title}</small>
                  </span>
                  {selected ? <span className="date-dropdown-check">✓</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
