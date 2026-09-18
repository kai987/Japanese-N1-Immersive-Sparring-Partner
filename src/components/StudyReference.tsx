import type { StudyMetadata } from '../types'
export function StudyReference({ item, level }: {item:StudyMetadata;level:string}) {
  const f=item.reportFrequency
  return <div className="study-reference">
    <span className="tag">参考：{level}</span>
    {item.studyKind && <span className={`study-kind ${item.studyKind}`}>{item.studyKind==='review'?'復習':'新学'}</span>}
    {f && <details className="study-frequency" data-frequency-days={f.appearedDays} data-frequency-total={f.totalDays}>
      <summary>出现频率：{f.percent.toFixed(1)}%（{f.appearedDays}/{f.totalDays}天）</summary>
      <p>日文日报正文、推荐理由及学习卡片。同一天及中日镜像只计一次，不含外链全文；分母是IT日报总天数，不是N1计划天数。</p>
      <p>{f.appearedDates.join(' · ')}</p>
    </details>}
  </div>
}
export function ReviewEvidence({item}:{item:StudyMetadata}) {
  return item.studyKind==='review' && item.reviewEvidence ? <div className="review-evidence">
    <strong>本文での用例</strong><p lang="ja">{item.reviewEvidence.excerpt}</p>
    <small>首次学习：{item.firstIntroducedDate} · {item.reviewEvidence.sourceKind==='article-summary'?'当日报道的推荐理由':item.reviewEvidence.sourceKind==='learning-example'?'当日学习例句':'当日日文正文'}</small>
  </div>:null
}
