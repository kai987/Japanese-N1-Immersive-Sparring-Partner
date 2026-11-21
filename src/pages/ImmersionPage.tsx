import { Icon, SectionHeader } from '../components/StudyUI'
import { AudioButton, SentenceAudio } from '../components/AudioButton'
import type { LessonPageProps } from './types'
import type { ReadingMode } from '../types'

export function ImmersionPage({ lesson, highlight, go, readingMode, setReadingMode, completed, markImmersionComplete }: LessonPageProps & { readingMode: ReadingMode; setReadingMode: (mode: ReadingMode) => void; completed: boolean; markImmersionComplete: () => void }) {
  return (
  <div className="page-enter reading-page">
    <SectionHeader eyebrow="01" title="没入読解" description="まずは日本語だけで読み、分からない部分は前後の文脈から推測しましょう。" />
    <div className="mode-switch" role="group" aria-label="読解の表示モード">
      {([['japanese', '日本語のみ'], ['bilingual', '日中対訳'], ['analysis', '解説']] as [ReadingMode, string][]).map(([mode, label]) => (
        <button key={mode} className={readingMode === mode ? 'active' : ''} onClick={() => setReadingMode(mode)}>{label}</button>
      ))}
    </div>

    <article className="reading-paper">
      <div className="article-head" id="immersion-title" tabIndex={-1}><span>N1 IMMERSION · DAY {lesson.day}</span><div className="audio-heading"><h1>{highlight(lesson.immersion.title)}</h1><AudioButton text={lesson.immersion.title} /></div></div>
      {lesson.immersion.paragraphs.map((p, index) => (
        <div className="paragraph-block" id={`immersion-paragraph-${index}`} tabIndex={-1} key={`${lesson.date}-${index}`}>
          <p className="jp-body"><SentenceAudio text={p} renderText={highlight} /></p>
          {readingMode === 'bilingual' ? <p className="zh-translation">{highlight(lesson.immersion.translations[index])}</p> : null}
          {readingMode === 'analysis' ? <div className="analysis-note"><span>POINT {index + 1}</span><p>{highlight(lesson.immersion.analysis[index])}</p></div> : null}
        </div>
      ))}
      <div className="article-finish">
        <button className={completed ? 'complete-btn completed' : 'complete-btn'} onClick={markImmersionComplete}>
          <Icon name="check" size={17} /> {completed ? '読了済み' : '読了にする'}
        </button>
        <button className="next-link" onClick={() => go('vocabulary')}>次へ：N1 語彙 <Icon name="arrow" size={16} /></button>
      </div>
    </article>
  </div>
  )
}
