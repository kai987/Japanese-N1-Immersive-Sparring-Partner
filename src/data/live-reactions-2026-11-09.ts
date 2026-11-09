import type { LiveReactionEntry, LiveReactionExample } from './live-reactions.ts'
import type { LiveUnitGroup } from './live-reaction-units.ts'

// Four overlapping phone-note photos headed 26-11-09.
// The title comes from the separate manga title photo. Examples are original.
const entry = (id: string, expression: string, reading: string, meaning: string, note?: string): LiveReactionEntry => ({
  id: `live-2026-11-09-entry-${id}`, expression, reading, meaning, ...(note ? { note } : {}),
})
const example = (id: string, japanese: string, chinese: string): LiveReactionExample => ({
  id: `live-2026-11-09-example-${id}`, japanese, chinese,
})

export const liveNovember9Groups: LiveUnitGroup[] = [
  {
    id: 'live-2026-11-09-lost-property', title: '落ちる・落とす・紛失する',
    subtitle: '区分东西掉落、把东西弄掉和遗失', category: 'transitivity',
    entries: [
      entry('thing-falls', '物が落ちる', 'ものがおちる', '东西掉下来', '自动词「落ちる」的主语用「が」标记。'),
      entry('drop-something', '物を落とす', 'ものをおとす', '把东西弄掉', '他动词「落とす」的对象用「を」标记。也可指把随身物品弄丢。'),
      entry('lose', '紛失する', 'ふんしつする', '遗失、丢失', '常见于正式通知或报失。'),
      entry('comeback', 'カムバック', 'カムバック', '回归、复出', '可接「する」。漫画篇名里也有让失物回来的字面意思。'),
      entry('spray', 'スプレー', 'スプレー', '喷雾、喷剂', '也可以指喷雾罐，如「スプレー缶」。'),
      entry('finally-succeeded', 'ついに成功した', 'ついにせいこうした', '终于成功了'),
    ],
    points: ['「落ちる／落とす」能描述实际掉落的动作。「紛失する」说明物品遗失，未必知道它是怎么丢的。'],
    examples: [
      example('key-falls', 'ポケットから鍵が落ちた。', '钥匙从口袋里掉了出来。'),
      example('drop-phone', '駅でスマホを落としてしまった。', '我在车站把手机弄丢了。'),
      example('lost-pass', '学生証を紛失した場合は、事務室に連絡してください。', '如遗失学生证，请联系办公室。'),
      example('finally-works', '何度も試して、ついに成功した。', '试了许多次，终于成功了。'),
    ],
  },
  {
    id: 'live-2026-11-09-none-left', title: '一人残らず・一匹残らず・ゴミ集めに出す',
    subtitle: '按对象选量词，表达一个也没漏下', category: 'vocabulary',
    entries: [
      entry('everyone', '一人残らず', 'ひとりのこらず', '一个人也不剩、所有人无一例外'),
      entry('every-animal', '一匹残らず', 'いっぴきのこらず', '一只也不剩、每只都……'),
      entry('put-out-trash', 'ゴミ集めに出す', 'ゴミあつめにだす', '把垃圾拿出去等候收运', '照片原写法。日常可说「ごみを出す」，明确是交给垃圾收运时可说「ごみを収集に出す」。'),
    ],
    points: ['「一＋量词＋残らず」强调没有遗漏。人用「一人」，猫狗等小动物可用「一匹」。'],
    examples: [
      example('everyone-evacuated', '参加者は一人残らず建物の外に出た。', '参加者全部撤到了楼外。'),
      example('all-kittens', '子猫は一匹残らず保護された。', '所有小猫都获救了。'),
      example('trash-day', '燃えるごみは火曜日の朝に出してください。', '请在星期二早上拿出可燃垃圾。'),
    ],
  },
  {
    id: 'live-2026-11-09-concession', title: 'いくら～ても・たとえ～ても・どれだけ～ても',
    subtitle: '表达程度再高或即使出现某种情况，结论也不变', category: 'grammar',
    entries: [
      entry('unreasonable', '無茶なことを言う', 'むちゃなことをいう', '说不讲道理的话、提不切实际的要求'),
      entry('however-much', 'いくら～ても', 'いくら～ても', '无论多么……也……'),
      entry('even-if', 'たとえ～ても', 'たとえ～ても', '即使……也……'),
      entry('effort-in-vain', 'どれだけ頑張っても無駄だよ', 'どれだけがんばってもむだだよ', '不管多努力也没用', '「どれだけ」突出程度。「よ」把说话者的判断传达给对方。'),
      entry('straight-to-point', 'ずばり', 'ずばり', '直截了当地、一针见血地'),
    ],
    points: ['「いくら／どれだけ」强调程度，「たとえ」把某个情况作为假设提出来。'],
    examples: [
      example('search-in-vain', '引き出しの中をいくら探しても、見つからなかった。', '怎么找都没在抽屉里找到。'),
      example('even-if-rain', 'たとえ雨が降っても、試合は予定どおり行う。', '即使下雨，比赛也会按原计划进行。'),
      example('exact-cause', '彼女は問題の原因をずばり言い当てた。', '她一针见血地说中了问题的原因。'),
    ],
  },
  {
    id: 'live-2026-11-09-hope-and-intention', title: '望みを失う・～と思ってた・～ようと思ってた',
    subtitle: '表达失去希望、原来的判断与先前的打算', category: 'grammar',
    entries: [
      entry('lose-hope', '生きていく望みを失う', 'いきていくのぞみをうしなう', '失去继续生活下去的希望'),
      entry('had-thought', 'と思ってた', 'とおもってた', '本来以为……、先前一直想……', '「と思っていた」的口语缩略。'),
      entry('had-planned-to-increase', '増やそうと思ってた', 'ふやそうとおもってた', '本来打算增加', '「増やす」的意向形是「増やそう」。'),
    ],
    points: ['前面接一个判断时可以表示「以为……」，接「増やそう」之类的意向形时则表示「本来打算……」。'],
    examples: [
      example('find-again', 'もう見つからないと思ってた。', '我本来以为再也找不到了。'),
      example('plan-reading', '今月は本を読む時間を増やそうと思ってた。', '我原本打算这个月多安排些时间看书。'),
      example('keep-hope', '連絡が途絶えても、再会の望みを失わなかった。', '即使断了联系，也没有放弃再见的希望。'),
    ],
  },
  {
    id: 'live-2026-11-09-refusal-and-tone', title: 'あっさり・きっぱり・やんわり',
    subtitle: '拒绝时的语气和对多管闲事的评价', category: 'vocabulary',
    entries: [
      entry('readily-refuse', 'あっさり断る', 'あっさりことわる', '没怎么犹豫就拒绝、干脆地回绝'),
      entry('firmly-refuse', 'きっぱり断る', 'きっぱりことわる', '态度明确地断然拒绝'),
      entry('gently-refuse', 'やんわり断る', 'やんわりことわる', '委婉地拒绝'),
      entry('light-flavor', 'あっさりとした味', 'あっさりとしたあじ', '清淡爽口的味道'),
      entry('cold', '冷たい', 'つめたい', '冰凉的；冷淡的'),
      entry('meddle', '余計なことをする', 'よけいなことをする', '做多余的事、多管闲事'),
      entry('none-of-your-business', '大きなお世話だ', 'おおきなおせわだ', '用不着你管', '语气冲，常用于反感对方干涉时。'),
    ],
    points: ['「あっさり」侧重毫不费力或不纠结，「きっぱり」侧重态度明确，「やんわり」侧重缓和措辞。「あっさり」描述食物时表示清淡。'],
    examples: [
      example('invitation-refused', '誘ってみたけれど、あっさり断られた。', '试着邀请了对方，对方很干脆地拒绝了。'),
      example('sales-pitch', 'いらないものはきっぱり断る。', '不需要的东西就明确拒绝。'),
      example('soft-refusal', '先約があると伝えて、やんわり断った。', '我告诉对方已经有约，委婉地拒绝了。'),
      example('light-soup', 'このスープはあっさりとした味で飲みやすい。', '这道汤味道清淡，很好入口。'),
    ],
  },
  {
    id: 'live-2026-11-09-respond-and-prepare', title: '応える・もうすぐ・前もって',
    subtitle: '回应、感到吃不消与提前准备', category: 'vocabulary',
    entries: [
      entry('takes-a-toll', 'だいぶ応える', 'だいぶこたえる', '挺让人吃不消', '保留照片写法。表示负担或打击时常写「だいぶこたえる」「堪える」；回应期待或号召时用「応える」。'),
      entry('answer-a-call', '呼びかけに応える', 'よびかけにこたえる', '响应呼吁、回应呼唤'),
      entry('very-soon', 'もうすぐ', 'もうすぐ', '马上、很快就……'),
      entry('beforehand', '前もって', 'まえもって', '提前、事先'),
      entry('in-advance', 'あらかじめ', 'あらかじめ', '预先、事先', '在说明、通知等书面语中也常见。'),
      entry('before-the-event', '事前に', 'じぜんに', '事前、在事情发生前', '常与「確認」「連絡」等搭配。'),
    ],
    points: ['「もうすぐ」以现在为基准，表示某事即将发生。「前もって／あらかじめ／事前に」以预定事项为基准，表示动作在它之前完成。'],
    examples: [
      example('heat-takes-toll', 'この暑さは体にだいぶこたえる。', '这种暑热挺让身体吃不消的。'),
      example('respond-to-request', '地域の呼びかけに応えて、清掃活動に参加した。', '我响应社区的号召，参加了清扫活动。'),
      example('prepare-in-advance', '発表は来週だけど、資料は前もって配っておく。', '下周才发言，不过我会先把材料发下去。'),
    ],
  },
  {
    id: 'live-2026-11-09-te-form', title: '～てみる・～ておく・～てある・～てしまう',
    subtitle: '区分尝试、预先处理、动作结果与完成', category: 'grammar',
    entries: [
      entry('try-reading', '試しに読んでみる', 'ためしによんでみる', '试着读一读'),
      entry('try-doing', '～てみる', 'てみる', '试着做某事'),
      entry('prepare-by-doing', '～ておく', 'ておく', '预先做；让某状态保持着'),
      entry('prepared-state', '～てある', 'てある', '有意做过某事，留下的状态仍在', '常见「物が＋他動詞のて形＋ある」。'),
      entry('finish-doing', '～てしまう', 'てしまう', '做完；做了某事并带有遗憾或意外等语气'),
      entry('without-fail', 'かならず', 'かならず', '一定、务必', '通常也写作「必ず」。'),
    ],
    points: ['「開けておく」着眼于提前打开或让它一直开着，「開けてある」着眼于人为打开后留下的状态。「～てしまう」的语气由具体语境决定。'],
    examples: [
      example('first-page', 'まず一ページだけ読んでみよう。', '先试着读一页吧。'),
      example('open-window-in-advance', '暑くなる前に窓を開けておく。', '趁还没热起来先把窗户打开。'),
      example('window-already-open', '換気のために窓が開けてある。', '窗户已经打开了，是为了通风。'),
      example('forget-the-key', '出かける前にかならず確認するのに、今日は鍵を忘れてしまった。', '明明出门前总会检查，今天却忘了带钥匙。'),
    ],
  },
  {
    id: 'live-2026-11-09-owners-and-gratitude', title: '持ち主・飼い主・恩返し',
    subtitle: '物主、宠物主人与报恩', category: 'vocabulary',
    entries: [
      entry('property-owner', '持ち主', 'もちぬし', '物品的主人、所有者'),
      entry('pet-owner', '飼い主', 'かいぬし', '饲主、宠物主人'),
      entry('rank-system', '順位制', 'じゅんいせい', '按名次或先后顺序决定的制度', '具体按什么排名，需要结合上下文判断。'),
      entry('dog', 'イヌ', 'イヌ', '狗', '也写作「犬」「いぬ」。'),
      entry('cat', 'ネコ', 'ネコ', '猫', '也写作「猫」「ねこ」。'),
      entry('repay-kindness', '恩返し', 'おんがえし', '报恩、回报恩情'),
      entry('lifesaver', '命の恩人', 'いのちのおんじん', '救命恩人'),
    ],
    points: ['找回失物时找的是「持ち主」，走失宠物通常要找「飼い主」。受人帮助后可以说「いつか恩返しがしたい」。'],
    examples: [
      example('lost-wallet-owner', '拾った財布の持ち主が見つかった。', '捡到的钱包找到失主了。'),
      example('dog-and-owner', '迷子の犬が飼い主のもとに戻った。', '走失的狗回到了主人身边。'),
      example('repay-rescuer', '命の恩人に、いつか恩返しがしたい。', '我希望有朝一日能报答救命恩人。'),
    ],
  },
  {
    id: 'live-2026-11-09-connectors-and-condition', title: 'ところが・ところで・さえ～ば',
    subtitle: '转折、换话题、联想与最低条件', category: 'grammar',
    entries: [
      entry('unexpected-turn', 'ところが、', 'ところが', '可是、没想到', '常引出与预想不同的结果。'),
      entry('change-topic', 'ところで、', 'ところで', '话说、对了', '常用来转换话题。'),
      entry('reminded', 'そう言えば、', 'そういえば', '说起来、这么一说', '前面的话让说话者想起了相关的事。'),
      entry('even-so', 'それにしても、', 'それにしても', '即便如此、话虽如此', '也可承接话题，表达惊讶或感叹。'),
      entry('minimum-condition', 'さえ～ば', 'さえ～ば', '只要……就……', '「名詞＋さえ＋条件形」指出最低或唯一必要的前提。'),
    ],
    points: ['「ところが」转向意外结果，「ところで」转换话题，「そう言えば」表示由眼前话题联想到别的事。'],
    examples: [
      example('unexpected-closure', '店は開いていると思った。ところが、今日は定休日だった。', '我以为店开着，没想到今天休息。'),
      example('new-topic', 'ところで、明日の集合は何時ですか。', '对了，明天几点集合？'),
      example('remembered-call', 'そう言えば、昨日その店から電話があったよ。', '说起来，昨天那家店打过电话。'),
      example('only-need-ticket', '切符さえあれば、予約なしでも入れます。', '只要有票，不预约也能进去。'),
    ],
  },
  {
    id: 'live-2026-11-09-reframe', title: '言い換えれば・逆に言えば・極端に言えば',
    subtitle: '重新表述、换个角度和说到极端', category: 'grammar',
    entries: [
      entry('in-other-words', '言い換えれば', 'いいかえれば', '换句话说'),
      entry('conversely', '逆に言えば', 'ぎゃくにいえば', '反过来说、从另一个角度来说'),
      entry('to-an-extreme', '極端に言えば', 'きょくたんにいえば', '往极端了说'),
      entry('not-particularly', '別に', 'べつに', '没什么、并不特别……', '常接否定。「別に。」单独回答时可能显得敷衍。'),
    ],
    points: ['三种「～言えば」分别侧重重述原意、转换看法和把说法推到极端。'],
    examples: [
      example('put-it-another-way', '提出は任意です。言い換えれば、出さなくてもかまいません。', '提交是自愿的。换句话说，不提交也可以。'),
      example('other-side', '店は小さい。逆に言えば、品物を探しやすい。', '店面很小。从另一个角度看，东西好找。'),
      example('not-particularly-busy', '今日は別に忙しくないよ。', '我今天没什么忙的。'),
    ],
  },
  {
    id: 'live-2026-11-09-errands-and-conflict', title: 'お使い・強情・恨みを買う',
    subtitle: '跑腿、家常口语与人际冲突', category: 'vocabulary',
    entries: [
      entry('errand', 'お使い', 'おつかい', '跑腿、受人委托去办事'),
      entry('what-nobita-does', 'のび太のやること', 'のびたのやること', '大雄做的事'),
      entry('what-mom-says', 'ママの言うこと', 'ママのいうこと', '妈妈说的话'),
      entry('nagging-lecture', 'ガミガミ説教する', 'ガミガミせっきょうする', '唠唠叨叨地训人'),
      entry('stubborn-person', '強情なやつ', 'ごうじょうなやつ', '固执的家伙', '「やつ」语气随关系而异，用来称呼不熟的人可能失礼。'),
      entry('robbery', '強盗', 'ごうとう', '抢劫；抢劫犯'),
      entry('forceful', '強引', 'ごういん', '强硬的、不顾对方意愿的', '笔记对照「強制的」。「強引に話を進める」说的是做法强硬；「強制的に参加させる」说的是强制某人参加。'),
      entry('incur-resentment', '相手の恨みを買う', 'あいてのうらみをかう', '招致对方的怨恨、让对方记恨'),
    ],
    points: ['「のび太のやること」「ママの言うこと」里的「の」标记修饰从句的主语，可换成「が」。'],
    examples: [
      example('go-on-an-errand', '母に頼まれて、お使いに行ってきた。', '妈妈托我跑腿，我刚回来。'),
      example('what-mom-says', 'ママの言うことを最後まで聞いてから返事をした。', '我听妈妈说完才回答。'),
      example('forceful-decision', '相談せずに強引に決めると、相手の恨みを買うことがある。', '不商量就强行决定，有时会让对方记恨。'),
    ],
  },
]
