import type { LiveReactionEntry, LiveReactionExample } from './live-reactions.ts'
import type { LiveUnitGroup } from './live-reaction-units.ts'

// Three continuous phone-note photos headed 26-11-03. Repeated overlap is stored once.
// Source quotes retain visible shorthand; teaching explanations and examples are separate.
const entry = (id: string, expression: string, reading: string, meaning: string, note?: string): LiveReactionEntry => ({
  id: `live-2026-11-03-entry-${id}`, expression, reading, meaning, ...(note ? { note } : {}),
})
const example = (id: string, japanese: string, chinese: string): LiveReactionExample => ({
  id: `live-2026-11-03-example-${id}`, japanese, chinese,
})

export const liveNovember3Groups: LiveUnitGroup[] = [
  {
    id: 'live-2026-11-03-boomerang', title: 'ブーメラン・手元に帰ってくる',
    subtitle: '回旋镖与“投出去又回到手边”', category: 'vocabulary',
    entries: [
      entry('boomerang', 'ブーメラン', 'ブーメラン', '回旋镖；依语境也可比喻反过来影响自己'),
      entry('return-to-hand', '投げると手元に帰ってくる', 'なげるとてもとにかえってくる', '一投出去就回到手边', '保留原笔记的「帰ってくる」。物品回到原处一般也常说「戻ってくる」，不从这个片段推断具体道具的能力。'),
    ],
    points: [
      '「手元」是身边、手边；「投げると」的「と」在这里表示某条件发生后出现的结果，不是并列的“和”。',
      '「帰る」常用于人回家等回到归属处的动作；说明物品回到原处，用「戻る」更中性。两条笔记可以联读，但截图没有提供完整情节。',
    ],
    examples: [example('boomerang-return', '投げたブーメランが手元に戻ってきた。', '扔出去的回旋镖回到了手边。')],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg', quote: 'ブーメラン\n投げると手元に帰ってくる', translation: '回旋镖；一投出去就回到手边。' },
  },
  {
    id: 'live-2026-11-03-thrill', title: 'わくわく・どきどき・はらはら・ぞくぞく',
    subtitle: '期待、心跳、不安与强烈感受', category: 'vocabulary',
    entries: [
      entry('wakuwaku', 'わくわく', 'わくわく', '兴奋期待、心里雀跃'),
      entry('taste-thrill', 'スリルを味わう', 'スリルをあじわう', '体验惊险刺激'),
      entry('dokidoki', 'どきどき', 'どきどき', '心怦怦跳；紧张、激动等引起的心跳感'),
      entry('harahara', 'はらはら', 'はらはら', '提心吊胆、捏一把汗', '另可形容物体轻轻飘落；这里与感受表达联读。'),
      entry('zokuzoku', 'ぞくぞく', 'ぞくぞく', '阵阵发冷、战栗；也可表示兴奋得发抖', '另有「続々」表示接连不断的用法，需看语境。'),
    ],
    points: [
      '「わくわく」常偏向对即将发生之事的期待；「どきどき」突出心跳，不必然是快乐，也可由紧张引起。',
      '「はらはら」常用于担心局面会出问题；「ぞくぞく」可以来自寒意、恐惧或强烈兴奋，不能固定成一种情绪。',
      '「味わう」不仅用于品尝食物，也可用于体验某种感受，如「喜びを味わう」。',
    ],
    examples: [
      example('trip-excitement', '明日からの旅行を考えると、わくわくする。', '想到明天开始的旅行，我就兴奋期待。'),
      example('presentation-heartbeat', '発表の順番を待つ間、どきどきしていた。', '等着轮到自己发言时，我的心怦怦直跳。'),
      example('match-anxiety', '試合の最後まで、はらはらしながら見ていた。', '我提心吊胆地看到了比赛最后。'),
      example('cold-shiver', '冷たい風が吹いて、背中がぞくぞくした。', '冷风一吹，后背一阵发冷。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'わくわく\nスリルを味わう\nどきどき\nはらはら\nぞくぞく', translation: '兴奋期待；体验刺激；心怦怦跳；提心吊胆；阵阵战栗。' },
  },
  {
    id: 'live-2026-11-03-notify-call', title: '通報する・警察を呼ぶ・人を呼び出す',
    subtitle: '通报、叫来与召人前来', category: 'vocabulary',
    entries: [
      entry('report', '通報する', 'つうほうする', '向有关机构通报、报告情况'),
      entry('call-police', '警察を呼ぶ', 'けいさつをよぶ', '叫警察来'),
      entry('summon-person', '人を呼び出す', 'ひとをよびだす', '把人叫出来、叫到某处'),
    ],
    points: [
      '「通報する」强调把事件等情况告知有关机构，常说「警察に通報する」；「警察を呼ぶ」强调叫警察前来。',
      '「呼び出す」是在「呼ぶ」的基础上，把某人叫到某处或叫出来。它本身不限定为打电话，也不必然带责备。',
    ],
    examples: [
      example('notify-police', '近所の人が異変に気づき、警察に通報した。', '附近居民发现异常，向警方报了警。'),
      example('call-to-entrance', '先生は生徒を入口に呼び出した。', '老师把学生叫到了入口。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg', quote: '通報する\n警察を呼ぶ\n人を呼び出す', translation: '通报；叫警察来；把人叫出来。' },
  },
  {
    id: 'live-2026-11-03-noun-modifiers', title: '読んだことのない漫画・母の作った料理',
    subtitle: '名词前的修饰小句与「が／の」', category: 'grammar',
    entries: [
      entry('unread-comic', '読んだことのない漫画', 'よんだことのないまんが', '没有读过的漫画'),
      entry('mother-cooking', '母の作った料理', 'ははのつくったりょうり', '母亲做的菜'),
    ],
    points: [
      '「～たことがない」表示没有某种经历；修饰名词时可以说「読んだことがない漫画」，也可用「の」说成「読んだことのない漫画」。',
      '「母の作った料理」中「母」是做菜的人，意思接近「母が作った料理」。这种名词修饰小句中的「が／の」交替不能机械推广到所有独立句。',
    ],
    examples: [
      example('unread-comic-find', '図書館で、まだ読んだことのない漫画を見つけた。', '我在图书馆找到了还没读过的漫画。'),
      example('mother-cooking-miss', '母の作った料理が懐かしい。', '我很怀念母亲做的菜。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: '読んだことのない漫画\n母の作った料理', translation: '没有读过的漫画；母亲做的菜。' },
  },
  {
    id: 'live-2026-11-03-conquer-tree', title: '木を征服する：保留原文，辨认搭配',
    subtitle: '「征服する」不等于一般的“爬树”', category: 'vocabulary',
    entries: [entry('conquer-tree', '木を征服する', 'きをせいふくする', '（字面）征服一棵树', '这是照片可见的原笔记，缺少上下文。不能直接教成“爬树”的常用说法；普通的“爬树”说「木に登る」。')],
    points: [
      '「征服する」有征服、攻克等含义，具体搭配可能带比喻或夸张。原笔记只有这个片段，不据此改写成别的对象或补造漫画情节。',
      '若要表达动作“爬到树上”，学习时使用「木に登る」；若原场景有夸张意义，应结合实际对白再判断。',
    ],
    examples: [example('climb-tree', '子どもが庭の木に登っている。', '孩子正在爬院子里的树。')],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: '木を征服する', translation: '字面为“征服一棵树”；原场景和具体用意未提供。' },
  },
  {
    id: 'live-2026-11-03-anger-control', title: '口論する・カッとなる・自分をコントロールする',
    subtitle: '争论、突然发火与控制自己', category: 'vocabulary',
    entries: [
      entry('argue', '口論する', 'こうろんする', '争论、口角'),
      entry('flare-up', 'カッとなる', 'カッとなる', '突然火起、一下子激动起来'),
      entry('control-oneself', '自分をコントロールする', 'じぶんをコントロールする', '控制自己、约束自己的情绪或行为'),
    ],
    points: [
      '「口論」强调言语上的争执；不等于普通交换意见的「話し合い」。',
      '「カッとなる」常描写感情突然高涨、发火的瞬间。「自分をコントロールする」则强调约束自己的反应。',
    ],
    examples: [
      example('avoid-hasty-reply', 'カッとなって言い返す前に、少し時間を置いた。', '我在一时发火、回嘴之前，先缓了一会儿。'),
      example('avoid-argument', '口論になりそうだったので、落ち着いて話すようにした。', '眼看要吵起来了，我便尽量冷静地说话。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg', quote: '口論する\nカッとなる\n自分をコントロールする', translation: '争论；一下子发火；控制自己。' },
  },
  {
    id: 'live-2026-11-03-unnoticed', title: 'つい・知らないうちに・いつの間にか',
    subtitle: '不由得与不知不觉；不要把时间表达直接画等号', category: 'grammar',
    entries: [
      entry('unintentionally', 'つい', 'つい', '不由得、一不留神；也可表示时间或距离很近', '这里与无意间发生的行为联读，另有「ついさっき」等用法。'),
      entry('without-knowing', '知らないうちに', 'しらないうちに', '在自己不知道、没察觉的时候'),
      entry('unconsciously', '知らず知らず', 'しらずしらず', '不知不觉、无意之中'),
      entry('before-one-knows', 'いつの間にか', 'いつのまにか', '不知何时、不知不觉间'),
      entry('when-without-noticing', 'いつの間に', 'いつのまに', '什么时候；在没察觉的时候', '原笔记写「いつの間に＝いつ」，这里只是粗略提示。前者常包含没有注意到变化、惊讶等语气，不与「いつ」在所有场景中互换。'),
    ],
    points: [
      '「つい」常修饰并非有意、没控制住的动作；「知らず知らず」可配「に／のうちに」，强调无意识地发生。',
      '「いつの間にか」常用于陈述某变化已经发生但没察觉其过程；「いつの間に」也常用于惊讶的询问。单纯询问约定时间时一般用「いつ」。',
      '保留原笔记的「いつの間に＝いつ」，同时注明这不是无条件的同义公式。',
    ],
    examples: [
      example('unintended-snack', '話に夢中になって、ついお菓子を食べすぎた。', '聊得太投入，不由得吃多了零食。'),
      example('unnoticed-rain-stop', 'いつの間にか雨がやんでいた。', '不知不觉间雨已经停了。'),
      example('when-learned', 'いつの間にそんなに上手になったの？', '你什么时候变得这么熟练了？'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'つい\n知らないうちに\n知らず知らず\nいつの間にか\nいつの間に＝いつ', translation: '不由得；不知情的时候；不知不觉；不知何时；最后一行是原笔记的简化对照，并非完全等义。', readAloud: false },
  },
  {
    id: 'live-2026-11-03-result-time', title: 'ついに・さっそく・すっかり',
    subtitle: '最终结果、立即行动与完全变化', category: 'vocabulary',
    entries: [
      entry('finally', 'ついに', 'ついに', '终于、最终'),
      entry('promptly', 'さっそく', 'さっそく', '马上、立即；不耽搁地开始'),
      entry('completely', 'すっかり', 'すっかり', '完全、彻底；整个状态都改变了'),
    ],
    points: [
      '「ついに」表示经过过程后终于达到某结果，结果可好可坏；与“不由得”的「つい」分开记。',
      '「さっそく」常强调得到信息或遇到机会后马上行动；「すっかり」强调程度或状态的完全性，不是“马上”。',
    ],
    examples: [
      example('finally-finished', '何度も直して、ついに作品が完成した。', '修改了多次，作品终于完成了。'),
      example('try-promptly', '教えてもらった方法を、さっそく試してみた。', '我马上试了试别人教给我的方法。'),
      example('completely-forgot', '約束をすっかり忘れていた。', '我把约定忘得一干二净了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg', quote: 'ついに\nすっかり\nさっそく', translation: '终于；完全；马上。' },
  },
  {
    id: 'live-2026-11-03-soredemo', title: 'それでも：即便如此，还是……',
    subtitle: '承认前面条件后，说明仍成立的结果', category: 'grammar',
    entries: [entry('even-so', 'それでも', 'それでも', '即便如此、尽管那样；还是……')],
    points: ['「それでも」承接前面的事实或条件，后文表达在这种情况下仍然成立的判断、行动。前项即使是不利条件，后项仍然成立。'],
    examples: [example('continue-even-so', '時間はかかる。それでも、最後までやってみたい。', '虽然很费时间，即便如此，我还是想坚持做到最后。')],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'それでも 即便如此', translation: '即便如此。', readAloud: false },
  },
  {
    id: 'live-2026-11-03-achievement', title: '歴史に残る出来事・偉業・勇気を褒め称える',
    subtitle: '事件、功绩与赞颂', category: 'vocabulary',
    entries: [
      entry('historic-event', '歴史に残る出来事', 'れきしにのこるできごと', '载入史册的事件'),
      entry('great-achievement', '偉業', 'いぎょう', '伟业、伟大的功绩'),
      entry('praise-courage', '勇気を褒め称える', 'ゆうきをほめたたえる', '赞颂、称赞其勇气'),
    ],
    points: [
      '「歴史に残る」表示值得长期记载、留下影响，并不限定为正面的事件；「偉業」则带赞许伟大功绩的评价。',
      '「褒め称える」读「ほめたたえる」，比普通「褒める」更突出高度赞扬、赞颂；「称える」这里不读「となえる」。',
    ],
    examples: [
      example('praise-volunteer-courage', '人々は、救助に向かった人の勇気を褒め称えた。', '人们赞颂前去救援者的勇气。'),
      example('achievement-record', 'その偉業は、歴史に残る出来事として語り継がれている。', '这项伟业作为载入史册的事件流传至今。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg重叠部分', quote: '歴史に残る出来事\n偉業\n勇気を褒め称える', translation: '载入史册的事件；伟业；赞颂勇气。' },
  },
  {
    id: 'live-2026-11-03-deliberate', title: 'わざわざ・わざと・わざとらしい',
    subtitle: '特意费心、故意为之与做作', category: 'vocabulary',
    entries: [
      entry('specially', 'わざわざ', 'わざわざ', '特意、专程；特地费心去做'),
      entry('on-purpose', 'わざと', 'わざと', '故意、有意地'),
      entry('affected-gesture', 'わざとらしい身振り', 'わざとらしいみぶり', '做作、显得刻意的动作姿态'),
    ],
    points: [
      '「わざわざ」强调特意花时间或周折，可以用于感谢，也可能依上下文表达不满；「わざと」强调不是偶然，而是故意这样做。',
      '「わざとらしい」评价动作、说法不自然、像装出来的，不是「わざと」加「らしい」就一律表示传闻“听说故意”。',
    ],
    examples: [
      example('special-visit-thanks', 'わざわざ来てくれて、ありがとう。', '谢谢你特意跑来。'),
      example('intentional-loss', '子どもを喜ばせようとして、わざと負けた。', '为了让孩子高兴，我故意输了。'),
      example('affected-gesture-impression', '大げさな身振りが、少しわざとらしく見えた。', '夸张的动作显得有点做作。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg重叠部分', quote: 'わざわざ 特意\nわざと 故意\nわざとらしい身振り', translation: '特意；故意；做作的动作。', readAloud: false },
  },
  {
    id: 'live-2026-11-03-social-idioms', title: 'お世辞を言う・水を差す',
    subtitle: '奉承与扫兴的惯用表达', category: 'vocabulary',
    entries: [
      entry('flatter', 'お世辞を言う', 'おせじをいう', '说客套的赞美话、奉承'),
      entry('spoil-mood', '水を差す', 'みずをさす', '泼冷水、扫兴；也可按字面表示添水'),
    ],
    points: [
      '「お世辞」常指为了让对方高兴等而说的赞美，不必把所有真诚的夸奖都称为「お世辞」。',
      '「話に水を差す」等用法表示打断兴致、妨碍顺利进行；不要与给植物浇水的「水をやる」混为一谈。',
    ],
    examples: [
      example('not-flattery', 'お世辞ではなく、本当にすてきな作品だと思います。', '我不是在说客套话，是真的觉得这件作品很棒。'),
      example('interrupt-cheerful-talk', '楽しい話に水を差すようで悪いけれど、そろそろ帰ろう。', '抱歉打断大家的兴致，不过差不多该回去了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'お世辞を言う\n水を差す', translation: '说奉承话；泼冷水、扫兴。' },
  },
  {
    id: 'live-2026-11-03-half-eaten', title: '食べかけのケーキ：吃到一半的蛋糕',
    subtitle: '动词ます形词干＋かけ', category: 'grammar',
    entries: [entry('half-eaten-cake', '食べかけのケーキ', 'たべかけのケーキ', '吃到一半、尚未吃完的蛋糕')],
    points: [
      '「食べかけ」指已开始吃但尚未完成的状态。「～かけの＋名词」中用「の」连接后面的名词。',
      '「～かける」也可表示某事开始发生、眼看就要发生，具体含义取决于动词；这条不要译成“还没开始吃”。',
    ],
    examples: [example('half-eaten-cake-fridge', '食べかけのケーキを冷蔵庫に入れた。', '我把吃到一半的蛋糕放进了冰箱。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '食べかけのケーキ', translation: '吃到一半的蛋糕。' },
  },
  {
    id: 'live-2026-11-03-refusal', title: '容赦なく・承知しない・承諾しない',
    subtitle: '不留情面、不答应与不接受请求', category: 'vocabulary',
    entries: [
      entry('without-mercy', '容赦なく', 'ようしゃなく', '毫不留情地、不宽容地'),
      entry('not-accept', '承知しない', 'しょうちしない', '不答应、不允许；依语境也可指不知情', '「承知」有知道、理解和同意等意思，不能脱离语境只记一个译法。'),
      entry('not-consent', '承諾しない', 'しょうだくしない', '不答应请求、不表示同意'),
    ],
    points: [
      '「承諾」着重接受对方的请求、提议；「承知」范围更广，可以是知道、理解，也可以是答应。',
      '口语「そんなことをしたら承知しない」可能带强烈警告、威胁语气；不要把它当作礼貌拒绝请求的固定句。',
      '「容赦なく」常修饰动作方式，表达不留情面；与是否同意请求不是同一层面的词。',
    ],
    examples: [
      example('not-consent-proposal', '条件が合わないため、その提案には承諾しなかった。', '因为条件不合适，我没有接受那项提议。'),
      example('severe-rain', '雨は容赦なく降り続いた。', '雨毫不留情地持续下着。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '容赦なく\n承知しない\n承諾しない', translation: '毫不留情地；不答应、不允许等；不接受请求。' },
  },
  {
    id: 'live-2026-11-03-noodles', title: 'ラーメンが伸びる：面泡软、失去口感',
    subtitle: '这里的「のびる」不是“长高”', category: 'vocabulary',
    entries: [entry('noodles-soggy', 'ラーメンが伸びる', 'ラーメンがのびる', '拉面泡软、泡胀，失去原有口感', '保留原笔记写法；学习例句用平假名「のびる」明确这一食物用法。')],
    points: ['面条在汤里放久了吸水、失去口感，可说「麺がのびる」。这里的「が」标记发生变化的面条，不是有人把面条拉长的「伸ばす」。'],
    examples: [example('eat-before-soggy', 'ラーメンがのびる前に、食べよう。', '趁拉面还没泡软，快吃吧。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'ラーメンが伸びる', translation: '拉面放久后泡软、失去口感。' },
  },
  {
    id: 'live-2026-11-03-fantasy', title: '瞬間移動・タイムスリップ',
    subtitle: '空间移动与时间穿越', category: 'vocabulary',
    entries: [
      entry('teleportation', '瞬間移動', 'しゅんかんいどう', '瞬间移动'),
      entry('time-slip', 'タイムスリップ', 'タイムスリップ', '时间穿越、来到另一时代'),
    ],
    points: ['「瞬間移動」强调在极短时间内移动到别处；「タイムスリップ」常用于故事中来到过去或未来，不是一般的移动速度快。'],
    examples: [example('time-slip-story', 'この物語では、主人公が百年前にタイムスリップする。', '这个故事中，主人公穿越到了百年前。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '瞬間移動\nタイムスリップ', translation: '瞬间移动；时间穿越。' },
  },
  {
    id: 'live-2026-11-03-position', title: 'てっぺん・右はし',
    subtitle: '最上端与最右端', category: 'vocabulary',
    entries: [
      entry('very-top', 'てっぺん', 'てっぺん', '最顶端、顶点；头顶等'),
      entry('right-edge', '右はし', 'みぎはし', '右端、最右边', '保留原笔记的混合写法；通常也写作「右端」。'),
    ],
    points: ['「てっぺん」是较口语的顶部、最高处；「右はし」的「はし」是边端，在这里对应「端」，不是桥或筷子。'],
    examples: [
      example('tower-top', '塔のてっぺんに旗がある。', '塔顶上有一面旗。'),
      example('right-edge-button', '画面の右端にあるボタンを押してください。', '请按画面最右边的按钮。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg／写真3.jpg', quote: 'てっぺん\n右はし', translation: '最顶端；右端。' },
  },
  {
    id: 'live-2026-11-03-show', title: 'みんなに見せる：给大家看',
    subtitle: '看的人用「に」，展示的对象用「を」', category: 'transitivity',
    entries: [entry('show-everyone', 'みんなに見せる', 'みんなにみせる', '展示给大家看')],
    points: ['「見せる」是展示、给人看的词汇动词，常用「人に物を見せる」。不要把它直接写成「見る」的普通使役形；「見る」的使役形是「見させる」。这条在本日笔记再次出现，保留本日归属。'],
    examples: [example('show-drawing', '自分で描いた絵をみんなに見せた。', '我把自己画的画给大家看了。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'みんなに見せる', translation: '给大家看。' },
  },
  {
    id: 'live-2026-11-03-glare', title: '目も眩む・眩しい',
    subtitle: '目眩、强光与强调的「も」', category: 'vocabulary',
    entries: [
      entry('eyes-dazzled', '目も眩む', 'めもくらむ', '令人目眩；强烈地强调眼花、目眩的程度', '「目も眩むような」是成立的强调表达，不应当作「目が眩む」的错字。'),
      entry('dazzling', '眩しい', 'まぶしい', '耀眼、刺眼；也可比喻光彩夺目'),
    ],
    points: [
      '「目が眩む」的「眩む」读「くらむ」，可以表示因强光、高处等而眼花、目眩，也有因利益等失去判断的比喻用法。',
      '「目も眩むような高さ」中的「も」加强程度；「眩しい」则读「まぶしい」。同一汉字在这里的读法不同。',
    ],
    examples: [
      example('dizzying-height', '目も眩むような高さの崖を見上げた。', '我仰望着高得令人目眩的悬崖。'),
      example('sun-dazzling', '朝日が眩しくて、目を細めた。', '朝阳很刺眼，我眯起了眼睛。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '目も眩む\n眩しい', translation: '令人目眩；耀眼、刺眼。' },
  },
  {
    id: 'live-2026-11-03-body-words', title: '手がしびれる・心臓麻ヒ・皮フ科',
    subtitle: '身体感受与笔记中的汉字、片假名混写', category: 'vocabulary',
    entries: [
      entry('hand-numb', '手がしびれる', 'てがしびれる', '手发麻'),
      entry('cardiac-paralysis', '心臓麻痺', 'しんぞうまひ', '心脏麻痹', '原笔记写「心臓麻ヒ」，此处补全常见汉字写法。'),
      entry('dermatology', '皮膚科', 'ひふか', '皮肤科', '原笔记写「皮フ科」，此处补全汉字「膚」。'),
    ],
    points: [
      '「しびれる」可表示麻木、发麻。这里的「手がしびれる」是身体感受，不要与「手が疲れる」只表示累了混同。',
      '照片里的「麻ヒ」「皮フ」为混合写法，学习词条分别整理为「麻痺」「皮膚」。',
    ],
    examples: [
      example('numb-hand-sentence', '長い間同じ姿勢でいたら、手がしびれた。', '长时间保持同一个姿势后，手发麻了。'),
      example('dermatology-sign', '病院の案内板で、皮膚科の場所を確認した。', '我在医院的指示牌上确认了皮肤科的位置。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '手がしびれる\n心臓麻ヒ\n皮フ科', translation: '手发麻；心脏麻痹；皮肤科。后两项保留原笔记混写。', readAloud: false },
  },
  {
    id: 'live-2026-11-03-mood', title: '憂うつ・うつ病',
    subtitle: '心情描写与疾病名称分开记', category: 'vocabulary',
    entries: [
      entry('gloomy', '憂うつ', 'ゆううつ', '忧郁、心情沉闷；令人提不起精神'),
      entry('depression', 'うつ病', 'うつびょう', '抑郁症；疾病名称'),
    ],
    points: ['「憂うつ」可描述当下的沉闷心情，常说「憂うつな気分」；「うつ病」是疾病名称，两者并非同义词。'],
    examples: [example('gloomy-rain', '雨の日が続くと、少し憂うつな気分になる。', '阴雨天持续时，我会有点心情沉闷。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg／写真3.jpg重叠部分', quote: '憂うつ\nうつ病', translation: '忧郁、心情沉闷；抑郁症。' },
  },
  {
    id: 'live-2026-11-03-negative-command', title: '変なことに使うな：别拿去做奇怪的事',
    subtitle: '辞书形＋な表示禁止', category: 'grammar',
    entries: [entry('do-not-misuse', '変なことに使うな', 'へんなことにつかうな', '不要拿去做奇怪的事', '直接、较强硬的禁止说法；不能当作礼貌请求使用。')],
    points: ['动词辞书形后接「な」表示禁止，如「使うな」。与动词ます形词干接「なさい」形成命令的用法不同；较礼貌地请求可说「使わないでください」。'],
    examples: [example('do-not-misuse-tool', 'この道具を変なことに使うな。', '别拿这个工具去做奇怪的事。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg／写真3.jpg重叠部分', quote: '変なことに使うな', translation: '不要拿去做奇怪的事。' },
  },
  {
    id: 'live-2026-11-03-origin', title: 'ことの発端：事情的起因',
    subtitle: '「発端」读「ほったん」', category: 'vocabulary',
    entries: [entry('origin-of-affair', 'ことの発端', 'ことのほったん', '事情的起因、开端', '原笔记在「発端」后紧接「ほったん」，属于读音旁注，不是要连续朗读两次。')],
    points: ['「発端」强调事情开始的缘由、起头，常说「ことの発端は～だ」。小促音要读出「ほったん」，不是「はったん」。'],
    examples: [example('origin-small-misunderstanding', 'ことの発端は、小さな誤解だった。', '事情的起因是一个小小的误会。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'ことの発端ほったん', translation: '事情的起因；「ほったん」是「発端」的读音旁注。', readAloud: false },
  },
  {
    id: 'live-2026-11-03-pleasure', title: '嬉しい・楽しい・楽しむ・楽しみ',
    subtitle: '高兴、愉快、享受与期待；「楽」不只读一种音', category: 'vocabulary',
    entries: [
      entry('glad', '嬉しい', 'うれしい', '因好事、好结果而高兴'),
      entry('enjoyable', '楽しい', 'たのしい', '愉快、有乐趣'),
      entry('enjoy', '楽しむ', 'たのしむ', '享受、以某事为乐'),
      entry('pleasure-anticipation', '楽しみ', 'たのしみ', '乐趣；期待的事、盼头'),
      entry('easy-work', '楽な仕事', 'らくなしごと', '轻松、不太费力的工作'),
      entry('carefree-task', '気楽な作業', 'きらくなさぎょう', '心理上轻松、没有太大压力的作业或任务'),
      entry('enjoy-view', '眺めを楽しむ', 'ながめをたのしむ', '欣赏景色、享受眼前景致'),
      entry('look-forward-match', '試合を楽しみにする', 'しあいをたのしみにする', '期待比赛'),
    ],
    points: [
      '「嬉しい」常着眼于自己盼望的好事实现；「楽しい」常评价活动、相处或时间有乐趣。两者可能都译成开心，但着眼点不同。',
      '「楽しむ」是动词，常说「景色を楽しむ」；名词「楽しみ」可表示乐趣，也可用于「～を楽しみにする／している」表达期待。',
      '「楽な」读「らくな」，强调省力、负担轻；「気楽な」读「きらくな」，强调心理上轻松。轻松不必然意味着有趣。',
      '笔记的中文是简要提示；「楽しみ」不能在每个句子里都机械译成“快乐”。',
    ],
    examples: [
      example('glad-meeting', '久しぶりに友達に会えて、嬉しかった。', '久别后能见到朋友，我很高兴。'),
      example('enjoyable-afternoon', '友達と話して、楽しい午後を過ごした。', '我和朋友聊天，度过了愉快的下午。'),
      example('enjoy-window-view', '窓からの眺めを楽しんだ。', '我欣赏了窗外的景色。'),
      example('look-forward-next-match', '来週の試合を楽しみにしている。', '我期待着下周的比赛。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '嬉しい 开心的\n楽しい 快乐的\n楽しむ 享受\n楽しみ 期待，快乐\n楽な仕事 轻松的\n気楽な作業\n眺めを楽しむ\n試合を楽しみにする', translation: '高兴；愉快；享受；乐趣或期待；轻松的工作；心理上轻松的作业；欣赏景致；期待比赛。', readAloud: false },
  },
  {
    id: 'live-2026-11-03-timing', title: 'ピッタリ・タイミングを見計らう',
    subtitle: '恰好合适与看准时机', category: 'vocabulary',
    entries: [
      entry('perfect-fit', 'ピッタリ', 'ピッタリ', '恰好、正合适；紧密贴合'),
      entry('choose-timing', 'タイミングを見計らう', 'タイミングをみはからう', '看准、斟酌合适的时机'),
    ],
    points: [
      '「ピッタリ」依语境可表示尺寸、时间、条件等恰好合适，或紧密贴合。片假名写法可加强视觉效果，平假名「ぴったり」也常见。',
      '「見計らう」读「みはからう」，是观察情况后选取适当时机；不是只“看到时间”就结束。',
    ],
    examples: [
      example('perfect-size', 'この靴は足にピッタリ合う。', '这双鞋正合脚。'),
      example('choose-question-time', '話しかけるタイミングを見計らった。', '我看准了搭话的时机。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'ピッタリ\nタイミングを見計らう', translation: '恰好合适；看准时机。' },
  },
  {
    id: 'live-2026-11-03-mama-shimau', title: '電気をつけたまま、寝てしまった',
    subtitle: '维持某状态＋结果或遗憾的「しまう」', category: 'grammar',
    entries: [entry('sleep-lights-on', '電気をつけたまま、寝てしまった', 'でんきをつけたままねてしまった', '灯没关，就睡着了')],
    points: [
      '「つけたまま」表示开灯后的状态一直保持，睡着时灯仍开着；不要只译成“开灯后睡觉”，漏掉状态的持续。',
      '「寝てしまった」可强调结果已经发生，也常带不小心、遗憾等语气；具体心情仍依上下文判断。',
    ],
    examples: [example('lights-left-on', '昨夜は電気をつけたまま、寝てしまった。', '昨晚我灯没关就睡着了。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '電気をつけたまま、寝てしまった', translation: '灯没关，就睡着了。' },
  },
  {
    id: 'live-2026-11-03-zutsu', title: '三人ずつ・少しずつ',
    subtitle: '每份、每次相同数量与一点一点', category: 'grammar',
    entries: [
      entry('enter-three-at-time', '三人ずつ部屋に入ってください', 'さんにんずつへやにはいってください', '请每次三个人进入房间'),
      entry('little-by-little', '少しずつ', 'すこしずつ', '一点一点地、逐渐地'),
    ],
    points: ['数量或程度词接「ずつ」可表示等量分配或按一定份量逐次进行。「三人ずつ」不是只允许三个人进入一次；「少しずつ」强调少量地分次推进。'],
    examples: [
      example('enter-three-request', '順番に、三人ずつ部屋に入ってください。', '请按顺序，每次三个人进入房间。'),
      example('little-daily-study', '毎日少しずつ、日本語を勉強している。', '我每天一点一点地学习日语。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '三人ずつ部屋に入ってください\n少しずつ', translation: '请每次三个人进入房间；一点一点地。' },
  },
  {
    id: 'live-2026-11-03-call-purpose', title: '呼びに来る：来叫人',
    subtitle: '动词ます形词干＋に＋移动动词', category: 'grammar',
    entries: [entry('come-to-call', '呼びに来る', 'よびにくる', '来叫、来喊某人')],
    points: ['「呼びに来る」的「に」表示来这里的目的。「呼び」是「呼ぶ」的ます形词干；它与前面的「人を呼び出す」在动作方向、结构上不同。'],
    examples: [example('friend-came-call', '準備ができると、友達が私を呼びに来た。', '准备好后，朋友来叫我了。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '呼びに来る', translation: '来叫某人。' },
  },
  {
    id: 'live-2026-11-03-manner-words', title: 'チョロチョロ・ぐずぐず・だらだら・まごまご',
    subtitle: '小幅移动、磨蹭、拖沓与不知所措', category: 'vocabulary',
    entries: [
      entry('choro-choro', 'チョロチョロ', 'チョロチョロ', '小东西来回窜动；细水等少量流动', '具体含义看修饰对象，不能固定成“走来走去”。'),
      entry('guzu-guzu', 'ぐずぐず', 'ぐずぐず', '磨磨蹭蹭、拖延；也可表示嘟嘟囔囔等'),
      entry('dara-dara', 'だらだら', 'だらだら', '拖拖拉拉、松散地持续；也可形容液体不断流下'),
      entry('mago-mago', 'まごまご', 'まごまご', '不知所措、手忙脚乱、犹豫着不知怎么做'),
    ],
    points: [
      '这组拟态词常与「する」等搭配，但各自描写的状态不同。「ぐずぐず」偏不及时行动，「まごまご」偏不会应对而慌乱、迟疑。',
      '「だらだら話す」是说话拖沓、没完没了；「汗がだらだら流れる」是液体持续流下。不要只记一个中文对应。',
      '「チョロチョロ」可以写作「ちょろちょろ」。说人总在眼前窜来窜去时，可能带觉得碍事的语气。',
    ],
    examples: [
      example('stream-trickle', '蛇口から水がちょろちょろ流れている。', '水正从水龙头涓涓流出。'),
      example('stop-dawdling', 'ぐずぐずしていると、電車に遅れるよ。', '再磨蹭就赶不上电车了。'),
      example('avoid-rambling', '説明がだらだら長くならないように、要点をまとめた。', '为了不让说明冗长拖沓，我归纳了要点。'),
      example('lost-at-station', '初めての駅で出口がわからず、まごまごした。', '第一次到这个车站，我找不到出口，有点不知所措。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'チョロチョロ\nぐずぐず\nだらだら\nまごまご', translation: '小东西来回窜动等；磨蹭；拖沓；不知所措。' },
  },
  {
    id: 'live-2026-11-03-absence', title: '何もない・誰もいない',
    subtitle: '疑问词＋も＋否定与「ある／いる」', category: 'grammar',
    entries: [
      entry('nothing', '何もない', 'なにもない', '什么也没有'),
      entry('nobody', '誰もいない', 'だれもいない', '谁也不在、没有人'),
    ],
    points: ['「何も／誰も」在这里与否定形式相配，表示全面否定。物品等的存在常用「ある／ない」，人的存在用「いる／いない」；不要说成「誰もない」。'],
    examples: [
      example('nothing-on-desk', '机の上には何もない。', '桌子上什么也没有。'),
      example('nobody-in-room', '部屋には誰もいない。', '房间里一个人也没有。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '何もない\n誰もいない', translation: '什么也没有；一个人也没有。' },
  },
  {
    id: 'live-2026-11-03-reflect', title: '鏡に映る：映在镜子里',
    subtitle: '自动词「映る」与他动词「映す」', category: 'transitivity',
    entries: [entry('reflected-in-mirror', '鏡に映る', 'かがみにうつる', '映在镜子里、在镜中显出影像')],
    points: ['「映る」表示影像显现，是自动词，常说「顔が鏡に映る」；「映す」表示使影像显现，如「鏡に顔を映す」。这里的「に」标记影像显现的地方。'],
    examples: [example('face-mirror', '鏡に映った自分の顔を見た。', '我看了映在镜子里的自己的脸。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '鏡に映る', translation: '映在镜子里。' },
  },
  {
    id: 'live-2026-11-03-button', title: 'ボタンを押す：按按钮',
    subtitle: '动作对象用「を」', category: 'vocabulary',
    entries: [entry('press-button', 'ボタンを押す', 'ボタンをおす', '按按钮')],
    points: ['「押す」读「おす」，表示按、推等。按按钮用「ボタンを押す」。'],
    examples: [example('press-start-button', '準備ができたら、開始ボタンを押してください。', '准备好后，请按开始按钮。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'ボタンを押す', translation: '按按钮。' },
  },
]
