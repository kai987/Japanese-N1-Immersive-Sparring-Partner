from pathlib import Path
import hashlib
r=Path('.')
hashes={'src/types.ts': ['fb029b7cbfce4cdad6088af4fdbc0ee5de439bd1578f7659ee059c07d25b1fc7', 'c81f32317d95954ac637b7be077aac3794e04e1f42f4ad7d8201dbf5ee279578'], 'src/data/history.ts': ['ea1dcecf54498fff772a4262dfbb54cf886af428fbed4710f0d2c8d85dfea31d', '1634d8847b743a030305ad68683f46affa13bfc5c9bb9c9bf8e45281f0b5f1b5'], 'scripts/validate-content.ts': ['d788ffad70118c2580cf8375497d9195c9c0556c7b44eceb36e07b86990fefd4', 'a435092ca380553f1dba75b4e5b2e620ff7be18d7cf2baf1777cbf48365c7c3b'], 'src/App.tsx': ['a405215d536c7b6115ffe992bedeb83f5d6f0bb8f034bcd47974c573a3e91433', '34b6a6cb6003606a60f58474cc45b6b81662e98683eda3ea11623e0c133af374'], 'package.json': ['c0cf8b25e87e59902cc7ac83b993017e04704201c7b9711db978833dbc81e584', 'a44fb5728a760f296c03165e9eb97e0927a74bd7f87689b134f2707d48340ab8'], 'src/data/daily/README.md': ['778985720f038328289321315536023c4477d992beca456de71109926f2febcd', '398686255163807619209cbfa22546e0d1f6e459e772ce738163312d7b1c56e3']}
for name,(before,after) in hashes.items():
 assert hashlib.sha256((r/name).read_bytes()).hexdigest()==before, f'Concurrent change: {name}'
p=r/'src/types.ts'
s=p.read_text()
s=s.replace('export interface VocabularyItem {','''export interface ReportFrequency {
  appearedDays: number
  totalDays: number
  percent: number
  appearedDates: string[]
}
export interface StudyMetadata {
  studyKind?: 'new' | 'review'
  firstIntroducedDate?: string
  reportFrequency?: ReportFrequency
  reviewEvidence?: { form: string; excerpt: string; sourceKind: string }
}

export interface VocabularyItem extends StudyMetadata {''').replace("jlpt: 'N1' | 'N2'","jlpt: 'N1' | 'N2' | 'N3' | 'N5/N4'").replace('export interface GrammarItem {','export interface GrammarItem extends StudyMetadata {').replace('export interface DailyLesson {','export interface DailyLesson {\n  issueNumber?: number\n  studyFrequencyScope?: string\n  studyVocabularyNote?: string\n  studyGrammarNote?: string')
p.write_text(s)
p=r/'src/data/history.ts'
s=p.read_text().replace("import type { DailyLesson } from '../types'","import type { DailyLesson } from '../types'\nimport rawStudySnapshot from './it-study-snapshot.json'\nimport { validateStudySnapshot, withItStudy, type StudySnapshot } from '../lib/itStudy'\nconst studySnapshot = validateStudySnapshot(rawStudySnapshot as StudySnapshot)")
s=s.replace('const lessonByDate = catalog.byDate\nexport const lessons: DailyLesson[] = catalog.lessons',"export const lessons: DailyLesson[] = catalog.lessons.map(lesson => withItStudy(lesson,studySnapshot))\nconst lessonByDate = new Map(lessons.map(lesson => [lesson.date,lesson]))")
p.write_text(s)
p=r/'scripts/validate-content.ts'
s=p.read_text().replace("import { lessons }", "import { validateStudySnapshot, withItStudy, type StudySnapshot } from '../src/lib/itStudy.ts'\nimport { lessons }")
s=s.replace('  return catalog',"  const snapshot = validateStudySnapshot(JSON.parse(readFileSync(new URL('../src/data/it-study-snapshot.json',import.meta.url),'utf8')) as StudySnapshot)\n  for (const lesson of catalog.lessons) {\n    const displayed=withItStudy(lesson,snapshot)\n    for (const cards of [displayed.vocabulary,displayed.grammar]) if(new Set(cards.map(card=>card.id)).size!==cards.length) throw new Error(`${lesson.date}: duplicate study progress id`)\n  }\n  return catalog")
p.write_text(s)
p=r/'src/App.tsx'
s=p.read_text().replace("import { useEffect,", "import { Fragment, useEffect,")
s=s.replace("import './history.css'", "import './history.css'\nimport './study-reference.css'\nimport { StudyReference, ReviewEvidence } from './components/StudyReference'")
s=s.replace('<h1>{lesson.title}</h1>','<h1>{lesson.title}{lesson.issueNumber ? `（第${lesson.issueNumber}号）` : null}</h1>')
s=s.replace('<p>{lesson.subtitle}</p>', '<p>{lesson.subtitle}</p>\n                  {lesson.issueNumber && <small className="source-issue">IT/AI 日报第{lesson.issueNumber}号 · N1 学習計画 Day {lesson.day}（別の番号です）</small>}')
s=s.replace('<div className="learning-list">\n                {lesson.vocabulary', '''{lesson.studyVocabularyNote && <p>{lesson.studyVocabularyNote}</p>}
              {lesson.vocabulary.some(item=>item.studyKind) && <p className="study-count">新学 {lesson.vocabulary.filter(item=>item.studyKind==='new').length} ＋ 復習 {lesson.vocabulary.filter(item=>item.studyKind==='review').length} ＝ {lesson.vocabulary.length}語</p>}
              <div className="learning-list">
                {lesson.vocabulary''')
