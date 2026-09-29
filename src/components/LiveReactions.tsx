import { useEffect, useState } from 'react'
import { liveCategories, liveUnits, liveUnitFromSearch, type LiveCategory } from '../data/live-reaction-units'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { decodeLiveProgress, initialLiveProgress, liveProgressKey, matchesLiveGroup, type LiveStatus } from '../lib/liveReactions'
import '../live-reactions.css'
import '../live-units.css'

const statusFilters: { value: 'all' | LiveStatus; label: string }[] = [
  { value: 'all', label: '全部' }, { value: 'new', label: '未标记' },
  { value: 'review', label: '要復習' }, { value: 'mastered', label: '習得済み' },
]

export default function LiveReactions() {
  const [unitId, setUnitId] = useState(() => liveUnitFromSearch(window.location.search).id)
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState('all')
  const [category, setCategory] = useState<'all' | LiveCategory>('all')
  const [filter, setFilter] = useState<'all' | LiveStatus>('all')
  const [progress, setProgress, storage] = useLocalStorage(liveProgressKey, initialLiveProgress, decodeLiveProgress)
  const unit = liveUnits.find(item => item.id === unitId) ?? liveUnits[0]
  const groups = unit.groups
  const entries = groups.reduce((sum, group) => sum + group.entries.length, 0)
  const mastered = groups.filter(group => progress.groups[group.id] === 'mastered').length
  const categoryGroups = groups.filter(group => category === 'all' || group.category === category)
  const visible = categoryGroups.filter(group => (groupId === 'all' || group.id === groupId)
    && (filter === 'all' || (progress.groups[group.id] ?? 'new') === filter)
    && matchesLiveGroup(group.source ? { ...group, points: [...group.points, group.source.quote, group.source.translation] } : group, query))
  const resetFilters = () => { setQuery(''); setGroupId('all'); setFilter('all'); setCategory('all') }
  const chooseUnit = (id: string) => { setUnitId(id); resetFilters() }
  const toggleStatus = (id: string, next: LiveStatus) => setProgress(prev => ({ version: 1,
    groups: { ...prev.groups, [id]: prev.groups[id] === next ? 'new' : next } }))

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('live-unit', unitId)
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
  }, [unitId])

  return <section className="page-enter live-page" aria-labelledby="live-title" data-live-unit={unit.id}>
    <header className="live-header">
      <span className="section-index">LIVE NOTES · {liveUnits.length} UNITS</span>
      <h1 id="live-title">直播条反</h1>
      <p>把直播里的日语，整理成可以反复复习的知识。</p>
    </header>

    <label className="live-unit-picker"><span>选择学习单元</span><select aria-label="选择学习单元" value={unit.id} onChange={event => chooseUnit(event.target.value)}>
      {liveUnits.map(item => <option key={item.id} value={item.id}>{item.date}｜{item.title}</option>)}
    </select></label>
    <div className="live-unit-intro" aria-labelledby="live-unit-title">
      <div><span className="section-index">{unit.date}</span><h2 id="live-unit-title">{unit.title}</h2></div>
      <p>{unit.description}</p><span className="live-unit-count">{unit.countLabel}</span>
    </div>
    <div className="live-summary" aria-label="直播笔记学习概要">
      <div><span>当前单元</span><strong>{groups.length}<small> 组</small></strong></div>
      <div><span>词条与表达</span><strong>{entries}<small> 条</small></strong></div>
      <div><span>已标记掌握</span><strong>{mastered}<small> / {groups.length} 组</small></strong></div>
    </div>
    <p className="live-progress-note">本页按组保存学习状态，仅保存在当前浏览器；不同单元独立标记，与每日 N1 教材的学习记录分开。例句与辨析为学习补充，不将全部表达标为N1或新学。</p>

    {storage.failed ? <div className="storage-notice" role="alert"><p>无法保存直播笔记的学习状态；关闭页面后，本次更改可能丢失。</p><button className="text-btn" onClick={storage.retry}>重试保存</button></div>
      : storage.recovered ? <div className="storage-notice" role="status"><p>部分直播学习记录无法读取；可读取的记录已保留，每日教材记录不受影响。</p><button className="text-btn" onClick={storage.dismiss}>关闭提示</button></div> : null}

    <div className="live-categories" role="group" aria-label="内容分类">
      <button aria-pressed={category === 'all'} onClick={() => { setCategory('all'); setGroupId('all') }}>全部分类 <small>{groups.length}</small></button>
      {liveCategories.filter(item => groups.some(group => group.category === item.id)).map(item => <button key={item.id}
        aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setGroupId('all') }}>
        {item.label} <small>{groups.filter(group => group.category === item.id).length}</small>
      </button>)}
    </div>
    <div className="live-toolbar">
      <label className="live-search"><span>搜索本页笔记</span><input type="search" aria-label="搜索本页笔记" value={query} onChange={event => setQuery(event.target.value)} placeholder="在当前单元搜索日语、读音或中文" /></label>
      <label className="live-group-select"><span>选择知识组</span><select aria-label="选择知识组" value={groupId} onChange={event => setGroupId(event.target.value)}>
        <option value="all">全部 {categoryGroups.length} 组</option>
        {categoryGroups.map(group => <option key={group.id} value={group.id}>{String(groups.indexOf(group) + 1).padStart(2, '0')} · {group.title}</option>)}
      </select></label>
    </div>
    <div className="live-filter-row">
      <div className="live-status-filters" role="group" aria-label="筛选学习状态">{statusFilters.map(item => <button key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
      <span className="live-result-count" role="status">显示 {visible.length} / {groups.length} 组</span>
      {(query || groupId !== 'all' || category !== 'all' || filter !== 'all') ? <button className="text-btn" onClick={resetFilters}>重置筛选</button> : null}
    </div>

    {visible.length === 0 ? <div className="live-empty"><h2>没有匹配的知识组</h2><p>试试其他关键词，或清除筛选条件。</p><button className="text-btn" onClick={resetFilters}>清除筛选</button></div> : <div className="live-group-list">
      {visible.map(group => {
        const index = groups.indexOf(group)
        const status = progress.groups[group.id] ?? 'new'
        return <article className="live-group-card" key={group.id} data-live-group={group.id} data-category={group.category} aria-labelledby={`${group.id}-title`}>
          <header className="live-group-heading"><span className="live-group-number">{String(index + 1).padStart(2, '0')}</span><div><h2 id={`${group.id}-title`}>{group.title}</h2><p>{group.subtitle}</p><span className="live-category-caption">{liveCategories.find(item => item.id === group.category)?.label}{group.supplement ? ' · 补充辨析' : ''}</span></div><span className="tag">{group.entries.length} 条</span></header>
          {group.source ? <blockquote className="live-source-quote"><div>{group.source.kind === 'manga' ? `漫画原句 · ${group.source.label}` : group.source.label}</div><p lang="ja">{group.source.quote}</p><p lang="zh-CN">{group.source.translation}</p></blockquote> : null}
          <dl className="live-entries">{group.entries.map(item => <div className="live-entry" key={item.expression}>
            <dt><strong lang="ja">{item.expression}</strong>{item.reading !== item.expression ? <span className="live-reading" lang="ja">{item.reading}</span> : null}</dt>
            <dd><p lang="zh-CN">{item.meaning}</p>{item.note ? <p className="live-entry-note" lang="zh-CN">{item.note}</p> : null}</dd>
          </div>)}</dl>
          <div className="live-group-detail">
            <div className="live-points"><h3>用法与辨析</h3>{group.points.map(point => <p key={point}>{point}</p>)}</div>
            <div className="live-examples"><h3>{group.source ? '学习例句 · 日中对照' : '例句 · 日中对照'}</h3>{group.examples.map(example => <div className="example-box" key={example.japanese}><p lang="ja">{example.japanese}</p><span lang="zh-CN">{example.chinese}</span></div>)}</div>
          </div>
          <div className="live-card-footer"><span>{status === 'mastered' ? '已标记掌握' : status === 'review' ? '已加入本页复习' : '尚未标记'}</span><div className="status-actions" role="group" aria-label={`${group.title}的学习状态`}>
            <button className={status === 'review' ? 'status-btn active review' : 'status-btn'} aria-pressed={status === 'review'} onClick={() => toggleStatus(group.id, 'review')}>要復習</button>
            <button className={status === 'mastered' ? 'status-btn active mastered' : 'status-btn'} aria-pressed={status === 'mastered'} onClick={() => toggleStatus(group.id, 'mastered')}>習得済み</button>
          </div></div>
        </article>
      })}
    </div>}
  </section>
}
