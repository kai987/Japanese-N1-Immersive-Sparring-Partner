import type { DailyLesson, GrammarItem, VocabularyItem, StudyMetadata, ReportFrequency } from '../types.ts'
import { grammarIdentity } from './grammarHistory.ts'

interface SourceCard extends StudyMetadata {
  identity: string
  studyKind: 'new' | 'review'
  firstIntroducedDate: string
  reportFrequency: ReportFrequency
  term?: string
  pattern?: string
  reading?: string
  level: string
  partOfSpeech?: string
  meaning: string
  structure?: string
  usage?: string
  note?: string
  nuance?: string
  exampleJa: string
  exampleMeaning?: string
  collocations?: string[]
  sourceUrl?: string
  sourceForm?: string
  sourceAnchor?: string
}
export interface StudySnapshot {
  schemaVersion: number
  sourceCommit: string
  frequencyScope: string
  policy: { effectiveFrom: string; vocabularyTarget: number; grammarTarget: number; grammarEffectiveFrom?: string; grammarMinimum?: number; grammarMaximum?: number }
  totalDays: number
  firstDate: string
  lastDate: string
  issueNumbers: Record<string,number>
  vocabularyFrequency: Record<string,ReportFrequency>
  grammarFrequency: Record<string,ReportFrequency>
  firstVocabulary: Record<string,string>
  firstGrammar: Record<string,string>
  lessons: Record<string, { issueNumber: number; vocabulary: SourceCard[]; grammar: SourceCard[]; reviewVocabularyNote?: string; reviewGrammarNote?: string }>
  grammarLessons?: Record<string, { issueNumber: number; grammar: SourceCard[]; reviewGrammarNote?: string }>
}
const dayPattern = /^\d{4}-\d{2}-\d{2}$/
const lexicalKey = (value: string) => value.normalize('NFKC').replace(/\s+/g,'').replace(/する$/,'')
const same = (a: unknown,b: unknown) => JSON.stringify(a) === JSON.stringify(b)
export function validateStudySnapshot(snapshot: StudySnapshot) {
  if (snapshot.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(snapshot.sourceCommit)) throw new Error('Invalid IT study source commit or schema')
  const dates = Object.keys(snapshot.issueNumbers).sort()
  if (!dates.length || snapshot.totalDays !== dates.length || dates[0] !== snapshot.firstDate || dates.at(-1) !== snapshot.lastDate) throw new Error('Incomplete IT report denominator')
  dates.forEach((date,index) => { if (!dayPattern.test(date) || snapshot.issueNumbers[date] !== index+1) throw new Error('Invalid issue sequence') })
  const frequency = (f: ReportFrequency) => {
    if (!f || f.totalDays !== dates.length || f.appearedDays !== new Set(f.appearedDates).size || f.appearedDates.some(date => !snapshot.issueNumbers[date]) || f.percent !== Number((f.appearedDays / f.totalDays * 100).toFixed(1))) throw new Error('Invalid IT report frequency')
  }
  Object.values(snapshot.vocabularyFrequency).forEach(frequency)
  Object.values(snapshot.grammarFrequency).forEach(frequency)
  for (const [date,lesson] of Object.entries(snapshot.lessons)) {
    if (date < snapshot.policy.effectiveFrom || lesson.issueNumber !== snapshot.issueNumbers[date]) throw new Error(`${date}: invalid source issue`)
    for (const kind of ['vocabulary','grammar'] as const) {
      const cards = lesson[kind], seen = new Set<string>()
      const target = kind === 'vocabulary' ? snapshot.policy.vocabularyTarget : (snapshot.policy.grammarMinimum ?? snapshot.policy.grammarTarget)
      const introduction = kind === 'vocabulary' ? snapshot.firstVocabulary : snapshot.firstGrammar
      const frequencies = kind === 'vocabulary' ? snapshot.vocabularyFrequency : snapshot.grammarFrequency
      if (!Array.isArray(cards)) throw new Error(`${date}: missing ${kind}`)
      for (const card of cards) {
        if (!card.identity || seen.has(card.identity) || !card.exampleJa || !card.meaning || !['N1','N2','N3','N5/N4'].includes(card.level)) throw new Error(`${date}: invalid/duplicate study card`)
        seen.add(card.identity)
        if (introduction[card.identity] !== card.firstIntroducedDate) throw new Error(`${date}: introduction mismatch`)
        if (card.studyKind === 'new') {
          if (card.firstIntroducedDate !== date) throw new Error(`${date}: repeated NEW item`)
        } else if (card.studyKind === 'review') {
          if (card.firstIntroducedDate >= date || !card.reviewEvidence?.form || !card.reviewEvidence.excerpt.includes(card.reviewEvidence.form)) throw new Error(`${date}: invalid review evidence`)
        } else throw new Error(`${date}: missing new/review distinction`)
        frequency(card.reportFrequency)
        if (!same(card.reportFrequency,frequencies[card.identity]) || !card.reportFrequency.appearedDates.includes(date)) throw new Error(`${date}: inconsistent frequency`)
      }
      if (kind === 'grammar' && cards.length > (snapshot.policy.grammarMaximum ?? snapshot.policy.grammarTarget)) throw new Error(`${date}: grammar exceeds range ceiling`)
      if (cards.length < target && !(kind === 'vocabulary' ? lesson.reviewVocabularyNote : lesson.reviewGrammarNote)) throw new Error(`${date}: unexplained study shortfall`)
    }
  }
  if (snapshot.grammarLessons) {
    const {grammarEffectiveFrom,grammarMinimum,grammarMaximum}=snapshot.policy
    if(!grammarEffectiveFrom || grammarMinimum!==5 || grammarMaximum!==8)throw new Error('Invalid grammar range policy')
    const required=dates.filter(date=>date>=grammarEffectiveFrom)
    if(!same(Object.keys(snapshot.grammarLessons).sort(),required))throw new Error('Incomplete historical grammar snapshot')
    for(const [date,entry] of Object.entries(snapshot.grammarLessons)){
      if(entry.issueNumber!==snapshot.issueNumbers[date] || !Array.isArray(entry.grammar))throw new Error(`${date}: invalid historical grammar issue`)
      const seen=new Set<string>()
      for(const card of entry.grammar){
        if(!card.identity || seen.has(card.identity) || !card.pattern || !card.exampleJa || !card.meaning || !['N1','N2','N3','N5/N4'].includes(card.level))throw new Error(`${date}: invalid/duplicate historical grammar card`)
        seen.add(card.identity)
        if(snapshot.firstGrammar[card.identity]!==card.firstIntroducedDate)throw new Error(`${date}: historical introduction mismatch`)
        if(card.studyKind==='new'){
          if(card.firstIntroducedDate!==date)throw new Error(`${date}: repeated NEW historical grammar`)
        }else if(card.studyKind==='review'){
          if(card.firstIntroducedDate>=date || !card.reviewEvidence?.form || !card.reviewEvidence.excerpt.includes(card.reviewEvidence.form))throw new Error(`${date}: invalid historical review evidence`)
        }else throw new Error(`${date}: missing historical new/review label`)
        frequency(card.reportFrequency)
        if(!same(card.reportFrequency,snapshot.grammarFrequency[card.identity]) || !card.reportFrequency.appearedDates.includes(date))throw new Error(`${date}: inconsistent historical frequency`)
      }
      if(entry.grammar.length>grammarMaximum)throw new Error(`${date}: historical grammar exceeds range ceiling`)
      if(entry.grammar.length<grammarMinimum && !entry.reviewGrammarNote)throw new Error(`${date}: unexplained historical grammar shortfall`)
      if(snapshot.lessons[date] && !same(entry.grammar,snapshot.lessons[date].grammar))throw new Error(`${date}: inconsistent full and grammar-only views`)
    }
  }
  return snapshot
}
// Stable per-day/content keys: inserting a review never inherits another card's progress.
function stableId(date: string,kind: string,identity: string,example: string) {
  let hash=2166136261
  for(const character of `${identity}\0${example}`) {hash ^= character.codePointAt(0)!; hash = Math.imul(hash,16777619)}
  return `${date}-${kind}-study-${(hash>>>0).toString(16)}`
}
const metadata = (card: SourceCard): StudyMetadata => ({studyKind:card.studyKind,firstIntroducedDate:card.firstIntroducedDate,reportFrequency:card.reportFrequency,reviewEvidence:card.reviewEvidence})
export function withItStudy(lesson: DailyLesson,snapshot: StudySnapshot): DailyLesson {
  const issueNumber = snapshot.issueNumbers[lesson.date]
  if (!issueNumber) return lesson
  // Earlier independent N1 courses are not IT daily mirrors. Historical grammar
  // overlays begin at the first actual IT-sourced lesson; vocabulary stays raw.
  const historical = lesson.date >= '2026-09-09' ? snapshot.grammarLessons?.[lesson.date] : undefined
  const source = snapshot.lessons[lesson.date] ?? (historical ? {
    grammar:historical.grammar,vocabulary:undefined,
    reviewGrammarNote:historical.reviewGrammarNote,reviewVocabularyNote:undefined,
  } : undefined)
  if (!source) return {...lesson,issueNumber,studyFrequencyScope:snapshot.frequencyScope,
    vocabulary:lesson.vocabulary.map(card => ({...card,reportFrequency:snapshot.vocabularyFrequency[card.word] ?? snapshot.vocabularyFrequency[lexicalKey(card.word)]})),
    grammar:lesson.grammar.map(card => ({...card,reportFrequency:snapshot.grammarFrequency[grammarIdentity(card.pattern)]})),
  }
  const vocabulary: VocabularyItem[] = source.vocabulary?.map(card => {
    const existing = lesson.vocabulary.find(item => item.word === card.term && item.reading === card.reading && item.example === card.exampleJa)
    return {id:existing?.id ?? stableId(lesson.date,'v',card.identity,card.exampleJa),word:card.term!,reading:card.reading!,meaning:card.meaning,
      jlpt:card.level as VocabularyItem['jlpt'],partOfSpeech:card.partOfSpeech ?? '',example:card.exampleJa,translation:card.exampleMeaning ?? '',
      collocations:card.collocations ?? [],nuance:card.nuance ?? card.note ?? '',...metadata(card)}
  }) ?? lesson.vocabulary.map(card => ({...card,reportFrequency:snapshot.vocabularyFrequency[card.word] ?? snapshot.vocabularyFrequency[lexicalKey(card.word)]}))
  const grammar: GrammarItem[] = source.grammar.map(card => {
    const existing=lesson.grammar.find(item=>grammarIdentity(item.pattern)===card.identity && item.example===card.exampleJa)
    return {id:existing?.id ?? stableId(lesson.date,'g',card.identity,card.exampleJa),pattern:card.pattern!,level:card.level,meaning:card.meaning,
      form:card.structure ?? '',register:card.usage ?? '',frequency:existing?.frequency ?? 3,explanation:card.usage ?? '',example:card.exampleJa,
      translation:card.exampleMeaning ?? '',comparison:card.note ?? '',sourceUrl:card.sourceUrl,sourceForm:card.sourceForm,sourceAnchor:card.sourceAnchor,...metadata(card)}
  })
  return {...lesson,issueNumber,vocabulary,grammar,studyFrequencyScope:snapshot.frequencyScope,
    studyVocabularyNote:source.reviewVocabularyNote,studyGrammarNote:source.reviewGrammarNote,
    grammarSelectionNote:`新規${grammar.filter(card=>card.studyKind==='new').length}項目＋本文で復習できる既習文法${grammar.filter(card=>card.studyKind==='review').length}項目。新規文型の全履歴重複チェックは維持しています。`,
  }
}