s=s.replace('<article className="learning-card" key={item.id}>','''<Fragment key={item.id}>
                    {item.studyKind==='review' && (index===0 || lesson.vocabulary[index-1].studyKind!=='review') && <h2 className="review-group-title">本文で復習できる既習語彙</h2>}
                    <article className="learning-card" data-study-kind={item.studyKind}>''',1)
s=s.replace('<span className="tag">{item.partOfSpeech}</span></div>','<span className="tag">{item.partOfSpeech}</span><StudyReference item={item} level={item.jlpt} /></div>')
s=s.replace('<p className="meaning">{item.meaning}</p>\n                        <div', '<p className="meaning">{item.meaning}</p>\n                        <ReviewEvidence item={item} />\n                        <div',1)
s=s.replace('                    </article>\n                  )','                    </article>\n                    </Fragment>\n                  )',1)
s=s.replace('<div className="learning-list grammar-list">', '''{lesson.studyGrammarNote && <p>{lesson.studyGrammarNote}</p>}
              <div className="learning-list grammar-list">''')
s=s.replace('<article className="learning-card" key={item.id}>','''<Fragment key={item.id}>
                    {item.studyKind==='review' && (index===0 || lesson.grammar[index-1].studyKind!=='review') && <h2 className="review-group-title">本文で復習できる既習文法</h2>}
                    <article className="learning-card" data-study-kind={item.studyKind}>''',1)
s=s.replace('<div className="frequency" title="読解・表現での実用度">','<StudyReference item={item} level={item.level ?? \'N1\'} /><div className="frequency" title="読解・表現での実用度">')
s=s.replace('<p className="grammar-explain">{item.explanation}</p>','<p className="grammar-explain">{item.explanation}</p>\n                        <ReviewEvidence item={item} />')
s=s.replace("<StatusButton status={status} onChange={(next) => updateStatus('grammar', item.id, next)} />\n                      </div>\n                    </article>","<StatusButton status={status} onChange={(next) => updateStatus('grammar', item.id, next)} />\n                      </div>\n                    </article>\n                    </Fragment>")
p.write_text(s)
p=r/'package.json'
s=p.read_text().replace('"import:daily": "node scripts/import-daily.ts"', '"import:daily": "node scripts/import-daily.ts",\n    "import:study": "node scripts/import-study-snapshot.ts"')
p.write_text(s)
p=r/'src/data/daily/README.md'
p.write_text(p.read_text()+'\n## 2026-09-18 起：新学＋复习与真实出现频率\n\n原始每日JSON中的重点新词/新语法继续遵守上述新规查重；不要把复习混入这些数组伪装成新项目。展示层使用 `src/data/it-study-snapshot.json` 的上游验证结果，从2026-09-18起展示完整新学＋复习20词/7语法，并分开标记。不会重写 n1-source、沉浸正文、读解或错题队列。\n\n11:00同步在当天原始JSON写入之外，必须同步同一上游发布commit的 `it-study-snapshot` Actions artifact，核对 `sourceCommit`、当天日期以及最终Deploy成功后，运行 `npm run import:study -- /path/to/study-index.json`；再执行validate:content、tests、build、浏览器测试并发布。snapshot缺失当日或来自不同上游commit时，停止，不能用昨天的snapshot冒充。\n\n`src/lib/itStudy.ts` 独立校验新学/复习身份、同日重复、复习首次日期、当前用例、日期集合、频率及期号；原有新规语法查重未关闭。频率继承IT日报全部日期的分母，不用本站N1 Day天数。标题“第XX号”是IT日报期号，保留N1计划Day作为另一个标记。旧词条同日同义同例句复用原ID，新项目/不同例句生成稳定新ID，避免错误继承掌握状态。\n')
for name,(before,after) in hashes.items():
 assert hashlib.sha256((r/name).read_bytes()).hexdigest()==after, f'Postimage mismatch: {name}'
print('Six source edits match exact verified pre/post SHA-256.')
