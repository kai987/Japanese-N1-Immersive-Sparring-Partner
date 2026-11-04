import type { LiveReactionEntry, LiveReactionExample } from './live-reactions.ts'
import type { LiveUnitGroup } from './live-reaction-units.ts'

// Four overlapping photos of the phone notes headed 26-11-04.
// The source quotes and the teaching examples have separate provenance.
const entry = (id: string, expression: string, reading: string, meaning: string, note?: string): LiveReactionEntry => ({
  id: `live-2026-11-04-entry-${id}`, expression, reading, meaning, ...(note ? { note } : {}),
})
const example = (id: string, japanese: string, chinese: string): LiveReactionExample => ({
  id: `live-2026-11-04-example-${id}`, japanese, chinese,
})

export const liveNovember4Groups: LiveUnitGroup[] = [
  {
    id: 'live-2026-11-04-sharing', title: 'おすそわけ・分け前・半分こする',
    subtitle: '分享给别人、应分到的一份与对半分', category: 'vocabulary',
    entries: [
      entry('share-with-others', 'おすそわけ', 'おすそわけ', '把自己得到的东西分一些给别人', '也写作「お裾分け」，常用「おすそわけする」。'),
      entry('smaller-share', '分け前が減る', 'わけまえがへる', '分到的份额变少'),
      entry('split-in-half', '半分こする', 'はんぶんこする', '对半分、一人一半', '「半分こ」是亲近随意的说法。正式场合可说「半分ずつに分ける」。'),
    ],
    points: ['「おすそわけ」强调主动分享；「分け前」是分配后自己或别人拿到的一份；「半分こ」强调分法是一人一半。'],
    examples: [
      example('share-pears', '梨をたくさんもらったので、お隣さんにおすそわけした。', '收到了很多梨，于是分了一些给邻居。'),
      example('split-cake', 'このケーキ、半分こしよう。', '这块蛋糕，我们一人一半吧。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg', quote: 'おすそわけ\n分け前が減る\n半分こする', translation: '分享给别人；分到的份额变少；对半分。' },
  },
  {
    id: 'live-2026-11-04-chew-and-overdo', title: 'ガムを噛む・食べすぎ・飲みすぎ',
    subtitle: '嚼口香糖与用「～すぎ」表达过量', category: 'grammar',
    entries: [
      entry('chew-gum', 'ガムを噛む', 'ガムをかむ', '嚼口香糖'),
      entry('too-many-snacks', 'おやつの食べすぎ', 'おやつのたべすぎ', '零食吃得太多'),
      entry('avoid-drinking-too-much', '飲みすぎに注意する', 'のみすぎにちゅういする', '注意别喝太多', '没有明说饮品时，常指不要饮酒过量，具体仍看上下文。'),
    ],
    points: ['动词去掉「ます」再接「すぎる」，表示程度或数量超出适当范围。「食べすぎ」「飲みすぎ」也可当名词用。'],
    examples: [
      example('snacks-before-dinner', '夕飯の前におやつを食べすぎた。', '晚饭前零食吃多了。'),
      example('chewing-during-class', '授業中はガムを噛まないでください。', '上课时请不要嚼口香糖。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'ガムを噛む\nおやつの食べすぎ\n飲みすぎに注意する', translation: '嚼口香糖；零食吃太多；注意别喝过量。' },
  },
  {
    id: 'live-2026-11-04-recently-and-strange', title: 'どうもおかしい・近ごろ',
    subtitle: '察觉异常与谈论最近一段时间', category: 'vocabulary',
    entries: [
      entry('something-is-off', 'どうもおかしい', 'どうもおかしい', '总觉得不对劲', '这里的「どうも」表示说不太清原因的判断。'),
      entry('lately', '近ごろ', 'ちかごろ', '近来、最近一段时间'),
    ],
    points: ['「おかしい」可以表示奇怪或好笑。在「どうもおかしい」这样的判断中，常指有什么地方不正常。'],
    examples: [example('door-lock-strange', '近ごろ、このドアの鍵がどうもおかしい。', '最近这扇门的锁总有点不对劲。')],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'どうもおかしい\n近ごろ', translation: '总觉得不对劲；近来。' },
  },
  {
    id: 'live-2026-11-04-hin-jaku', title: '貧弱・見るからに',
    subtitle: '外表单薄、知识匮乏与一眼可见的印象', category: 'vocabulary',
    entries: [
      entry('poor-and-feeble', '貧弱', 'ひんじゃく', '单薄、薄弱、匮乏'),
      entry('visibly-frail-man', '見るからに貧弱な男', 'みるからにひんじゃくなおとこ', '一眼看上去就很单薄的男人', '评价他人体格时语气不客气；「見るからに」强调从外表直接获得的印象。'),
      entry('poor-knowledge', '知識が貧弱だ', 'ちしきがひんじゃくだ', '知识薄弱、知识储备不足'),
    ],
    points: ['「貧弱」可以形容体格、设备、内容或知识等单薄不足。「貧しい」用于说经济贫困，也可表示内容等贫乏。'],
    examples: [example('limited-background', 'その分野の知識が貧弱なので、まず入門書を読んだ。', '因为那个领域的知识比较薄弱，我先读了入门书。')],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: '貧弱\n見るからに貧弱な男\n知識が貧弱だ', translation: '单薄、匮乏；一眼看上去就很单薄的男人；知识薄弱。' },
  },
  {
    id: 'live-2026-11-04-location-and-eco', title: '駅に近い・環境にやさしい・エコ生活',
    subtitle: '地理距离和环保表达', category: 'vocabulary',
    entries: [
      entry('near-station', '駅に近い', 'えきにちかい', '离车站近', '「駅に近い」以车站为参照点，「駅から近い」从车站量距离。'),
      entry('eco-friendly-appliances', '環境にやさしい家電製品', 'かんきょうにやさしいかでんせいひん', '对环境友好的家电', '照片写作「やかしい」。词条采用常用写法「やさしい」，下方保留笔记原文。'),
      entry('eco-lifestyle', 'エコ生活', 'エコせいかつ', '环保生活、低环境负担的生活方式'),
    ],
    points: ['「環境にやさしい」说的是给环境带来的负担较小，例如节能或减少废弃物。'],
    examples: [
      example('apartment-near-station', '駅に近い部屋を探しています。', '我在找离车站近的房间。'),
      example('eco-friendly-appliance', '買い替えるなら、環境にやさしい家電製品を選びたい。', '如果要换新，我想选对环境友好的家电。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: '駅に近い\n環境にやかしい家電製品\nエコ生活', translation: '离车站近；环保家电（笔记写作「やかしい」）；环保生活。', readAloud: false },
  },
  {
    id: 'live-2026-11-04-tsugo', title: '予算の都合・都合がいい・仕事の都合で',
    subtitle: '预算限制、时间方便与工作方面的原因', category: 'vocabulary',
    entries: [
      entry('budget-circumstances', '予算の都合', 'よさんのつごう', '预算方面的限制或安排'),
      entry('convenient', '都合がいい', 'つごうがいい', '方便、合适', '询问时间时常说「ご都合のいい時間」。也可以表示对某一方有利，要看语境。'),
      entry('work-tomorrow-fragment', '仕事の都合で明日', 'しごとのつごうであした', '因为工作的安排，明天……', '保留照片中的片段；完整句还需补出明天的动作。'),
    ],
    points: ['「～の都合で」引出影响安排的原因。「都合がいい」则评价时间或条件是否合适。'],
    examples: [
      example('budget-limit-plan', '予算の都合で、旅行は一泊にした。', '考虑到预算，旅行只安排住一晚。'),
      example('work-tomorrow-change', '仕事の都合で、明日は少し遅れます。', '由于工作安排，明天我会晚一点。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: '予算の都合\n都合がいい\n仕事の都合で明日', translation: '预算方面的原因；方便；因为工作安排，明天……' },
  },
  {
    id: 'live-2026-11-04-action-timing', title: '～ところだ・～たばかり・～ところだった',
    subtitle: '正要、刚完成与差一点发生', category: 'grammar',
    entries: [
      entry('about-to-go-home', '帰るところだ', 'かえるところだ', '正要回去'),
      entry('just-returned', '帰ってきたとこだ', 'かえってきたとこだ', '刚回来', '「とこ」是「ところ」的口语缩略。'),
      entry('just-back-in-country', '帰国したばかり', 'きこくしたばかり', '刚回国不久'),
      entry('almost-hit-car', '車にぶつかるとこだった', 'くるまにぶつかるとこだった', '差点撞到车', '完整形式是「車にぶつかるところだった」。'),
    ],
    points: [
      '动词原形＋「ところだ」表示正要做；过去式＋「ところだ」表示动作刚完成。「～たばかり」也表示刚做过，时间长短可以是说话者的主观判断。',
      '动词原形＋「ところだった」在描述险情时常指差点发生，但实际上躲过了。',
    ],
    examples: [
      example('about-to-leave-home', 'ちょうど家を出るところだよ。', '我正要出门呢。'),
      example('almost-fall', '階段で足を滑らせて、転ぶところだった。', '在楼梯上脚一滑，差点摔倒。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: '帰るところだ\n帰ってきたとこだ\n帰国したばかり\n車にぶつかるとこだった', translation: '正要回去；刚回来；刚回国；差点撞上车。' },
  },
  {
    id: 'live-2026-11-04-personal-distance', title: 'ずうずうしい・あつかましい・馴れ馴れしい',
    subtitle: '冒昧、厚脸皮与过分套近乎', category: 'vocabulary',
    entries: [
      entry('shameless', 'ずうずうしい', 'ずうずうしい', '厚脸皮、不顾别人感受'),
      entry('presumptuous', 'あつかましい', 'あつかましい', '冒昧、厚脸皮', '「厚かましいお願いですが」也可用于为自己的请求客气地致歉。'),
      entry('overly-familiar', '馴れ馴れしい', 'なれなれしい', '过分亲昵、过分套近乎'),
      entry('gauge-social-distance', '対人距離をはかる', 'たいじんきょりをはかる', '判断与他人应保持的距离', '照片用假名「はかる」。也可以根据语境说「相手との距離感をつかむ」。'),
    ],
    points: ['「ずうずうしい」「あつかましい」都可批评不顾对方感受的举止；「馴れ馴れしい」尤其指关系还没那么熟，却摆出过分亲近的态度。'],
    examples: [
      example('presumptuous-favor', '厚かましいお願いですが、明日までお借りしてもよろしいですか。', '冒昧问一下，我可以借用到明天吗？'),
      example('overfamiliar-at-first-meeting', '初対面なのに、馴れ馴れしい話し方をされた。', '明明是初次见面，对方却用过分亲昵的口气和我说话。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg', quote: 'ずうずうしい\nあつかましい\n馴れ馴れしい\n対人距離をはかる', translation: '厚脸皮；冒昧；过分套近乎；判断人际距离。' },
  },
  {
    id: 'live-2026-11-04-datte-tatte', title: '～んだって？・～たって・子供だって',
    subtitle: '辨认传闻、让步和举例强调', category: 'grammar',
    entries: [
      entry('it-ended-rising', '終わったんだって↑', 'おわったんだって？', '听说已经结束了？', '「↑」标记句尾上扬，常用于向对方确认消息。平调时也可转述「听说已经结束了」。'),
      entry('even-if-you-peek', '覗いても＝覗いたって', 'のぞいても、のぞいたって', '即使偷看也……', '等号是笔记对照标记。「覗いたって」是较口语的让步表达。'),
      entry('even-if-you-try-hard', '頑張ったって間に合わない', 'がんばったってまにあわない', '就算努力也赶不上'),
      entry('even-kids-understand', '子供だってわかる', 'こどもだってわかる', '连孩子都懂'),
    ],
    points: [
      '「頑張ったって」≈「頑張っても」，表示即使做某事，结果也不会改变；「子供だって」≈「子供でも」，表示连某一类人也包括在内。',
      '「終わったんだって」的「って」可转述听来的内容；升调时往往是在问对方是不是真的。',
    ],
    examples: [
      example('done-already-confirm', 'えっ、もう工事が終わったんだって？', '诶，听说工程已经完工了？'),
      example('still-will-not-arrive', '今から走ったって、終電には間に合わないよ。', '现在跑过去也赶不上末班车了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '終わったんだって↑\n覗いても＝覗いたって\n頑張ったって間に合わない\n子供だってわかる', translation: '听说结束了？；即使偷看也……；再努力也赶不上；连孩子都懂。', readAloud: false },
  },
  {
    id: 'live-2026-11-04-follow-peek-stop', title: 'ついていく・覗き見する・よす',
    subtitle: '跟随、偷看与停止某种行为', category: 'vocabulary',
    entries: [
      entry('follow-me-note', '私についていこう', 'わたしについていこう', '跟着我走吧（按字面理解）', '保留笔记原句。请听话者跟自己来时，更自然的是「私についてきて」。'),
      entry('peek-secretly', '覗き見する', 'のぞきみする', '偷偷看、窥看'),
      entry('quit-it', 'よす', 'よす', '停止、打消做某事的念头', '口语里常见「よせ」或「よしたほうがいい」。'),
    ],
    points: ['「ついていく」强调跟着别人去，「ついてくる」强调跟着别人来。选择「いく／くる」时要看说话者所取的方向。'],
    examples: [
      example('follow-guide', '道がわからなかったので、案内してくれた人についていった。', '因为不认识路，我跟着给我带路的人走了。'),
      example('stop-peeking', '人のスマホを覗き見するのはよしたほうがいい。', '还是别偷看别人的手机。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '私についていこう\n覗き見する\nよす', translation: '跟着我走吧（字面）；偷看；别再做、停止。' },
  },
  {
    id: 'live-2026-11-04-unsightly', title: 'みっともない・醜い',
    subtitle: '不像样与丑陋的语气区别', category: 'vocabulary',
    entries: [
      entry('unseemly', 'みっともない', 'みっともない', '不像样、难看、丢脸'),
      entry('ugly', '醜い', 'みにくい', '丑陋、难看；也可形容行为或争执难堪'),
    ],
    points: ['「みっともない」常评价举止或外观在旁人眼里不体面；「醜い」语气较重，也可用于「醜い争い」等抽象对象。'],
    examples: [
      example('unseemly-quarrel', '人前でそんな言い争いをするのはみっともないよ。', '当着大家的面这样争吵很不像样。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'みっともない\n醜い', translation: '不像样；丑陋。' },
  },
  {
    id: 'live-2026-11-04-caveat-and-agreement', title: 'ただし・もっとも・ごもっとも',
    subtitle: '补充限制条件与表示赞同', category: 'grammar',
    entries: [
      entry('however-caveat', 'ただし＝もっとも', 'ただし、もっとも', '但、不过（用于补充条件或说明）', '等号保留原笔记的近义对照。「ただし」常明确规定例外或条件；接续词「もっとも」也可补充前言的保留意见。'),
      entry('as-you-say', 'おっしゃる通りです', 'おっしゃるとおりです', '正如您所说'),
      entry('quite-right', 'ごもっとも', 'ごもっとも', '您说得有道理', '这里的「もっとも」是「尤も」，表示合理、理所当然。'),
    ],
    points: ['区分句首用于补充说明的「もっとも」、表示有道理的「尤も」，以及表示最高程度的「最も」。'],
    examples: [
      example('condition-for-entry', '入場は無料です。ただし、事前に予約が必要です。', '入场免费，但需要事先预约。'),
      example('agree-with-criticism', 'おっしゃる通りです。説明が足りませんでした。', '您说得对，我解释得不够充分。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'ただし＝もっとも\nおっしゃる通りです\nごもっとも', translation: '但是、不过；正如您所说；您说得有道理。', readAloud: false },
  },
  {
    id: 'live-2026-11-04-taste-and-texture', title: '味・舌触り・歯応え',
    subtitle: '从味道到口感的描述', category: 'vocabulary',
    entries: [
      entry('taste-reaches-mouth', '味が口に伝わる', 'あじがくちにつたわる', '嘴里感受到味道', '保留笔记写法。描述味道扩散时也常说「味が口の中に広がる」。'),
      entry('smooth-mouthfeel', '滑らかな舌触り', 'なめらかなしたざわり', '舌感顺滑、口感细腻'),
      entry('refreshing-bite', '爽やかな歯応え', 'さわやかなはごたえ', '咬起来感觉清爽（按笔记写法）', '「爽やか」常形容味道或香气。专门形容咬感时，按食物可说「シャキシャキした歯応え」等。'),
    ],
    points: ['「舌触り」侧重食物接触舌头时的感觉；「歯応え」侧重牙齿咬下时感到的阻力和质地。'],
    examples: [
      example('smooth-pudding', 'このプリンは舌触りが滑らかだ。', '这款布丁口感细腻。'),
      example('cucumber-crunch', 'キュウリのシャキシャキした歯応えがいい。', '黄瓜吃起来脆脆的，口感很好。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '味が口に伝わる\n滑らかな舌触り\n爽やかな歯応え', translation: '嘴里感受到味道；舌感顺滑；咬起来感觉清爽。' },
  },
  {
    id: 'live-2026-11-04-first-kiss', title: 'ファーストキスを奪う',
    subtitle: '辨认口语和作品中的「奪う」', category: 'vocabulary',
    entries: [
      entry('steal-first-kiss', 'ファーストキスを奪う', 'ファーストキスをうばう', '夺走初吻', '「奪う」带有强行夺取的语感。这里收录的是笔记表达，不据此推断原场景。'),
    ],
    points: ['「ファーストキス」指初吻。中性地说两个人接吻，可以用「キスをする」。'],
    examples: [example('first-kiss-scene', '小説にはファーストキスの場面が出てくる。', '小说里出现了初吻的场景。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg／写真3.jpg', quote: 'ファーストキスを奪う', translation: '夺走初吻。' },
  },
  {
    id: 'live-2026-11-04-kisses', title: '投げキス・間接キス',
    subtitle: '飞吻与口语里的“间接接吻”', category: 'vocabulary',
    entries: [
      entry('blown-kiss', '投げキス', 'なげキス', '飞吻'),
      entry('indirect-kiss', '間接キス', 'かんせつキス', '间接接吻', '例如两个人先后用嘴碰到同一根吸管，口语中有时会用这个词开玩笑。'),
    ],
    points: [
      '「投げキスをする」指朝对方送飞吻。「間接キス」则强调嘴唇先后接触同一物品。',
    ],
    examples: [
      example('wave-and-blow-kiss', '歌手が客席に向かって投げキスをした。', '歌手朝观众席送了个飞吻。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '投げキス\n間接キス', translation: '飞吻；间接接吻。' },
  },
  {
    id: 'live-2026-11-04-perception', title: '気がする・感じがする・味や匂いがする',
    subtitle: '主观判断与感官察觉', category: 'grammar',
    entries: [
      entry('seems-cold', '寒い気がする', 'さむいきがする', '感觉有点冷、好像挺冷', '「寒い」是形容词，「気がする」表示主观感觉。若特指身体发冷或打寒战，常说「寒気がする（さむけがする）」。'),
      entry('get-impression', '感じがする', 'かんじがする', '有某种感觉或印象', '常在前面说明感受的内容，如「見覚えがある感じがする」。'),
      entry('taste-strange', '変な味がする', 'へんなあじがする', '尝起来有股怪味'),
      entry('smell-strange', '変な匂いがする', 'へんなにおいがする', '闻到一股怪味'),
      entry('hear-quarrel', '喧嘩する音がする', 'けんかするおとがする', '听到吵架或打斗的声音', '如果明确听到有人在争吵，可说「けんかをしている声が聞こえる」。'),
    ],
    points: [
      '「～気がする」「～感じがする」表达个人的感觉、印象或判断。它们在实际用法里有重叠，可结合上下文体会说话者在描述什么。',
      '「味／匂い／音がする」分别对应味觉、嗅觉和听觉。「変な味がする」用来描述东西尝起来怎样。',
    ],
    examples: [
      example('room-feels-cold', '窓を閉めたのに、まだ少し寒い気がする。', '明明关了窗，还是感觉有点冷。'),
      example('chills', '朝から寒気がして、体がだるい。', '从早上开始就觉得发冷，身体也没劲。'),
      example('kitchen-odd-smell', '台所から変な匂いがする。', '厨房飘来一股怪味。'),
      example('corridor-quarrel', '廊下からけんかをしている声が聞こえた。', '走廊里传来争吵声。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '寒い気がする\n感じがする\n変な味がする\n変な匂いがする\n喧嘩する音がする', translation: '感觉冷；有某种感觉；尝起来有怪味；闻到怪味；听到争吵或打斗的声音。' },
  },
  {
    id: 'live-2026-11-04-full-and-savor', title: 'お腹が膨れる・味を楽しむ',
    subtitle: '饱腹感与细细品尝', category: 'vocabulary',
    entries: [
      entry('stomach-fills', 'お腹が膨れる', 'おなかがふくれる', '肚子鼓起来；吃了东西后感到饱', '饭量语境常表示能填饱肚子，身体不适的语境也可能指发胀。'),
      entry('enjoy-flavor', '味を楽しむ', 'あじをたのしむ', '享受食物的味道、细细品尝'),
    ],
    points: [
      '「お腹が膨れる」中的「膨れる」是自动词，描述肚子自身的变化。明确表达“吃饱了”时，日常也常说「お腹がいっぱいになった」。',
      '「味がする」说尝到什么味道；「味を楽しむ」把味道当作主动品尝和享受的对象。',
    ],
    examples: [
      example('rice-ball-full', 'おにぎり一つでも、けっこうお腹が膨れる。', '哪怕只吃一个饭团，也挺有饱腹感。'),
      example('savor-ingredients', '何もつけずに、素材そのものの味を楽しんでください。', '请先什么都不蘸，尝尝食材本身的味道。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'お腹が膨れる\n味を楽しむ', translation: '肚子鼓起来或吃得饱；细细品尝。' },
  },
  {
    id: 'live-2026-11-04-explanatory-conjecture', title: 'んじゃないか',
    subtitle: '口语里的推测或委婉意见', category: 'grammar',
    entries: [
      entry('conjectural-njanai', 'んじゃないか', 'んじゃないか', '会不会是……；恐怕……；我觉得也许……', '这是「のではないか」的口语形式，常接在普通形后。名词和ナ形容词在这里用「～なんじゃないか」。'),
    ],
    points: [
      '「もう着いたんじゃないか」可以推测对方已经到达。上扬语调常带询问语感，后接「と思う」则明确表示个人判断。',
      '「じゃない」在这个句型里配合整句语气提出推测，也可在「遅すぎるんじゃないか」这类句子里委婉提出异议。',
    ],
    examples: [
      example('maybe-closed', '明日は祝日だから、店は休みなんじゃないか。', '明天是节假日，那家店会不会休息？'),
      example('maybe-overheated', '火が強すぎたんじゃないかと思う。', '我觉得也许是火开得太大了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'んじゃないか', translation: '会不会……；也许……吧。' },
  },
  {
    id: 'live-2026-11-04-stare-and-glance', title: 'ジロジロ見る・見詰める・ちらっと見る',
    subtitle: '盯着打量、凝视与瞥一眼', category: 'vocabulary',
    entries: [
      entry('stare-jirojiro', 'ジロジロ見る', 'ジロジロみる', '盯着看、上下打量', '容易给对方造成被打量的感觉。'),
      entry('gaze-fixedly', '見詰める', 'みつめる', '凝视、注视', '也常写作「見つめる」，可中性描写持续注视。'),
      entry('stare-jiromi', 'じろ見する', 'じろみする', '盯着看、打量', '保留原笔记的口语写法，完整表达可说「じろじろ見る」。'),
      entry('glance-chiratto', 'ちらっと見る', 'ちらっとみる', '瞥一眼、很快地看一下'),
      entry('peek-chirami', 'チラ見する', 'ちらみする', '瞄一眼', '口语，可表示趁空看一下，或不太明显地看一眼。'),
    ],
    points: [
      '「ジロジロ見る」常带冒犯感。「見つめる」重在视线持续停留，语气随场景变化。',
      '「ちらっと見る」「チラ見する」重在视线停留时间很短，例如匆匆看一下时间。',
    ],
    examples: [
      example('do-not-stare', '人の顔をじろじろ見ないで。', '别盯着别人的脸看。'),
      example('gazing-at-horizon', '子どもは黙って遠くの海を見つめていた。', '孩子默默地凝望远处的大海。'),
      example('glance-clock', '会議の途中で時計をちらっと見た。', '开会时我瞥了一眼钟。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg／写真4.jpg', quote: 'ジロジロ見る\n見詰める\nじろ見する\nちらっと見る\nチラ見する', translation: '盯着打量；凝视；盯着看；瞥一眼；瞄一下。' },
  },
  {
    id: 'live-2026-11-04-senses-emerge', title: '味がしてきた・見えてきた',
    subtitle: '「～てくる」表示感觉或可见性的出现', category: 'grammar',
    entries: [
      entry('flavor-emerges', '味がしてきた', 'あじがしてきた', '开始尝到味道了、味道渐渐出来了'),
      entry('comes-into-view', '見えてきた', 'みえてきた', '逐渐看得见了；进入视野了', '也可比喻事情逐渐明朗，如「問題の全体像が見えてきた」。'),
    ],
    points: [
      '「～てきた」可描述到说话时为止出现或发展的变化，例如越嚼越能尝到味道，或往前走时终于看得见目的地。',
      '「見える」表示某物进入视野或处于可见状态。「見る」表示主动去看。',
    ],
    examples: [
      example('sweetness-emerges', 'よくかむと、だんだん甘い味がしてきた。', '仔细咀嚼后，慢慢尝出了甜味。'),
      example('station-in-view', '坂を上ると、駅が見えてきた。', '走上坡后，车站就出现在眼前了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg／写真4.jpg', quote: '味がしてきた\n見えてきた', translation: '开始尝到味道了；逐渐看得见了。' },
  },
  {
    id: 'live-2026-11-04-food-and-table', title: '鯛焼き・ラーメンを冷ます・食べてほしい',
    subtitle: '点心、把食物放凉与希望对方尝尝', category: 'vocabulary',
    entries: [
      entry('taiyaki', '鯛焼き', 'たいやき', '鲷鱼烧，常包着红豆馅的鱼形点心', '也常写作「たい焼き」。'),
      entry('cool-ramen', 'ラーメンを冷ます', 'ラーメンをさます', '把拉面放凉一些'),
      entry('want-someone-to-eat', '食べてほしい', 'たべてほしい', '想让对方吃；希望某人尝尝'),
      entry('simple-meal', '粗末な食事', 'そまつなしょくじ', '简陋的饭食、很简单的一餐', '描述别人的饭菜时容易显得轻视。招待客人时，自谦有「粗末なものですが」等说法。'),
      entry('suck-fish-bone', '魚の骨をしゃぶる', 'さかなのほねをしゃぶる', '吮吸鱼骨', '「しゃぶる」指含在嘴里吮吸。'),
    ],
    points: [
      '「ラーメンを冷ます」表示有人把拉面放凉。「ラーメンが冷める」描述拉面变凉。',
      '「食べてほしい」说的是希望别人吃。如果是自己想吃，说「食べたい」。需要明确动作的人时，可说「母にも食べてほしい」。',
    ],
    examples: [
      example('warm-taiyaki', '帰り道に、焼きたてのたい焼きを買った。', '回去的路上，我买了刚烤好的鲷鱼烧。'),
      example('cool-soup-for-child', '子どもが食べられるように、スープを少し冷ました。', '为了让孩子能喝，我把汤稍微放凉了一点。'),
      example('hope-family-tries', 'このお菓子は家族にも食べてほしい。', '这个点心我也想让家人尝尝。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg／写真4.jpg', quote: '鯛焼き\nラーメンを冷ます\n食べてほしい\n粗末な食事\n魚の骨をしゃぶる', translation: '鲷鱼烧；把拉面放凉；希望对方吃；简陋的饭食；吮吸鱼骨。' },
  },
  {
    id: 'live-2026-11-04-body-sounds', title: 'げっぷ・くしゃみ・あくび・いびき・おなら',
    subtitle: '身体反应与常见搭配', category: 'vocabulary',
    entries: [
      entry('burp', 'げっぷ', 'げっぷ', '嗳气、打饱嗝'),
      entry('sneeze', 'くしゃみ', 'くしゃみ', '喷嚏'),
      entry('yawn', 'あくび', 'あくび', '哈欠'),
      entry('snore', 'いびき', 'いびき', '鼾声'),
      entry('flatulence', 'おなら', 'おなら', '屁、放屁时排出的气体'),
    ],
    points: [
      '「げっぷ／くしゃみ／あくび／おならが出る」描述身体自然出现的反应。',
      '“打鼾”常说「いびきをかく」。“打嗝”若指连续的膈肌痉挛，则是「しゃっくり」。',
    ],
    examples: [
      example('sneeze-from-dust', 'ほこりでくしゃみが出た。', '灰尘呛得我打了个喷嚏。'),
      example('snore-in-sleep', '昨夜はいびきをかいていたらしい。', '听说我昨晚睡觉打鼾了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg', quote: 'げっぷ\nくしゃみ\nあくび\nいびき\nおなら', translation: '嗳气；喷嚏；哈欠；鼾声；屁。' },
  },
  {
    id: 'live-2026-11-04-sticky-and-mold', title: 'ベトベト・カビだらけ・カビ臭い・カビる',
    subtitle: '黏腻触感、霉味与发霉', category: 'vocabulary',
    entries: [
      entry('sticky', 'ベトベト', 'ベトベト', '黏糊糊、黏腻', '常说「手がベトベトする」「床がベトベトしている」。'),
      entry('covered-in-mold', 'カビだらけ', 'カビだらけ', '到处都是霉、布满霉斑'),
      entry('musty', 'カビ臭い', 'カビくさい', '有霉味'),
      entry('go-moldy', 'カビる', 'カビる', '发霉', '日常也常说「カビが生える」。'),
    ],
    points: [
      '「だらけ」强调某物很多或遍布各处，常用于让人不快的状态。「カビ臭い」描写气味。',
      '「カビる」是动词，用来描述食物或物品发霉的变化。',
    ],
    examples: [
      example('sticky-hands', 'ジャムがついて、手がベトベトする。', '手沾了果酱，黏糊糊的。'),
      example('musty-closet', '久しぶりに押し入れを開けたら、カビ臭かった。', '打开好久没动的壁橱，闻到了一股霉味。'),
      example('bread-went-moldy', '袋に入れたままのパンにカビが生えた。', '一直放在袋子里的面包发霉了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg', quote: 'ベトベト\nカビだらけ\nカビ臭い\nカビる', translation: '黏糊糊；霉斑遍布；有霉味；发霉。' },
  },
  {
    id: 'live-2026-11-04-mukamuka', title: 'ムカムカする',
    subtitle: '胃里难受与心里恼火', category: 'vocabulary',
    entries: [
      entry('mukamuka', 'ムカムカ', 'ムカムカ', '反胃、恶心；生气、心里窝火', '原笔记在日文旁写有中文提示。阅读时可根据「胃」或引起情绪的事件判断用法。'),
    ],
    points: [
      '「胃がムカムカする」表示胃里不舒服。「失礼な言い方にムカムカした」表示因对方的说法而恼火。',
    ],
    examples: [
      example('stomach-upset', '脂っこい物を食べすぎて、胃がムカムカする。', '油腻的东西吃太多了，胃里直犯恶心。'),
      example('annoyed-by-comment', 'あの失礼な一言を思い出すと、まだムカムカする。', '一想起那句无礼的话，我现在还觉得窝火。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg', quote: 'ムカムカ 呕怒', translation: 'ムカムカ可表示反胃或恼火。末尾为笔记里的中文提示。', readAloud: false },
  },
]
