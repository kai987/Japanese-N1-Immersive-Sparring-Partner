import { liveReactionGroups, type LiveReactionGroup } from './live-reactions.ts'
import { okashiBokusoGroups } from './live-reactions-2026-09-30.ts'

export const liveCategories = [
  { id: 'grammar', label: '文法・口语' },
  { id: 'vocabulary', label: '词汇' },
  { id: 'transitivity', label: '自动词／他动词' },
  { id: 'wordplay', label: '漫画双关' },
] as const
export type LiveCategory = typeof liveCategories[number]['id']
export interface LiveUnitGroup extends LiveReactionGroup {
  category: LiveCategory
  supplement?: boolean
  source?: { kind: 'manga' | 'note'; label: string; quote: string; translation: string }
}
export interface LiveUnit {
  id: string
  date: string
  title: string
  description: string
  countLabel: string
  groups: LiveUnitGroup[]
}
// Keep every legacy ID and all legacy card data intact. Only add display categories.
const legacyCategories: LiveCategory[] = [
  'grammar', 'grammar', 'vocabulary', 'grammar', 'grammar', 'vocabulary',
  'transitivity', 'vocabulary', 'vocabulary', 'grammar', 'vocabulary',
  'vocabulary', 'vocabulary', 'vocabulary', 'vocabulary',
]
export const liveUnits: LiveUnit[] = [
  {
    id: '2026-09-30-okashi-bokuso', date: '2026-09-30', title: 'ドラえもん「おかし牧草」',
    description: '整理日期：2026-09-30。来自提供的5张漫画截图与手机笔记的可见文字，收录25个核心知识点及3组补充辨析。每张卡区分漫画原句、手机笔记和学习例句；单元日期不是漫画出版或直播播出日期。',
    countLabel: '25 个核心知识点＋3 组补充', groups: okashiBokusoGroups,
  },
  {
    id: '2026-09-28', date: '2026-09-28', title: '直播会话笔记',
    description: '来自提供的2026-09-28直播笔记截图。原有15组、64条表达与学习标记保持不变；不同难度的词汇、口语与语法不统一标为N1。',
    countLabel: '15 组知识点 · 64 条表达',
    groups: liveReactionGroups.map((group, index) => ({ ...group, category: legacyCategories[index] })),
  },
]

export function liveUnitFromSearch(search: string): LiveUnit {
  const id = new URLSearchParams(search).get('live-unit')
  return liveUnits.find(unit => unit.id === id) ?? liveUnits[0]
}
