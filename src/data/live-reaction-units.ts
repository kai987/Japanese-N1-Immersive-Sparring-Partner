import { liveUnitCountLabel, validateLiveIdentities } from '../lib/liveIdentities.ts'
import { liveReactionGroups, type LiveReactionGroup } from './live-reactions.ts'
import { okashiBokusoGroups } from './live-reactions-2026-09-30.ts'
import { liveOctober29Groups } from './live-reactions-2026-10-29.ts'
import { liveOctober30Groups } from './live-reactions-2026-10-30.ts'
import { liveNovember3Groups } from './live-reactions-2026-11-03.ts'
import { liveNovember4Groups } from './live-reactions-2026-11-04.ts'
import { liveNovember5Groups } from './live-reactions-2026-11-05.ts'

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
// Manga titles are display metadata, not speech or progress identities.
// 09/28 basis (supplemental photos 8-10): くよくよしたって / 気を取り直す /
// 貯金を下ろす / エープリルフール match the returning-Doraemon story.
// https://e-comi.shogakukan.co.jp/books/091400070000d0000000
// https://ameblo.jp/kuro-yokoyama/entry-12398866752.html
// 10/29-30 are consecutive study notes for the same dandelion story:
// glasses/fantasy first, then moving the plant, watering and preparing for winter.
// https://e-comi.shogakukan.co.jp/books/091401080000d0000000
// https://www.tv-asahi.co.jp/doraemon/story/0005/
// https://ameblo.jp/kuro-yokoyama/entry-12403042106.html
// 11/05: https://e-comi.shogakukan.co.jp/books/091400030000d0000000
//        https://dsdb.jp/story/dz-0105 (大全集2 p497; photo shows p501)
// 11/04 basis: おすそわけ・ガムを噛む・貧弱・味が口に伝わる; photo shows 大全集5.
// 11/04: https://dora-world.com/sp/tencomi_detective/autumn19/autumn19_vol001.html
//        https://www.tv-asahi.co.jp/doraemon/story/0387/
// 11/03 basis: ブーメラン・木を征服する・勇気を褒め称える・瞬間移動.
// 11/03: https://e-comi.shogakukan.co.jp/books/091401080000d0000000
//        https://www.tv-asahi.co.jp/doraemon/story/0473/
// 09/30: https://e-comi.shogakukan.co.jp/books/091405040000d0000000
//        https://dora-world.com/contents/1514
export const liveUnits: LiveUnit[] = [
  {
    id: '2026-11-05', date: '2026-11-05', title: 'ドラえもん「ママをとりかえっこ」',
    description: '短篇篇名：ママをとりかえっこ（交换妈妈）。收录于普通单行本第3卷第3话、大全集第2卷第497页起；截图背景可见的第501页属于本篇。学习主题：取り替える・だって・条件と口語表現。笔记标题日期：2026-11-05。来自3张连续手机笔记照片，合并重叠的「Aというか、Bというか」和「戸棚」。原笔记、语境辨析和原创日中例句分别标注；简写和未完片段保留原貌并补充说明。',
    countLabel: liveUnitCountLabel(liveNovember5Groups), groups: liveNovember5Groups,
  },
  {
    id: '2026-11-04', date: '2026-11-04', title: 'ドラえもん「おすそわけガム」',
    description: '相关短篇：おすそわけガム，收录于普通单行本第11卷。根据截图中的大全集第5卷、笔记内容与官方剧情对照识别。学习主题：おすそわけ・口語文法・五感の表現。笔记标题日期：2026-11-04。整理4张连续手机笔记照片，合并截图重叠部分。原笔记保留简写及疑似笔误，学习卡另标常用写法，并补充中文释义和日中例句。',
    countLabel: liveUnitCountLabel(liveNovember4Groups), groups: liveNovember4Groups,
  },
  {
    id: '2026-11-03', date: '2026-11-03', title: 'ドラえもん「スリルブーメラン」',
    description: '相关短篇：スリルブーメラン，收录于普通单行本第18卷第2话。根据笔记与官方剧情对照识别；照片未直接显示漫画篇名。学习主题：感情の擬態語・紛らわしい表現。笔记标题日期：2026-11-03。来自3张连续手机笔记照片，合并重叠内容。保留原笔记的写法，并将用法辨析、规范写法和原创学习例句分别标注；不将全部表达标为N1。',
    countLabel: liveUnitCountLabel(liveNovember3Groups), groups: liveNovember3Groups,
  },
  {
    id: '2026-10-30', date: '2026-10-30', title: 'ドラえもん「タンポポ空を行く」',
    description: '相关短篇：タンポポ空を行く，收录于普通单行本第18卷第20话，接续10月29日的同篇学习。补充照片中的「庭の隅に植え替える」「のどがカラカラ」「水まきをする」「冬に備える」「のび太にならないように」与原作中照顾蒲公英、植物缺水及蚂蚁备冬的情节对应。学习主题：抜き出す・授受・口語と時間の表現。笔记标题日期：2026-10-30。来自5张连续手机笔记照片，合并重叠部分，收录该标题下的64条笔记和4句无独立日期的口语补充。照片中已有的10月29日内容仍保留在原单元，不重复收录。原笔记、用法辨析和学习例句分别标注，不将全部表达标为N1。',
    countLabel: liveUnitCountLabel(liveOctober30Groups), groups: liveOctober30Groups,
  },
  {
    id: '2026-10-29', date: '2026-10-29', title: 'ドラえもん「タンポポ空を行く」',
    description: '相关短篇：タンポポ空を行く，收录于普通单行本第18卷第20话。根据补充照片中的眼镜、幻想及「そう見えるだけ」等线索，与道具「ファンタグラス」和10月30日连续笔记中的蒲公英情节交叉核对；两期为同一短篇的连续学习。学习主题：移動の「を」・断り方・見え方。笔记标题日期：2026-10-29。来自两张连续手机笔记截图，重叠部分合并为35条表达、16组知识点。原笔记与补充辨析、学习例句分别标注；保留简写并说明适用语境，不将全部表达标为N1。',
    countLabel: liveUnitCountLabel(liveOctober29Groups), groups: liveOctober29Groups,
  },
  {
    id: '2026-09-30-okashi-bokuso', date: '2026-09-30', title: 'ドラえもん「おかし牧場」',
    description: '短篇篇名：おかし牧場，收录于普通单行本第24卷第6话。「おかし牧草」是篇中道具名；保留原单元链接与学习标记。整理日期：2026-09-30。来自提供的5张漫画截图与手机笔记的可见文字，收录25个核心知识点及3组补充辨析。每张卡区分漫画原句、手机笔记和学习例句；单元日期不是漫画出版或直播播出日期。',
    countLabel: liveUnitCountLabel(okashiBokusoGroups), groups: okashiBokusoGroups,
  },
  {
    id: '2026-09-28', date: '2026-09-28', title: 'ドラえもん「帰ってきたドラえもん」',
    description: '相关短篇：帰ってきたドラえもん（哆啦A梦回来了），收录于普通单行本第7卷第1话。根据补充照片中的「くよくよしたって」「気を取り直す」「貯金を下ろす」「エープリルフール」，与原作中振作起来、被愚人节谎言戏弄及准备买铜锣烧的情节交叉核对。笔记中的词汇拓展仍属于学习补充。来自提供的2026-09-28直播笔记截图。原有15组、64条表达与学习标记保持不变；不同难度的词汇、口语与语法不统一标为N1。',
    countLabel: liveUnitCountLabel(liveReactionGroups.map((group, index) => ({ ...group, category: legacyCategories[index] }))),
    groups: liveReactionGroups.map((group, index) => ({ ...group, category: legacyCategories[index] })),
  },
]

validateLiveIdentities(liveUnits)

export function liveUnitFromSearch(search: string): LiveUnit {
  const id = new URLSearchParams(search).get('live-unit')
  return liveUnits.find(unit => unit.id === id) ?? liveUnits[0]
}
