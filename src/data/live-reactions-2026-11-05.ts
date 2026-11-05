import type { LiveReactionEntry, LiveReactionExample } from './live-reactions.ts'
import type { LiveUnitGroup } from './live-reaction-units.ts'

// Three overlapping phone-note photos headed 26-11-05.
// Source quotes retain the visible wording. Examples are original teaching material.
const entry = (id: string, expression: string, reading: string, meaning: string, note?: string): LiveReactionEntry => ({
  id: `live-2026-11-05-entry-${id}`, expression, reading, meaning, ...(note ? { note } : {}),
})
const example = (id: string, japanese: string, chinese: string): LiveReactionExample => ({
  id: `live-2026-11-05-example-${id}`, japanese, chinese,
})

export const liveNovember5Groups: LiveUnitGroup[] = [
  {
    id: 'live-2026-11-05-replace-and-rearrange', title: '取り替える・入れ替える・割り当てる',
    subtitle: '替换、调换与分配任务', category: 'vocabulary',
    entries: [
      entry('replace', '取り替える', 'とりかえる', '换掉、替换', '常指把旧的、坏的或不合适的东西换成别的。'),
      entry('swap-rearrange', '入れ替える', 'いれかえる', '调换、更换位置或内容', '既可交换两者的位置，也可更换成员、内容等。'),
      entry('assign', '割り当てる', 'わりあてる', '分配、分派', '常见「仕事を割り当てる」「時間を割り当てる」。'),
    ],
    points: ['「取り替える」常突出替换某物；「入れ替える」可突出调换位置、顺序或内容；「割り当てる」是把任务、资源等分配给某人或某个用途。'],
    examples: [
      example('replace-battery', '時計の電池を新しいものに取り替えた。', '把钟表的电池换成了新的。'),
      example('swap-seats', '二人の席を入れ替えた。', '调换了两个人的座位。'),
      example('assign-tasks', '担当者に作業を一つずつ割り当てる。', '给负责人逐一分配工作。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg', quote: '取り替える\n入れ替える\n割り当てる', translation: '替换；调换；分配。' },
  },
  {
    id: 'live-2026-11-05-concern-and-serious-effort', title: '気にする・本気でやろう・思いやり',
    subtitle: '在意、认真投入与体谅他人', category: 'vocabulary',
    entries: [
      entry('care-about', '気にする', 'きにする', '在意、介意、放在心上'),
      entry('try-seriously', '本気でやろう', 'ほんきでやろう', '认真做吧；我要认真做', '意向形「やろう」可表示说话者的决心，也可邀请对方一起做，要看语境。'),
      entry('consideration', '思いやり', 'おもいやり', '体谅、关怀、替别人着想'),
    ],
    points: ['「気にする」强调主动把某事放在心上；「本気で」表示认真、当真；「思いやり」是考虑对方处境与感受。'],
    examples: [
      example('do-not-worry-about-mistake', '小さな失敗をいつまでも気にしなくていい。', '不用一直把小失误放在心上。'),
      example('serious-practice', '次の発表に向けて、本気で練習しよう。', '为了下次发言，认真练习吧。'),
      example('consideration-for-others', '相手への思いやりを忘れずに話したい。', '我希望说话时始终顾及对方的感受。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: '気にする\n本気でやろう\n思いやり', translation: '在意；认真做吧；体谅。' },
  },
  {
    id: 'live-2026-11-05-scolding-and-excess', title: 'いくらなんでも・がみがみ・怒鳴る',
    subtitle: '表达“再怎么说也过分”与分辨责骂方式', category: 'vocabulary',
    entries: [
      entry('however-you-look-at-it', 'いくらなんでも', 'いくらなんでも', '再怎么说也……、无论如何也太……', '后面常接认为超出合理限度的判断。'),
      entry('nagging-scold', 'がみがみ', 'がみがみ', '絮絮叨叨地责骂、唠叨训斥'),
      entry('shout-angrily', '怒鳴る', 'どなる', '大声呵斥、吼叫'),
    ],
    points: ['「がみがみ言う」突出反复、令人厌烦的训斥；「怒鳴る」突出大声吼叫。说话声大和反复唠叨可以同时发生，也可以分别发生。'],
    examples: [
      example('excessive-demand', 'いくらなんでも、今日中に全部は終わらないよ。', '再怎么说，也不可能今天之内全做完。'),
      example('stop-nagging', 'がみがみ言う前に、理由を聞いてほしい。', '希望你别急着唠叨责骂，先听听理由。'),
      example('do-not-shout', 'そんなに怒鳴らなくても聞こえるよ。', '不用那么大声吼，我也听得见。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'いくらなんでも\nがみがみ\n怒鳴る', translation: '再怎么说也太……；唠叨训斥；大声呵斥。' },
  },
  {
    id: 'live-2026-11-05-no-need-and-needless-to-say', title: '～ことはない・言うまでもない',
    subtitle: '无需做某事与不言自明', category: 'grammar',
    entries: [
      entry('no-need-special-trip', 'わざわざ行くことはない', 'わざわざいくことはない', '没有必要特意去'),
      entry('needless-to-say', '言うまでもない', 'いうまでもない', '不用说、不言而喻'),
    ],
    points: ['「動詞辞書形＋ことはない」在这里表示没有必要做某事；「言うまでもない」表示事情很明显，无需再说。两者表达的“无需”所针对的对象不同。'],
    examples: [
      example('no-need-visit', '電話で確認できるから、わざわざ行くことはない。', '打电话就能确认，没有必要特意去。'),
      example('obvious-preparation', '準備が大切なことは言うまでもない。', '准备的重要性不言而喻。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'わざわざ行くことはない\n言うまでもない', translation: '没有必要特意去；不言而喻。' },
  },
  {
    id: 'live-2026-11-05-not-at-all-and-benefit', title: 'ちっとも・わかってくれない',
    subtitle: '用否定表达“一点也不”与期待对方理解', category: 'grammar',
    entries: [
      entry('not-at-all', 'ちっとも', 'ちっとも', '一点也不……', '通常与否定表达连用，如「ちっともわからない」。'),
      entry('will-not-understand-me', 'わかってくれない', 'わかってくれない', '不肯理解我；没能体谅我的意思', '「くれる」包含说话者期待对方理解自己这一立场，具体对象需要语境补足。'),
    ],
    points: ['「ちっとも」常与「ない」呼应。「わかってくれない」中的「～てくれる」让“理解”带有对说话者或自己一方有益、符合期待的视角。'],
    examples: [
      example('not-understanding-feelings', '何度説明しても、私の気持ちをちっともわかってくれない。', '解释了好多次，对方还是一点也不理解我的心情。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'ちっとも\nわかってくれない', translation: '一点也不……；不理解我。' },
  },
  {
    id: 'live-2026-11-05-reproach-and-consequence', title: '～んだから・～ときたら・すると',
    subtitle: '强调理由、提出抱怨对象与叙述后续结果', category: 'grammar',
    entries: [
      entry('because-you-see', 'んだから', 'んだから', '因为……啊、既然……', '口语的「のだから」，带说明、强调理由的语气。'),
      entry('you-are-so-careless', 'そそっかしいんだから', 'そそっかしいんだから', '你就是这么冒失啊', '省略了后续评价的口语，可带抱怨或亲近的责备语气。'),
      entry('as-for-reproach', 'ときたら', 'ときたら', '说起……、提到……', '常接在名词后提出话题，后面多带不满或责备。'),
      entry('then-as-a-result', 'すると、', 'すると', '于是、接着、那么一来', '连接前后发生的事情，也可引出据前文推得的结果。'),
    ],
    points: ['「んだから」强化作为理由的前项；句尾只留下理由时，听话者需结合语境理解省略的意思。「～ときたら」常引出带情绪的评价；「すると」可推动叙述的发展。'],
    examples: [
      example('reason-for-caution', '明日は早いんだから、そろそろ寝よう。', '明天要早起，差不多该睡了。'),
      example('forgetful-brother', '弟ときたら、また鍵を忘れた。', '说起我弟弟，又把钥匙忘了。'),
      example('knock-and-answer', 'ドアをノックした。すると、中から返事があった。', '我敲了敲门，接着里面传来了回应。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: 'んだから\nそそっかしいんだから\nときたら\nすると、', translation: '因为……啊；就是这么冒失啊；说起……；于是。' },
  },
  {
    id: 'live-2026-11-05-datte-inclusion-and-hearsay', title: '私にだって・子供だって・～んだって',
    subtitle: '“连……也”的强调与传闻句尾', category: 'grammar',
    entries: [
      entry('i-have-ideas-too', '私にだって考えがある', 'わたしにだってかんがえがある', '我也有自己的想法'),
      entry('even-kids-know', '子供だってわかる', 'こどもだってわかる', '连孩子都懂', '原笔记的「＝でも」是在提示这里与「子供でも」相近。'),
      entry('i-want-to-go-too', '私だって行きたいよ', 'わたしだっていきたいよ', '我也想去呀', '原笔记的「＝も」是在提示“我也”的含义，实际语气比单纯「も」更有强调。'),
      entry('sentence-final-ndatte', '～んだって', 'んだって', '听说……；据说……', '原笔记用「語尾」标注句尾用法。疑问升调时，也可用于确认听来的信息。「覚えているんだって」等还可能用于反复强调“都说我记得了”，需结合前文和语调。'),
    ],
    points: ['名词后「だって」可表示“也、连……都”，如「私だって」。句尾「～んだって」则可以转述信息，不能见到「だって」就一律译成“也”。'],
    examples: [
      example('have-own-view', '私にだって考えがあるから、最後まで聞いて。', '我也有自己的想法，请听我说完。'),
      example('heard-moving', '田中さん、来月引っ越すんだって。', '听说田中下个月要搬家。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg', quote: '私にだって考えがある\n子供だってわかる＝でも\n私だって行きたいよ＝も\nんだって 語尾', translation: '我也有想法；连孩子都懂；我也想去呀；句尾「んだって」。', readAloud: false },
  },
  {
    id: 'live-2026-11-05-searching-for-words', title: 'AというかBというか・なんというか',
    subtitle: '边说边寻找更合适的表达', category: 'grammar',
    entries: [
      entry('a-or-b-so-to-speak', 'Aというか、Bというか', 'エーというか、ビーというか', '说是A呢，还是说是B呢', 'A、B是举例用的占位符。说话者在调整措辞，不一定表示两项互斥选择。'),
      entry('a-or-how-to-put-it', 'Aというか、なんというか', 'エーというか、なんというか', '该说是A，还是怎么说呢', '「なんというか」常在难以准确表达时使用。'),
    ],
    points: ['「～というか」可以补充或修正刚说出的表述。这里的字母表示可替换的内容，学习例句展示实际用法。'],
    examples: [
      example('lonely-or-relieved', '寂しいというか、ほっとしたというか、複雑な気持ちだ。', '说是寂寞呢，还是松了一口气呢，心情很复杂。'),
      example('hard-to-describe', '不思議というか、なんというか、初めての感覚だった。', '该说奇妙，还是怎么形容呢，那是第一次有的感觉。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真1.jpg／写真2.jpg', quote: 'Aというか、Bというか\nAというか、なんというか', translation: '说是A还是B；说是A，还是怎么说呢。', readAloud: false },
  },
  {
    id: 'live-2026-11-05-extreme-and-any', title: '私ほど～はいない・どんな～でも',
    subtitle: '强调比较程度与不限范围', category: 'grammar',
    entries: [
      entry('no-one-as-foolish-as-me', '私ほどバカな人はいない', 'わたしほどバカなひとはいない', '没有人像我这么傻', '带有较强的自嘲语气。「バカ」用于评价别人时可能很失礼。'),
      entry('however-awful-a-thing', 'どんなひどいことでも', 'どんなひどいことでも', '无论多么过分的事；任何过分的事', '这是名词性片段，后续动作或判断需要上下文。'),
    ],
    points: ['「私ほど～な人はいない」用否定比较强调程度。「どんな＋名词＋でも」表示不论哪一种；表达“无论多么严重”也可以用「どんなにひどくても」，接续不同。'],
    examples: [
      example('nothing-like-home', '自分の家ほど落ち着く場所はない。', '没有比自己家更让人安心的地方了。'),
      example('never-tell-that-lie', 'どんなひどいことでも、うそをついて隠したくはない。', '不管事情多糟，我也不想撒谎掩盖。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '私ほどバカな人はいない\nどんなひどいことでも', translation: '没有人像我这么傻；无论多么过分的事。' },
  },
  {
    id: 'live-2026-11-05-serious-and-tense', title: '深刻になる・かたくなる・冷や汗をかく',
    subtitle: '事态严重、身体紧绷与冒冷汗', category: 'vocabulary',
    entries: [
      entry('become-serious', '深刻になる', 'しんこくになる', '变得严重；神情变得严肃', '可指问题趋于严重，也可用于人认真忧虑的样子。'),
      entry('become-stiff', 'かたくなる', 'かたくなる', '变硬；变得紧绷、拘谨', '照片用假名。可按语境写「硬くなる」等，紧张时常说「緊張してかたくなる」。'),
      entry('break-into-cold-sweat', '冷や汗をかく', 'ひやあせをかく', '冒冷汗', '常由紧张、惊慌或难堪引起。'),
    ],
    points: ['「深刻になる」与「かたくなる」需看是说事态、表情还是身体状态。「冷や汗をかく」是常见搭配，不用「冷や汗をする」。'],
    examples: [
      example('problem-grows-serious', '対応が遅れて、問題が深刻になった。', '处理迟了，问题变得严重了。'),
      example('tense-at-interview', '面接で緊張してかたくなり、冷や汗をかいた。', '面试时紧张得很拘谨，直冒冷汗。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '深刻になる\nかたくなる\n冷や汗をかく', translation: '变得严重；变得紧绷；冒冷汗。' },
  },
  {
    id: 'live-2026-11-05-suggestions-with-tara', title: '～たらどうだ・～たら？',
    subtitle: '用条件形提出建议', category: 'grammar',
    entries: [
      entry('why-not-run-daily', '毎日走ったらどうだ', 'まいにちはしったらどうだ', '每天跑跑步怎么样', '「どうだ」较直接，语气可能显得强硬，具体取决于关系和语调。'),
      entry('how-about-running-daily', '毎日走ったら？', 'まいにちはしったら？', '每天跑步怎么样？', '省略后半部分的口语建议。'),
    ],
    points: ['动词た形＋「らどうだ／らどうですか」可提出建议。「～たら？」把建议缩短，亲近场合常用；不等于所有场合都更礼貌。'],
    examples: [
      example('suggest-checking-again', '心配なら、もう一度確認したらどうですか。', '如果担心，要不要再确认一次？'),
      example('suggest-taking-break', '少し休んだら？', '休息一下怎么样？'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '毎日走ったらどうだ\n毎日走ったら?', translation: '每天跑步怎么样；每天跑步怎么样？' },
  },
  {
    id: 'live-2026-11-05-sae-minimum-condition', title: '～さえ～ば・～さえしない限り',
    subtitle: '满足最低条件与排除某种情况', category: 'grammar',
    entries: [
      entry('sae-ba-pattern', 'さえ～ば', 'さえ、ば', '只要……就……', '这是接续框架，实际句子需按名词或动词的形式连接。'),
      entry('if-only-eat-vegetables', '野菜さえ食べれば', 'やさいさえたべれば', '只要吃蔬菜的话……', '保留原笔记的条件片段，不把它当作饮食建议。'),
      entry('if-only-replaced', '替わりさえすれば', 'かわりさえすれば', '只要替换、轮换了的话……', '保留照片的「替わり」。若要表达性质或状态“发生变化”，通常写「変わりさえすれば」；具体意思仍需上下文。'),
      entry('unless-refused', '断られさえしない限り', 'ことわられさえしないかぎり', '只要没有遭到拒绝；除非被拒绝', '「断られる」是被动形式，这里突出“被拒绝”这一阻碍条件。'),
    ],
    points: ['「名词＋さえ＋动词ば形」与「动词ます形去ます＋さえすれば」都可提出最低条件。「～さえしない限り」则表示只要不出现那一情况。'],
    examples: [
      example('if-only-time', '時間さえあれば、もう一度説明できます。', '只要有时间，我就能再解释一次。'),
      example('if-only-check', '番号を確認さえすれば、間違いに気づけた。', '只要核对一下编号，本来就能发现错误。'),
      example('unless-turned-down', '相手に断られさえしない限り、相談を続けたい。', '只要对方没有拒绝，我就想继续商量。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'さえ～ば\n野菜さえ食べれば\n替わりさえすれば\n断られさえしない限り', translation: '只要……就……；只要吃蔬菜；只要替换；只要没被拒绝。', readAloud: false },
  },
  {
    id: 'live-2026-11-05-consequence-and-absence', title: '～たことになる・あいにく留守だった',
    subtitle: '说明结果、推定与不巧的情况', category: 'grammar',
    entries: [
      entry('counts-as-finished-eating', '食べ終わったことになる', 'たべおわったことになる', '这样就算吃完了；由此可认为已经吃完', '说明据某种条件作出的结果判断，实际条件未在片段中给出。'),
      entry('unfortunately-not-home', 'あいにく留守だった', 'あいにくるすだった', '不巧当时不在家'),
      entry('my-place-is', 'おれんちは', 'おれんちは', '我家呢……、我家是……', '口语「俺のうちは」的缩略，语气随意，常带男性用语色彩。'),
    ],
    points: ['「～たことになる」可说明按前提推得的结论或形式上认定的结果。「あいにく」表示事情不凑巧，后接不如愿的情况。「おれんち」不宜直接用于正式场合。'],
    examples: [
      example('counts-as-two-visits', '今日も行けば、今週二回行ったことになる。', '今天也去的话，就等于这周去了两次。'),
      example('not-home-when-visited', '訪ねてみたが、あいにく留守だった。', '去拜访了一下，不巧对方不在家。'),
      example('my-home-near-station', 'おれんちは駅の近くだよ。', '我家就在车站附近。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '食べ終わったことになる\nあいにく留守だった\nおれんちは', translation: '这样就算吃完了；不巧不在家；我家呢……' },
  },
  {
    id: 'live-2026-11-05-somehow-and-vaguely', title: 'なんだか・なんとなく',
    subtitle: '说不清缘由的感觉与模糊、随意的状态', category: 'vocabulary',
    entries: [
      entry('somehow-feel', 'なんだか', 'なんだか', '总觉得、莫名地', '常引出难以明确说出原因的感受或判断。'),
      entry('vaguely-without-reason', 'なんとなく', 'なんとなく', '不知为什么、隐约地；无意中、随意地', '除感受外，也可描述没特别理由就做了某事。'),
    ],
    points: ['两者都能表示说不清原因的感觉。「なんとなく」还可修饰动作，如「なんとなくテレビをつける」，表示没有特别目的地做某事。'],
    examples: [
      example('somehow-restless', '今日はなんだか落ち着かない。', '今天总觉得心里不踏实。'),
      example('turn-on-tv-without-reason', 'なんとなくテレビをつけた。', '没什么特别原因，就打开了电视。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'なんだか\nなんとなく', translation: '总觉得；隐约地、没有特别理由地。' },
  },
  {
    id: 'live-2026-11-05-imagine-and-get-in-the-mood', title: '～た気になる・～気にならなきゃならない',
    subtitle: '设想已有某种经历与让自己产生某种意愿', category: 'grammar',
    entries: [
      entry('imagine-having-dated', '付き合っていた気になれ', 'つきあっていたきになれ', '就当作曾经交往过吧；想象自己曾经交往过', '保留原片段。「なれ」是命令形，指进入某种想象中的感觉；「付き合う」也可指陪同或来往；片段没有说明具体关系。'),
      entry('must-get-into-that-mood', '気にならなきゃならない', 'きにならなきゃならない', '得产生那种意愿或感觉', '前面省略了说明“什么意愿／感觉”的成分。「気になる」也可表示在意，具体含义仍需看前文。「ならなきゃならない」是「ならなければならない」的口语形式。'),
    ],
    points: ['「～た気になる」表示主观上觉得自己仿佛已经做过某事，并不证明现实中做过。「その気になる」是产生那种打算、意愿，需与“在意”之意的「気になる」结合语境区分。'],
    examples: [
      example('feel-like-protagonist', '主人公になった気になって、場面を読んでみた。', '我把自己想象成主人公，试着读了那一幕。'),
      example('must-be-willing', 'まずは自分がその気にならなきゃならない。', '首先得让自己有那个意愿。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '付き合っていた気になれ\n気にならなきゃならない', translation: '就当作曾经交往过吧；得产生那种意愿或感觉。' },
  },
  {
    id: 'live-2026-11-05-shelves', title: '戸棚・本棚',
    subtitle: '带柜门的储物柜与书架', category: 'vocabulary',
    entries: [
      entry('cupboard', '戸棚', 'とだな', '橱柜、储物柜', '一般指带门、用来收纳物品的柜子。'),
      entry('bookshelf', '本棚', 'ほんだな', '书架、书柜'),
    ],
    points: ['「戸棚」侧重有柜门的收纳家具；「本棚」按用途命名，指放书的架子或柜子。是否有门不决定它能否叫「本棚」。'],
    examples: [
      example('cups-in-cupboard', '使わないコップは戸棚にしまってある。', '暂时不用的杯子收在橱柜里。'),
      example('return-book-to-shelf', '読み終わった本を本棚に戻した。', '我把读完的书放回了书架。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg／写真3.jpg', quote: '戸棚\n本棚', translation: '橱柜；书架。' },
  },
  {
    id: 'live-2026-11-05-warito-warini', title: '割合・わりと・～わりに',
    subtitle: '比率、相对程度与不符预期的比较', category: 'grammar',
    entries: [
      entry('wariai', '割合', 'わりあい', '比例、比率；也可表示比较、相对地', '名词如「利用者の割合」，副词如「割合安い」。原笔记附有读音「わりあい」。'),
      entry('warito', 'わりと', 'わりと', '比较、相对地', '原笔记用「比較的に」作近义提示。常用说法也有「比較的」；这里的对照不是数学上的比例关系。'),
      entry('low-pay-for-hours', '勤務時間のわりに給料が低い', 'きんむじかんのわりにきゅうりょうがひくい', '和工作时长相比，工资偏低'),
    ],
    points: [
      '「わりと」作为副词表达相对程度，如「わりと静かだ」。名词「割合」则可表示占总数多少的比率。',
      '「～わりに」常把实际情况与根据前项产生的预期作比较，带有不太相称的感觉。名词后用「の」，如「値段のわりに」。',
    ],
    examples: [
      example('relatively-quiet', '駅の近くだが、この通りはわりと静かだ。', '虽然靠近车站，这条街却比较安静。'),
      example('good-for-price', 'この店のランチは、値段のわりに量が多い。', '这家店的午餐以这个价位来说，分量挺足。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '割合 わりあい\nわりと＝比較的に\n勤務時間のわりに給料が低い', translation: '割合（读作わりあい）；比较、相对地；和工作时长相比工资偏低。', readAloud: false },
  },
  {
    id: 'live-2026-11-05-janai-ka', title: 'おいしいじゃないか・あったじゃねえか',
    subtitle: '反问形式中的发现、确认与语气', category: 'grammar',
    entries: [
      entry('tasty-isnt-it', 'おいしいじゃないか', 'おいしいじゃないか', '这不是很好吃吗；挺好吃的嘛', '可用于发现和肯定，也可能是在向对方确认。需结合语境和语调判断。'),
      entry('there-it-was', 'あったじゃねえか', 'あったじゃねえか', '这不就在吗；这不是有吗', '「じゃねえか」是「じゃないか」的粗犷口语形式。照片没有提供具体找到了什么。'),
    ],
    points: ['「じゃないか」在这些片段里可以强化肯定、表达发现，并不一定是否定。「じゃねえか」语气粗，使用对象和场合要留意。'],
    examples: [
      example('tasty-first-bite', '一口食べてみたら、けっこうおいしいじゃないか。', '尝了一口，发现还挺好吃的嘛。'),
      example('key-found', '探していた鍵、ここにあったじゃないか。', '一直在找的钥匙，这不就在这里吗。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'おいしいじゃないか\nあったじゃねえか', translation: '挺好吃的嘛；这不就在吗。' },
  },
  {
    id: 'live-2026-11-05-narenakya', title: '慣れなきゃ・慣れなくちゃ・慣れないと',
    subtitle: '必须习惯的三种口语说法', category: 'grammar',
    entries: [
      entry('must-get-used-nakya', '慣れなきゃならない', 'なれなきゃならない', '必须习惯、必须适应'),
      entry('must-get-used-nakucha', '慣れなくちゃいけない', 'なれなくちゃいけない', '必须习惯、必须适应'),
      entry('must-get-used-naito', '慣れないといけない', 'なれないといけない', '必须习惯、必须适应'),
    ],
    points: [
      '「なきゃ」由「なければ」缩略而来，「なくちゃ」由「なくては」缩略而来。与否定形式的「ならない／いけない」组合，整体表达必要或义务。',
      '「～ないといけない」也是常见说法。随意会话中有时只说「慣れなきゃ」「慣れないと」，由语境补足后半。',
    ],
    examples: [
      example('new-work-routine', '新しい仕事のやり方に、少しずつ慣れなきゃならない。', '我得一点点适应新的工作方式。'),
      example('new-commute', 'この通勤時間に慣れないといけないね。', '得适应这个通勤时间啊。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '慣れなきゃ ならない\n慣れなくちゃ いけない\n慣れないと いけない', translation: '都表示必须习惯、必须适应。' },
  },
  {
    id: 'live-2026-11-05-holiday-topics', title: '休日ともなると・休日と言えば',
    subtitle: '到了某种时候与说起某个话题', category: 'grammar',
    entries: [
      entry('when-holiday-comes', '休日ともなると', 'きゅうじつともなると', '一到休息日、到了休息日就……'),
      entry('speaking-of-holidays', '休日と言えば', 'きゅうじつといえば', '说起休息日……'),
    ],
    points: ['「～ともなると」把到了某种时间、阶段或身份后出现的情形引出来；「～と言えば」则常用于提起、联想到或转换到某个话题。'],
    examples: [
      example('park-on-holidays', '休日ともなると、この公園は家族連れでにぎわう。', '一到休息日，这座公园就会因全家出游的人们而热闹起来。'),
      example('holiday-plans-topic', '休日と言えば、来週は何をする予定ですか。', '说起休息日，你下周准备做什么？'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '休日ともなると\n休日と言えば', translation: '一到休息日；说起休息日。' },
  },
  {
    id: 'live-2026-11-05-hierarchy', title: '上下関係',
    subtitle: '组织或人际关系中的上位与下位', category: 'vocabulary',
    entries: [entry('hierarchical-relationship', '上下関係', 'じょうげかんけい', '上下级关系、辈分或地位上的关系', '也可用于前辈与后辈等关系，具体指什么要看场合。')],
    points: ['「上下関係」谈的是组织地位、资历或辈分等关系。不能仅凭这一个词判断某个具体组织的人际氛围。'],
    examples: [example('hierarchy-and-opinions', '上下関係にかかわらず、意見を出し合える職場にしたい。', '我希望营造一个无论上下级都能互相提出意见的职场。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '上下関係', translation: '上下级关系等。' },
  },
  {
    id: 'live-2026-11-05-beki-past', title: 'やるべきだ・やるべきだった・やるべきではなかった',
    subtitle: '应该做、当时本该做与当时不该做', category: 'grammar',
    entries: [
      entry('should-do', 'やるべきだ', 'やるべきだ', '应该做'),
      entry('should-have-done', 'やるべきだった', 'やるべきだった', '当时应该做、当时本该做'),
      entry('should-not-have-done', 'やるべきではなかった', 'やるべきではなかった', '当时不应该做'),
    ],
    points: [
      '「べきだ」表达按照道理、责任等判断应该采取的行动，语气较强。「べきだった」回顾过去，常带有对没有做的遗憾或批评。',
      '「べきではなかった」否定的是“当时应该做”这一判断，常表示做了之后觉得不该做；具体是否实施仍需结合上下文。',
    ],
    examples: [
      example('check-before-sending', '送信する前に、もう一度確認するべきだった。', '发送之前，我本该再检查一次。'),
      example('should-not-have-said', 'あんなことを言うべきではなかった。', '我当时不该说那种话。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'やるべきだ\nやるべきだった\nやるべきではなかった', translation: '应该做；当时本该做；当时不应该做。' },
  },
  {
    id: 'live-2026-11-05-feelings-and-wishes', title: '好きになる・嫌いになる・考えてほしい',
    subtitle: '感情的变化与对他人的希望', category: 'grammar',
    entries: [
      entry('come-to-like-someone', 'Aさんを好きになる', 'エーさんをすきになる', '喜欢上A某人', '这里的A是人物代称。「人を好きになる」是常用表达，与陈述当前感情的「私はAさんが好きだ」一起对照记忆。'),
      entry('come-to-dislike-someone', 'Aさんを嫌いになる', 'エーさんをきらいになる', '变得讨厌A某人', '「人を嫌いになる」表示感情发生变化。'),
      entry('want-careful-thought', 'よく考えてほしい', 'よくかんがえてほしい', '希望对方认真想一想'),
    ],
    points: [
      '「～を好きになる／嫌いになる」中，「を」标出感情指向的对象，整个表达表示感情发生变化。这不等于所有带「なる」的句子都能用「を」。',
      '「動詞て形＋ほしい」表达说话者希望别人做某事，如「考えてほしい」。对谁提出希望以及礼貌程度，要结合双方关系判断。',
    ],
    examples: [
      example('grow-to-like-colleague', '一緒に働くうちに、彼を好きになった。', '在一起工作的过程中，我渐渐喜欢上了他。'),
      example('consider-before-deciding', '決める前に、自分が本当にやりたいことをよく考えてほしい。', '希望你在作决定之前，好好想想自己真正想做什么。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'Aさんを好きになる\nAさんを嫌いになる\nよく考えてほしい', translation: '喜欢上某人；变得讨厌某人；希望对方认真思考。', readAloud: false },
  },
  {
    id: 'live-2026-11-05-datte-damon', title: 'だって～だもん',
    subtitle: '用口语解释原因、表达不满或辩解', category: 'grammar',
    entries: [entry('because-damon', 'だって～だもん', 'だって、だもん', '因为……嘛', '这是笔记里的句型框架。完整句中，「だって」引出理由，「だもん」等句尾常带解释、撒娇或辩解的语气。')],
    points: [
      '句首「だって」可引出理由；句尾「～だもん／～んだもん」是很随意、带感情色彩的表达，正式场合通常用「～からです」等。',
      '这里的「だって」与名词后的「子供だってわかる」用法不同，后者表示连孩子都包括在内。',
    ],
    examples: [example('because-still-child', 'だって、まだ子供だもん。', '因为我还是个孩子嘛。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'だって～だもん', translation: '因为……嘛，口语句型框架。', readAloud: false },
  },
  {
    id: 'live-2026-11-05-occasional-boredom', title: 'たまには・退屈しのぎ',
    subtitle: '偶尔换换方式与排遣无聊', category: 'vocabulary',
    entries: [
      entry('once-in-a-while', 'たまには', 'たまには', '偶尔也……；有时候也……', '「は」可带出“偶尔换个方式也好”等对比语气。'),
      entry('relieve-boredom', '退屈しのぎ', 'たいくつしのぎ', '解闷、排遣无聊'),
    ],
    points: ['「たまには」谈频率或对比；「退屈しのぎ」谈做某事的目的。二者可以同句出现，但含义不同。'],
    examples: [
      example('walk-once-in-while', 'たまには遠回りして帰ろう。', '偶尔也绕条远路回家吧。'),
      example('puzzle-while-waiting', '待ち時間の退屈しのぎに、パズルを解いた。', '为了打发等候时的无聊，我做了道谜题。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'たまには\n退屈しのぎ', translation: '偶尔也；解闷。' },
  },
]
