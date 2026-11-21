import { Icon, SectionHeader } from '../components/StudyUI'
import type { DailyLesson, SectionId, PracticeCategory } from '../types'
import type { LessonReviewItem } from '../lib/lessonReview'
import { practiceHref } from '../lib/questionReview'
import { practiceCategoryLabels } from '../components/PracticeExercises'
import type { ManualReviewItem, OpenQuestion } from './types'

export function ReviewPage({ lesson, reviewItems, manualReviewItems, go, openQuestion, setReturnCardTarget }:  { lesson: DailyLesson; reviewItems: LessonReviewItem[]; manualReviewItems: ManualReviewItem[]; go: (section: SectionId) => void; openQuestion: OpenQuestion; setReturnCardTarget: (target: { section: SectionId; id: string }) => void }) {
  return (
  <div className="page-enter">
    <SectionHeader eyebrow="REVIEW" title="この日の実際の誤答" description="提出した回答で一度でも間違えた問題だけを表示します。未回答・初回から正解の問題は入りません。" />
    <p className="review-counts">Day {lesson.day} · {lesson.date} · 誤答した問題 {reviewItems.length}問 · 本日までの復習対象 {reviewItems.filter(item => item.state.due).length}問</p>
    {reviewItems.length === 0 ? (
      <div className="empty-state"><div className="empty-icon"><Icon name="check" size={26} /></div><h3>この日の誤答記録はありません</h3><p>語彙・文法・読解で回答を提出し、間違えた問題だけが追加されます。まだ解いていない問題を習得済みとは判定しません。</p><button className="text-btn" onClick={() => go(lesson.practice ? 'vocabulary' : 'reading')}>問題を解く</button></div>
    ) : (
      <div className="review-list">
        {(['vocabulary', 'grammar', 'reading'] as PracticeCategory[]).map(category => {
          const items = reviewItems.filter(item => item.category === category)
          return items.length ? <section key={category} aria-label={`${practiceCategoryLabels[category]}の誤答`}>
            <h3 className="review-category-heading">{practiceCategoryLabels[category]} · {items.length}問</h3>
            {items.map((item, index) => <div className="review-row" data-review-question={item.question.id} data-due={item.state.due} key={item.question.id}>
              <span className="review-number">{index + 1}</span><span className="review-type">{category === 'vocabulary' ? '語彙' : category === 'grammar' ? '文法' : '読解'}</span>
              <div><strong>{item.question.prompt}</strong>
                <p>{item.group?.title ?? '以前の主旨問題'} · {item.state.streak < 2 ? `連続正解 ${item.state.streak}/2 · 引き続き復習` : `連続正解 ${item.state.streak}回 · 復習間隔を延長`}</p>
                <p>{item.state.dueDate ? `${item.state.due ? '復習日' : '次の復習'}：${item.state.dueDate}` : '回答日時不明 · 復習待ち'} · {item.state.intervalDays}日間隔</p>
              </div>
              <a className="review-question-link" href={practiceHref(lesson.date, category, item.question.id)} aria-label={`${item.question.prompt}を復習する`} onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault(); openQuestion(category, item.question.id, true)
              }}>元の問題で復習する →</a>
            </div>)}
          </section> : null
        })}
      </div>
    )}
    <section className="spaced-review">
      <div><span className="section-index">SPACED REVIEW</span><h3>実際の回答に合わせて復習</h3><p>誤答後は翌日から復習。実際に2回正解するまでは頻度を下げず、その後3・7・14日間隔へ進みます。再び間違えたら翌日から再開し、以前の履歴も残します。</p></div>
      <div className="intervals"><span>1 日</span><i /><span>3 日</span><i /><span>7 日</span><i /><span>14 日</span></div>
    </section>
    {manualReviewItems.length > 0 && <section className="manual-review-section" aria-label="自分でマークした学習カード">
      <h3>自分でマークした学習カード</h3><p>「要復習」にしたカードです。問題の誤答件数には含めません。</p>
      {manualReviewItems.map(item => <div className="manual-review-row" key={item.id}>
        <span className="tag">{item.type}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div>
        <button className="text-btn" onClick={() => { go(item.section); setReturnCardTarget({ section: item.section, id: item.id }) }}>カードを見る</button>
      </div>)}
    </section>}
  </div>
  )
}
