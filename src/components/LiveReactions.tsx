import { useState } from 'react'
import { liveReactionDate, liveReactionGroups } from '../data/live-reactions'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { decodeLiveProgress, initialLiveProgress, liveProgressKey, matchesLiveGroup, type LiveStatus } from '../lib/liveReactions'
import '../live-reactions.css'

const statusFilters: { value: 'all' | LiveStatus; label: string }[] = [
  { value: 'all', label: '全部' }, { value: 'new', label: '未标记' },
  { value: 'review', label: '要復習' }, { value: 'mastered', label: '習得済み' },
]

export default function LiveReactions() {
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState('all')
  const [filter, setFilter] = useState<'all' | LiveStatus>('all')
  const [progress, setProgress, storage] = useLocalStorage(liveProgressKey, initialLiveProgress, decodeLiveProgress)
  const entries = liveReactionGroups.reduce((sum, group) => sum + group.entries.length, 0)
  const mastered = liveReactionGroups.filter(group => progress.groups[group.id] === 'mastered').length
  const visible = liveReactionGroups.filter(group => (groupId === 'all' || group.id === groupId)
    && (filter === 'all' || (progress.groups[group.id] ?? 'new') === filter) && matchesLiveGroup(group, query))
  const resetFilters = () => { setQuery(''); setGroupId('all'); setFilter('all') }
  const toggleStatus = (id: string, next: LiveStatus) => setProgress(prev => ({ version: 1,
    groups: { ...prev.groups, [id]: prev.groups[id] === next ? 'new' : next } }))

  return <section className="page-enter live-page" aria-labelledby="live-title">
    <header className="live-header">
      <span className="section-index">LIVE NOTES · {liveReactionDate}</span>
      <h1 id="live-title">直播条反</h1>
      <p>把直播里的日语，整理成可以反复复习的知识。</p>
      <p className="live-source-note">来自提供的 2026-09-28 直播笔记截图，按 15 组整理。包含不同难度的词汇、口语和语法，不统一标为 N1；例句与辨析为学习补充。</p>
    </header>

    <div className="live-summary" aria-label="直播笔记学习概要">
      <div><span>知识分组</span><strong>{liveReactionGroups.length}<small> 组</small></strong></div>
      <div><span>图片表达 · 去重</span><strong>{entries}<small> 条</small></strong></div>
      <div><span>已标记掌握</span><strong>{mastered}<small> / {liveReactionGroups.length} 组</small></strong></div>
    </div>
    <p className="live-progress-note">本页按组保存学习状态，仅保存在当前浏览器；与每日 N1 教材的学习记录分开，不会自动标记为已掌握。</p>

    {storage.failed ? <div className="storage-notice" role="alert"><p>无法保存直播笔记的学习状态；关闭页面后，本次更改可能丢失。</p><button className="text-btn" onClick={storage.retry}>重试保存</button></div>
      : storage.recovered ? <div className="storage-notice" role="status"><p>部分直播学习记录无法读取；可读取的记录已保留，每日教材记录不受影响。</p><button className="text-btn" onClick={storage.dismiss}>关闭提示</button></div> : null}

    <div className="live-toolbar">
      <label className="live-search"><span>搜索本页笔记</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="日语、读音或中文，例如 気になる / 果断" /></label>
      <label className="live-group-select"><span>选择知识组</span><select value={groupId} onChange={event => setGroupId(event.target.value)}>
        <option value="all">全部 15 组</option>
        {liveReactionGroups.map((group, index) => <option key={group.id} value={group.id}>{String(index + 1).padStart(2, '0')} · {group.title}</option>)}
      </select></label>
    </div>
    <div className="live-filter-row">
      <div className="live-status-filters" role="group" aria-label="筛选学习状态">{statusFilters.map(item => <button key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
      <span className="live-result-count" role="status">显示 {visible.length} / {liveReactionGroups.length} 组</span>
    </div>

    {visible.length === 0 ? <div className="live-empty"><h2>没有匹配的知识组</h2><p>试试其他关键词，或清除筛选条件。</p><button className="text-btn" onClick={resetFilters}>清除筛选</button></div> : <div className="live-group-list">
      {visible.map(group => {
        const index = liveReactionGroups.indexOf(group)
        const status = progress.groups[group.id] ?? 'new'
        return <article className="live-group-card" key={group.id} data-live-group={group.id} aria-labelledby={`${group.id}-title`}>
          <header className="live-group-heading"><span className="live-group-number">{String(index + 1).padStart(2, '0')}</span><div><h2 id={`${group.id}-title`}>{group.title}</h2><p>{group.subtitle}</p></div><span className="tag">{group.entries.length} 条</span></header>
          <dl className="live-entries">{group.entries.map(item => <div className="live-entry" key={item.expression}>
            <dt><strong lang="ja">{item.expression}</strong>{item.reading !== item.expression ? <span className="live-reading" lang="ja">{item.reading}</span> : null}</dt>
            <dd><p lang="zh-CN">{item.meaning}</p>{item.note ? <p className="live-entry-note" lang="zh-CN">{item.note}</p> : null}</dd>
          </div>)}</dl>
          <div className="live-group-detail">
            <div className="live-points"><h3>用法与辨析</h3>{group.points.map(point => <p key={point}>{point}</p>)}</div>
            <div className="live-examples"><h3>例句 · 日中对照</h3>{group.examples.map(example => <div className="example-box" key={example.japanese}><p lang="ja">{example.japanese}</p><span lang="zh-CN">{example.chinese}</span></div>)}</div>
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
