import type { LiveUnitGroup } from './live-reaction-units.ts'

// Transcribed from the overlapping phone-note screenshots supplied by the user.
// The date is the visible note heading, not a claim about the broadcast date.
// Source quotes retain shorthand; explanations and examples are learning additions.
export const liveOctober29Groups: LiveUnitGroup[] = [
  {
    id: 'live-2026-10-29-dore-dakke',
    title: 'どれだっけ：回想“是哪一个来着”',
    subtitle: '用「っけ」确认一度知道、现在记不清的事',
    category: 'grammar',
    entries: [
      { expression: 'どれだっけ', reading: 'どれだっけ', meaning: '是哪一个来着？', note: '口语回想、确认；不是第一次询问时最中性的「どれですか」。' },
    ],
    points: [
      '「っけ」常用于回想自己知道过的信息，也可向对方确认。可以自言自语，也可以用于熟人之间的对话。',
      '「だっけ」可以询问现在的事情，不是看到「だっ」就一律译成过去。正式场合可根据情境改用「どちらでしたか」等表达。',
    ],
    examples: [
      { japanese: '私の傘はどれだっけ。', chinese: '我的伞是哪一把来着？' },
      { japanese: '待ち合わせは何時だっけ。', chinese: '约好几点见面来着？' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG', quote: 'どれだっけ', translation: '是哪一个来着？' },
  },
  {
    id: 'live-2026-10-29-space-wo',
    title: '空を飛ぶ・海を泳ぐ：经过的空间',
    subtitle: '「を」不只标记动作对象，也能标记移动经过的空间',
    category: 'transitivity',
    entries: [
      { expression: '空を飛ぶ', reading: 'そらをとぶ', meaning: '在空中飞翔、飞过天空' },
      { expression: '海を泳ぐ', reading: 'うみをおよぐ', meaning: '在海中游动、游过海域' },
    ],
    points: [
      '移动动词前的「を」可以表示经过的空间。「飛ぶ」「泳ぐ」在这里不是因为前面有「を」就变成他动词。',
      '「海で泳ぐ」把海作为活动发生的场所；「海を泳ぐ」着眼于在海中移动。两者关注点不同，不能把「海で泳ぐ」判为错误。',
    ],
    examples: [
      { japanese: '鳥が青い空を飛んでいる。', chinese: '鸟儿正在蓝天中飞翔。' },
      { japanese: 'イルカが海を泳いでいる。', chinese: '海豚正在海中游动。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG', quote: '空を飛ぶ\n海を泳ぐ', translation: '在空中飞翔；在海中游动。' },
  },
  {
    id: 'live-2026-10-29-route-wo',
    title: '公園を散歩する・橋を渡る：移动的路线',
    subtitle: '散步、步行、奔跑、滑行、横渡与经过',
    category: 'transitivity',
    entries: [
      { expression: '公園を散歩する', reading: 'こうえんをさんぽする', meaning: '在公园里散步' },
      { expression: '街を歩く', reading: 'まちをあるく', meaning: '在街上走、走过街区' },
      { expression: '廊下を走る', reading: 'ろうかをはしる', meaning: '在走廊里奔跑' },
      { expression: '氷の上を滑る', reading: 'こおりのうえをすべる', meaning: '在冰面上滑行' },
      { expression: '橋を渡る', reading: 'はしをわたる', meaning: '过桥、渡过桥梁' },
      { expression: '駅前を通る', reading: 'えきまえをとおる', meaning: '经过车站前面' },
    ],
    points: [
      '这些「を」标记移动经过的路线或范围，而不是“把公园、桥等怎样处理”的动作对象。「駅に行く」中的「に」则标记目的地。',
      '「公園を散歩する」着眼于走过公园的范围；「公園で散歩する」着眼于散步发生的场所，两种说法都可以。',
      '「橋を渡る」是横越桥梁；「駅前を通る」只说明经过站前，不表示一定进入车站。',
    ],
    examples: [
      { japanese: '朝は公園を散歩してから、橋を渡って駅へ向かう。', chinese: '早上先在公园散步，再过桥前往车站。' },
      { japanese: '帰りのバスは駅前を通る。', chinese: '回程的公交车经过车站前面。' },
      { japanese: '廊下を走らず、ゆっくり歩いてください。', chinese: '请不要在走廊奔跑，慢慢走。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG', quote: '公園を散歩する\n街を歩く\n廊下を走る\n氷の上を滑る\n橋を渡る\n駅前を通る', translation: '在公园散步；在街上走；在走廊奔跑；在冰面滑行；过桥；经过车站前。' },
  },
  {
    id: 'live-2026-10-29-guide-prolong',
    title: '導く・長引く：引导与拖长',
    subtitle: '区分「人を導く」和「会議が長引く」',
    category: 'vocabulary',
    entries: [
      { expression: '導く', reading: 'みちびく', meaning: '引导、带领；导出', note: '截图以「道引く」帮助理解；辞书也有这一构成说明，但现代词条和通常书写使用「導く」，不把「道引く」另记为常用同义词。' },
      { expression: '会議が長引く', reading: 'かいぎがながびく', meaning: '会议拖长、迟迟没有结束' },
    ],
    points: [
      '「導く」是他动词：人を導く／成功に導く／結論を導く。小学館《精選版日本国語大辞典》也用「道引く」说明构成；实际使用时记作「導く（みちびく）」。',
      '「長引く」表示事情持续得比预想长，常用「会議が長引く」「風邪が長引く」。与「会議を長引かせる」（使会议拖长）区分。',
    ],
    examples: [
      { japanese: '案内係が参加者を会場へ導いた。', chinese: '引导员带领参加者前往会场。' },
      { japanese: '会議が長引いて、帰りが遅くなった。', chinese: '会议拖长了，回去的时间也晚了。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG', quote: '導く＝道引く\n会議が長引く', translation: '笔记用“道引く”辅助记忆「導く」；会议拖长。' },
  },
  {
    id: 'live-2026-10-29-moteasobu',
    title: '弄ぶ：拿着玩，也可以指玩弄',
    subtitle: '弄ぶ（もてあそぶ）',
    category: 'vocabulary',
    entries: [
      { expression: '弄ぶ', reading: 'もてあそぶ', meaning: '拿在手中摆弄；玩弄、戏弄', note: '截图的「持って遊ぶ」只帮助理解实物的摆弄，不能涵盖所有含义。' },
    ],
    points: [
      '可表示把小物件拿在手上摆弄，如「鍵を弄ぶ」。读作「もてあそぶ」，不是把汉字逐个按音读拼接。',
      '也可表示不认真对待他人的感情或命运，如「人の気持ちを弄ぶ」。这种用法含负面评价，不等于普通的“和别人一起玩”。',
    ],
    examples: [
      { japanese: '彼は考え事をしながら、手の中の鍵を弄んでいた。', chinese: '他一边想事情，一边摆弄着手中的钥匙。' },
      { japanese: '人の気持ちを弄んではいけない。', chinese: '不可以玩弄别人的感情。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG', quote: '弄ぶ＝持って遊ぶ', translation: '笔记把「弄ぶ」解释为“拿着玩”；实际也有“玩弄、戏弄”的含义。' },
  },
  {
    id: 'live-2026-10-29-hachiawase',
    title: '鉢合わせ：意外碰个正着',
    subtitle: '人と鉢合わせする',
    category: 'vocabulary',
    entries: [
      { expression: '鉢合わせ', reading: 'はちあわせ', meaning: '迎面相撞；意外碰面、碰个正着' },
    ],
    points: [
      '「鉢合わせする」既可指身体迎面碰撞，也常指意料之外地遇见某人。常见结构是「場所で、人と鉢合わせする」。',
      '相较于中性的「会う」，常带突然、意外，有时尴尬的感觉，不用于单纯说明预约见面。',
    ],
    examples: [
      { japanese: '玄関を出たところで、隣の人と鉢合わせした。', chinese: '刚走出玄关，就和邻居碰了个正着。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG', quote: '鉢合わせ', translation: '迎面相撞；意外碰个正着。' },
  },
  {
    id: 'live-2026-10-29-refusal',
    title: 'あっさり・きっぱり・やんわり断る',
    subtitle: '拒绝得干脆、明确，还是委婉',
    category: 'vocabulary',
    entries: [
      { expression: 'あっさり断る', reading: 'あっさりことわる', meaning: '轻易地、干脆地拒绝', note: '强调不纠结、不拖泥带水；视情境也可能让人觉得冷淡。' },
      { expression: 'きっぱり断る', reading: 'きっぱりことわる', meaning: '明确、坚决地拒绝', note: '强调态度清楚、不含糊，不等于必须语气粗鲁。' },
      { expression: 'やんわり断る', reading: 'やんわりことわる', meaning: '温和、委婉地拒绝' },
    ],
    points: [
      '三个副词都能修饰「断る」，但关注点不同：あっさり偏不费周折，きっぱり偏立场明确，やんわり偏说法柔和。',
      '拒绝的内容是否坚定，与表达方式是否礼貌并非一回事；可以礼貌而明确地拒绝。',
    ],
    examples: [
      { japanese: '迷うかと思ったが、彼はあっさり断った。', chinese: '本以为他会犹豫，没想到他干脆地拒绝了。' },
      { japanese: '無理な依頼は、きっぱり断ることも必要だ。', chinese: '对于不合理的请求，有时也需要明确拒绝。' },
      { japanese: '予定があると伝えて、誘いをやんわり断った。', chinese: '我说明自己已有安排，委婉地拒绝了邀请。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG（やんわり断る亦见IMG_3201.PNG）', quote: 'あっさり断る\nきっぱり断る\nやんわり断る', translation: '干脆拒绝；明确拒绝；委婉拒绝。' },
  },
  {
    id: 'live-2026-10-29-kata',
    title: '喋り方・食べ方・持ち方：做事的方式',
    subtitle: '动词ます形去掉ます＋方',
    category: 'grammar',
    entries: [
      { expression: 'おかしい喋り方をする', reading: 'おかしいしゃべりかたをする', meaning: '用奇怪的方式说话' },
      { expression: '変な食べ方してる', reading: 'へんなたべかたしてる', meaning: '吃东西的方式有点奇怪', note: '截图口语保留形式；完整说法是「変な食べ方をしている」。' },
      { expression: '変な持ち方してる', reading: 'へんなもちかたしてる', meaning: '拿东西的方式有点奇怪', note: '截图口语保留形式；完整说法是「変な持ち方をしている」。' },
    ],
    points: [
      '「喋る→喋り方」「食べる→食べ方」「持つ→持ち方」，表示动作的方式或方法；「方」在这里读「かた」。',
      '「おかしい」是い形容词，「変」是な形容词，所以分别是「おかしい喋り方」「変な持ち方」。',
      '口语中「を」可能省略，「している」也常缩成「してる」。学习时可对应回「～方をしている」，不要把省略误当成所有场合都适用的书面形式。',
    ],
    examples: [
      { japanese: 'その箸の持ち方だと、食べにくくない？', chinese: '那样拿筷子，吃起来不会不方便吗？' },
      { japanese: '彼は普段と違う喋り方をしていた。', chinese: '他说话的方式和平时不一样。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG／IMG_3201.PNG重叠部分', quote: 'おかしい喋り方をする\n変な食べ方してる\n変な持ち方してる', translation: '用奇怪的方式说话；吃法奇怪；拿法奇怪。' },
  },
  {
    id: 'live-2026-10-29-takaga',
    title: 'たかが：不过是……',
    subtitle: '看轻数量、程度或重要性的语气',
    category: 'vocabulary',
    entries: [
      { expression: 'たかが', reading: 'たかが', meaning: '不过是、充其量只是、区区', note: '带说话人的轻视或“不必太在意”的评价，不是客观数量词。' },
    ],
    points: [
      '常放在名词、数量表达前，如「たかが一度の失敗」「たかが千円」。有时用于安慰，有时显得轻视对方。',
      '说「たかがそれくらい」可能否定他人的努力或困难；不能总用中性的“仅仅”来理解其语气。',
    ],
    examples: [
      { japanese: 'たかが一度の失敗で、諦める必要はない。', chinese: '不过失败了一次，没有必要放弃。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG／IMG_3201.PNG重叠部分', quote: 'たかが', translation: '不过是、区区。' },
  },
  {
    id: 'live-2026-10-29-prohibition',
    title: '～てはならない・～てはいけない',
    subtitle: '都能表示禁止，不能硬分成“说教”和“规则”',
    category: 'grammar',
    entries: [
      { expression: '～てはならない', reading: '～てはならない', meaning: '不得、不可以……', note: '截图旁注「説教」是笔记中的场景提示，不是排他的语法定义。' },
      { expression: '～てはいけない', reading: '～てはいけない', meaning: '不能、不可以……', note: '截图旁注「規則」，但也能用于个人劝告、道德判断等。' },
      { expression: 'いけない', reading: 'いけない', meaning: '不行、不可、不妥；糟了', note: '笔记标注“不允许”；实际含义随情境变化，也要与「行けない」（不能去）区分。' },
    ],
    points: [
      '接续都是动词て形＋は＋ならない／いけない；如「入ってはならない」「入ってはいけない」。',
      '「～てはならない」通常较郑重、书面，也常见于规则、规定或强烈告诫。「～てはいけない」广泛用于日常禁止、规则与劝告。两者并非“说教专用”和“规则专用”。',
      '单独的「いけない」既可能是评价“不好、不妥”，也可能是突然想起失误时的“糟了”。「無理をしてはいけない」有时译成关切的“不要勉强”。',
    ],
    examples: [
      { japanese: 'この区域に入ってはならない。', chinese: '不得进入此区域。' },
      { japanese: 'ここで写真を撮ってはいけません。', chinese: '这里不可以拍照。' },
      { japanese: 'いけない、鍵を忘れた。', chinese: '糟了，忘带钥匙了。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3200.PNG末尾／IMG_3201.PNG', quote: 'てはならない 説教\nてはいけない 規則\nいけない 不允许', translation: '原笔记把「てはならない」旁注为说教、「てはいけない」旁注为规则、「いけない」旁注为不允许；这些是简写提示，不能当成唯一用法。', readAloud: false },
  },
  {
    id: 'live-2026-10-29-hagukumu',
    title: '育む：用心养育、培养',
    subtitle: 'はぐくむ → 育む',
    category: 'vocabulary',
    entries: [
      { expression: '育む', reading: 'はぐくむ', meaning: '养育；培育、培养', note: '截图使用假名「はぐくむ」，词条补充常用汉字表记「育む」。' },
    ],
    points: [
      '可用于孩子、生命等的养育，也可用于感情、能力、文化等的培养，如「友情を育む」「想像力を育む」。',
      '相较于单纯说明长大的「育つ」，「育む」是他动词，常带关怀、保护、逐渐培育的意味。',
    ],
    examples: [
      { japanese: '絵本を読む時間が、子どもの想像力を育む。', chinese: '阅读绘本的时光培养孩子的想象力。' },
      { japanese: '長い交流を通して友情を育んできた。', chinese: '通过长期交往，我们逐渐建立了友谊。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3201.PNG', quote: 'はぐくむ', translation: '养育、培育、培养。' },
  },
  {
    id: 'live-2026-10-29-kitaihazure',
    title: '期待外れ：没有达到期待',
    subtitle: '期待外れの結果・期待外れだった',
    category: 'vocabulary',
    entries: [
      { expression: '期待外れ', reading: 'きたいはずれ', meaning: '不如预期、令人失望', note: '评价的是实际与原先期待之间的落差，不等于一切方面都毫无价值。' },
    ],
    points: [
      '常用「期待外れの～」「期待外れだった」「期待外れに終わる」。这里的「外れ」读「はずれ」。',
      '「期待外れ」说明不符合期待的结果；「がっかりする」更直接描述人的失望心情。',
    ],
    examples: [
      { japanese: '楽しみにしていた映画は、少し期待外れだった。', chinese: '一直期待的电影有点令人失望。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3201.PNG', quote: '期待外れ', translation: '不如预期、令人失望。' },
  },
  {
    id: 'live-2026-10-29-chittomo',
    title: 'ちっとも：一点也不……',
    subtitle: '通常与否定表达搭配',
    category: 'grammar',
    entries: [
      { expression: 'ちっとも', reading: 'ちっとも', meaning: '一点也不、丝毫不', note: '通常与「～ない」等否定表达搭配，用来加强否定。' },
    ],
    points: [
      '「ちっとも分からない」「ちっとも変わらない」等都表示“丝毫不……”，不是肯定句里的“一点点”。',
      '常用于口语，也能带不满、惊讶或安慰的语气；具体情绪由上下文决定。',
    ],
    examples: [
      { japanese: '説明を聞いても、ちっとも分からなかった。', chinese: '即使听了解释，还是一点也没明白。' },
      { japanese: '久しぶりだけど、ちっとも変わっていないね。', chinese: '虽然好久没见，你还真是一点都没变啊。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3201.PNG', quote: 'ちっとも', translation: '一点也不、丝毫不。' },
  },
  {
    id: 'live-2026-10-29-loanwords',
    title: 'ファンタジー・サングラス・外す',
    subtitle: '外来语词义与“摘下眼镜”的说法',
    category: 'vocabulary',
    entries: [
      { expression: 'ファンタジー', reading: 'ファンタジー', meaning: '幻想；奇幻作品、奇幻题材' },
      { expression: 'サングラス', reading: 'サングラス', meaning: '太阳镜、墨镜' },
      { expression: 'グラスを外す', reading: 'グラスをはずす', meaning: '（笔记语境）摘下太阳镜', note: '截图原文如此；日常表达通常明确说「サングラスを外す」或「眼鏡を外す」。「グラス」单独也常指玻璃杯，不能普遍当作眼镜。' },
    ],
    points: [
      '「ファンタジー」可指幻想，也常指有魔法、架空世界等要素的作品类型，不等于所有不真实的陈述。',
      '「サングラスをかける」是戴太阳镜，「サングラスを外す」是摘下。普通眼镜通常说「眼鏡（めがね）」。',
      '图片把「サングラス」与「グラスを外す」连续记下，所以按该笔记语境解释；没有把“グラス＝所有眼镜”写成通用规则。',
    ],
    examples: [
      { japanese: '子どものころから、ファンタジー小説が好きだ。', chinese: '从小就喜欢奇幻小说。' },
      { japanese: '室内に入って、サングラスを外した。', chinese: '进入室内后，我摘下了太阳镜。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3201.PNG', quote: 'ファンタジー\nサングラス\nグラスを外す', translation: '幻想、奇幻；太阳镜；（该笔记语境中）摘下太阳镜。' },
  },
  {
    id: 'live-2026-10-29-perception',
    title: '山が見える・音が聞こえる',
    subtitle: '自然映入眼中、传入耳中的感知',
    category: 'grammar',
    entries: [
      { expression: '山が見える', reading: 'やまがみえる', meaning: '看得见山、山映入眼帘' },
      { expression: '音が聞こえる', reading: 'おとがきこえる', meaning: '听得见声音、声音传来' },
    ],
    points: [
      '「見える」「聞こえる」常表示事物自然进入视野或声音传到耳边：看到、听到的对象通常用「が」。',
      '不要把它们机械当成「見る」「聞く」的普通可能形。主动观看的机会、听取的能力或许可等，还可能使用「見られる」「聞ける」，要结合情境判断。',
      '本组说明实际感知；与下一组「山に見える」「ウソに聞こえる」的“看起来／听起来像”区分。',
    ],
    examples: [
      { japanese: 'この窓から山が見える。', chinese: '从这扇窗户能看见山。' },
      { japanese: '隣の部屋から音が聞こえる。', chinese: '隔壁房间传来了声音。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3201.PNG', quote: '山が見える\n音が聞こえる', translation: '看得见山；听得见声音。' },
  },
  {
    id: 'live-2026-10-29-impression',
    title: '山に見える・ウソに聞こえる',
    subtitle: '「に」「ように」表示给人的外观或听觉印象',
    category: 'grammar',
    entries: [
      { expression: 'そう見えるだけ', reading: 'そうみえるだけ', meaning: '只是看起来那样而已', note: '提示外观与实际可能不同，并没有断言实际情况一定怎样。' },
      { expression: '山に見える', reading: 'やまにみえる', meaning: '看起来像山', note: '不是“能看见山”；要判断什么东西看起来像山。' },
      { expression: 'ウソに聞こえる', reading: 'うそにきこえる', meaning: '听起来像谎话、不像真的', note: '也写作「嘘に聞こえる」，是在表达听者的印象。' },
      { expression: '社畜のように見える', reading: 'しゃちくのようにみえる', meaning: '看起来像过度受公司支配、为公司卖命的人', note: '「社畜」带贬义或自嘲色彩，不适合把它当作中性的“公司职员”称呼别人。' },
    ],
    points: [
      '「名词＋に見える／に聞こえる」表示看起来、听起来像该事物，如「雲が山に見える」「説明がウソに聞こえる」。',
      '「名词＋のように見える」也能描述相似印象；「社畜のように見える」的「の」不能直接省略成「社畜ように」。',
      '「山が見える」的「が」引出看见的山；「山に見える」的「に」引出被看作的样子。外观或听感不等于已经核实的事实。',
    ],
    examples: [
      { japanese: '遠くの雲が山に見える。', chinese: '远处的云看起来像山。' },
      { japanese: '彼は怒っているように見えるけれど、そう見えるだけだ。', chinese: '他看起来像在生气，但只是看起来那样而已。' },
      { japanese: 'その説明は、私にはウソに聞こえる。', chinese: '那个解释，在我听来像是谎话。' },
      { japanese: '「社畜のように見える」という言い方は、相手を傷つけることがある。', chinese: '“看起来像社畜”这种说法有时会伤害对方。' },
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3201.PNG', quote: 'そう見えるだけ\n山に見える\nウソに聞こえる\n社畜のように見える', translation: '只是看起来那样；看起来像山；听起来像谎话；看起来像社畜。' },
  },
]
