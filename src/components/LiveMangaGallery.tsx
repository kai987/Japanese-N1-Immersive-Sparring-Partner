import { useState } from 'react'
import type { LiveMangaGallery as MangaGallery } from '../data/live-manga'
import '../live-manga.css'

// Resolve URLs only in the browser component: the shared metadata is also
// imported by Node validation and audio collection, which must not load JPEGs.
const imageUrls = import.meta.glob<string>('../assets/live-manga/**/*.jpg', {
  eager: true, query: '?url', import: 'default',
})

export function LiveMangaGallery({ gallery, showTitle = false }: { gallery: MangaGallery; showTitle?: boolean }) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(gallery.pages[0]?.id ?? '')
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const index = Math.max(0, gallery.pages.findIndex(page => page.id === selectedId))
  const page = gallery.pages[index]
  const originalUrl = page ? imageUrls[`../assets/live-manga/${page.file}`] : undefined
  const imageUrl = originalUrl && (retryAttempt
    ? `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}manga-retry=${retryAttempt}`
    : originalUrl)
  const failed = !imageUrl || failedSource === imageUrl
  const choosePage = (nextIndex: number) => {
    const next = gallery.pages[nextIndex]
    if (!next) return
    setSelectedId(next.id)
    setRetryAttempt(0)
    setFailedSource(null)
  }
  const retry = () => {
    if (!originalUrl) { window.location.reload(); return }
    setFailedSource(null)
    setRetryAttempt(attempt => attempt + 1)
  }

  return <details className="live-manga-gallery" data-manga-gallery={gallery.id} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>漫画原图 · {showTitle ? <><span lang="ja">{gallery.title}</span> · </> : null}{gallery.pages.length} 张</summary>
    {open ? <div className="live-manga-reader">
      <header className="live-manga-heading">
        <h3 lang="ja">{gallery.title}</h3>
        <p>{gallery.description}</p>
      </header>
      {page ? <>
        <div className="live-manga-controls">
          <label className="live-manga-page-select">
            <span>跳转到</span>
            <select aria-label="选择漫画页" value={page.id}
              onChange={event => choosePage(gallery.pages.findIndex(item => item.id === event.target.value))}>
              {gallery.pages.map((item, pageIndex) => <option key={item.id} value={item.id}>
                {pageIndex + 1} / {gallery.pages.length} · {item.label}
              </option>)}
            </select>
          </label>
        </div>
        <div className="live-manga-page-heading">
          <p className="live-manga-status" role="status" aria-live="polite" aria-atomic="true">
            第 {index + 1} / {gallery.pages.length} 张 · {page.label}
          </p>
          {originalUrl ? <a className="live-manga-original" href={originalUrl} target="_blank" rel="noopener noreferrer">打开原图</a> : null}
        </div>
        <div className="live-manga-navigation" role="group" aria-label="漫画翻页">
          <button className="live-manga-prev" type="button" aria-label="上一页"
            disabled={index === 0} onClick={() => choosePage(index - 1)}>
            <span className="live-manga-turn-arrow" aria-hidden="true">‹</span>
            <span className="live-manga-turn-label">上一页</span>
          </button>
          <figure className="live-manga-page">
            {failed ? <div className="live-manga-error" role="alert">
              <p>{originalUrl ? '这张漫画原图未能加载，请重试，或打开原图查看。' : '这张漫画原图暂时无法显示，请重新加载页面。'}</p>
              <button type="button" onClick={retry}>重试加载</button>
            </div> : <a className="live-manga-page-link" href={originalUrl} target="_blank" rel="noopener noreferrer"
              aria-label={`打开${page.label}原图（新标签页）`}>
              <img className="live-manga-image" key={imageUrl} src={imageUrl} alt={page.alt}
                width={page.width} height={page.height} loading="lazy" decoding="async"
                onError={() => setFailedSource(imageUrl!)} />
            </a>}
          </figure>
          <button className="live-manga-next" type="button" aria-label="下一页"
            disabled={index === gallery.pages.length - 1} onClick={() => choosePage(index + 1)}>
            <span className="live-manga-turn-arrow" aria-hidden="true">›</span>
            <span className="live-manga-turn-label">下一页</span>
          </button>
        </div>
      </> : <p className="live-manga-empty">暂时没有可显示的漫画原图。</p>}
    </div> : null}
  </details>
}
