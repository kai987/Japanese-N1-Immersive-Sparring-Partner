import { liveUnitCountLabel, validateLiveIdentities } from '../lib/liveIdentities.ts'
import { liveReactionGroups, type LiveReactionGroup } from './live-reactions.ts'
import { okashiBokusoGroups } from './live-reactions-2026-09-30.ts'
import { liveOctober29Groups } from './live-reactions-2026-10-29.ts'
import { liveOctober30Groups } from './live-reactions-2026-10-30.ts'

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
  source?: { kind: 'manga' | 'note'; label: string; quote: string; translation: string; readAloud?: boolean }
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
    id: '2026-10-30', date: '2026-10-30', title: '抜き出す・授受・口語と時間の表現',
    description: '笔记标题日期：2026-10-30。来自5张连续手机笔记照片，合并重叠部分，收录该标题下的64条笔记和4句无独立日期的口语补充。照片中已有的10月29日内容仍保留在原单元，不重复收录。原笔记、用法辨析和学习例句分别标注，不将全部表达标为N1。',
    countLabel: liveUnitCountLabel(liveOctober30Groups), groups: liveOctober30Groups,
  },
  {
    id: '2026-10-29', date: '2026-10-29', title: '移動の「を」・断り方・見え方',
    description: '笔记标题日期：2026-10-29。来自两张连续手机笔记截图，重叠部分合并为35条表达、16组知识点。原笔记与补充辨析、学习例句分别标注；保留简写并说明适用语境，不将全部表达标为N1。',
    countLabel: liveUnitCountLabel(liveOctober29Groups), groups: liveOctober29Groups,
  },
  {
    id: '2026-09-30-okashi-bokuso', date: '2026-09-30', title: 'ドラえもん「おかし牧草」',
    description: '整理日期：2026-09-30。来自提供的5张漫画截图与手机笔记的可见文字，收录25个核心知识点及3组补充辨析。每张卡区分漫画原句、手机笔记和学习例句；单元日期不是漫画出版或直播播出日期。',
    countLabel: liveUnitCountLabel(okashiBokusoGroups), groups: okashiBokusoGroups,
  },
  {
    id: '2026-09-28', date: '2026-09-28', title: '直播会话笔记',
    description: '来自提供的2026-09-28直播笔记截图。原有15组、64条表达与学习标记保持不变；不同难度的词汇、口语与语法不统一标为N1。',
    countLabel: liveUnitCountLabel(liveReactionGroups.map((group, index) => ({ ...group, category: legacyCategories[index] }))),
    groups: liveReactionGroups.map((group, index) => ({ ...group, category: legacyCategories[index] })),
  },
]

validateLiveIdentities(liveUnits)

export function liveUnitFromSearch(search: string): LiveUnit {
  const id = new URLSearchParams(search).get('live-unit')
  return liveUnits.find(unit => unit.id === id) ?? liveUnits[0]
}
