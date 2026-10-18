import { Fragment } from 'react'
import { getSearchRanges } from '../lib/searchHighlight'

export function SearchHighlight({ text, query, className = 'search-hit' }: { text: string; query: string; className?: string }) {
  const ranges = getSearchRanges(text, query)
  let cursor = 0
  return <>{ranges.map(range => {
    const before = text.slice(cursor, range.start)
    cursor = range.end
    return <Fragment key={`${range.start}-${range.end}`}>{before}<mark className={className}>{text.slice(range.start, range.end)}</mark></Fragment>
  })}{text.slice(cursor)}</>
}
