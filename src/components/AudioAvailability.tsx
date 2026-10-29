import { audioAvailability } from '../lib/audioClient'

export function AudioAvailability({ liveUnitId }: { liveUnitId?: string }) {
  const pending = liveUnitId ? audioAvailability.pendingByLiveUnit[liveUnitId] ?? 0 : audioAvailability.pendingClips
  if (!pending) return null
  const verified = audioAvailability.verifiedAt ? new Date(audioAvailability.verifiedAt) : null
  const updated = verified && Number.isFinite(verified.getTime())
    ? new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(verified) : null
  return <aside className="audio-availability" aria-label="音声の準備状況">
    <p><strong>{liveUnitId ? '当前单元' : '全站'}有 {pending} 段音频待配音</strong><span>文字可正常学习；音频会在既定后台时段继续准备。</span></p>
    {updated ? <small>已发布音频索引更新：{updated}（日本时间）</small> : null}
  </aside>
}
