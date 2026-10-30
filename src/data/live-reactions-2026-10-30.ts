import type { LiveReactionEntry, LiveReactionExample } from './live-reactions.ts'
import type { LiveUnitGroup } from './live-reaction-units.ts'

// The October 30 heading applies to the continuous notes in photos 2–5.
// The four repeated phrases outside that heading have their own undated source label.
// Semantic IDs are independent of display order and of the audio utterance text.
const entry = (id: string, expression: string, reading: string, meaning: string, note?: string): LiveReactionEntry => ({
  id: `live-2026-10-30-entry-${id}`, expression, reading, meaning, ...(note ? { note } : {}),
})
const example = (id: string, japanese: string, chinese: string): LiveReactionExample => ({
  id: `live-2026-10-30-example-${id}`, japanese, chinese,
})

export const liveOctober30Groups: LiveUnitGroup[] = [
  {
    id: 'live-2026-10-30-extract', title: '抜き出す・抜け出す：取出一部分，还是离开原处',
    subtitle: '他动词「抜き出す」与自动词「抜け出す」', category: 'transitivity',
    entries: [
      entry('extract-part', '一部を抜き出す', 'いちぶをぬきだす', '摘出、抽取其中一部分'),
      entry('leave-class', '授業を抜け出す', 'じゅぎょうをぬけだす', '从课堂中溜出去、临时离开课堂'),
    ],
    points: [
      '「抜き出す」把内容或物品从整体中选出、取出，常用「文章から必要な部分を抜き出す」。',
      '「抜け出す」表示本人离开某处或摆脱状态。「授業を抜け出す」的「を」标记离开的场所、活动，不因为有「を」就判成他动词。',
    ],
    examples: [
      example('extract-text', '長い文章から一部を抜き出して、資料に使った。', '从长文章中摘出一部分，作为资料使用。'),
      example('leave-class-call', '急な電話が入り、授業を抜け出した。', '突然接到电话，我临时离开了课堂。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '一部を抜き出す\n授業を抜け出す', translation: '取出一部分；从课堂中溜出去。' },
  },
  {
    id: 'live-2026-10-30-appearance', title: 'きれいになる・宝石みたいに綺麗だ',
    subtitle: '变化的结果与比喻的方式', category: 'grammar',
    entries: [
      entry('become-beautiful', 'きれいになる', 'きれいになる', '变漂亮、变干净'),
      entry('beautiful-like-jewel', '宝石みたいに綺麗だ', 'ほうせきみたいにきれいだ', '像宝石一样漂亮'),
    ],
    points: [
      '「きれい」是な形容词，接「なる」用「きれいに」。根据对象可表示漂亮或干净，不能只记一种中文意思。',
      '口语「名词＋みたいに」修饰后面的动作、状态，如「宝石みたいに輝く」；修饰名词时通常用「みたいな」。',
    ],
    examples: [
      example('clean-room', '片づけたら、部屋がきれいになった。', '整理以后，房间变干净了。'),
      example('jewel-sea', '朝の海は宝石みたいに綺麗だ。', '清晨的大海像宝石一样漂亮。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'きれいになる\n宝石みたいに綺麗だ', translation: '变漂亮、变干净；像宝石一样漂亮。' },
  },
  {
    id: 'live-2026-10-30-chew', title: 'ガムを噛む：嚼口香糖',
    subtitle: '「噛む」既能表示咀嚼，也能表示咬', category: 'vocabulary',
    entries: [entry('chew-gum', 'ガムを噛む', 'ガムをかむ', '嚼口香糖')],
    points: ['「ガム」在这个搭配中是口香糖，「噛む」读「かむ」。它既能表示咀嚼，也能表示动物咬人；“被咬”通常说「噛まれる」，要区分动作方向。'],
    examples: [example('gum-before-class', '授業が始まる前に、噛んでいたガムを捨てた。', '上课前，我把正在嚼的口香糖扔掉了。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'ガムを噛む', translation: '嚼口香糖。' },
  },
  {
    id: 'live-2026-10-30-benefactive-causative', title: '買ってあげる・買わせてあげる：谁做动作',
    subtitle: '授受表达与使役＋授受表达', category: 'grammar',
    entries: [
      entry('allow-trip', '出張させてあげる', 'しゅっちょうさせてあげる', '让对方出差，并把这件事视为给予对方的机会或好处', '是否真是恩惠由情境决定；对方不想出差时，这样说可能显得自作主张。'),
      entry('buy-for-someone', '買ってあげる', 'かってあげる', '为对方买、买给对方'),
      entry('let-someone-buy', '買わせてあげる', 'かわせてあげる', '让对方买、允许对方购买', '购买的人是受到允许的一方，不是“我替对方买”。'),
    ],
    points: [
      '「私が弟に本を買ってあげる」是我买给弟弟；「弟に好きな本を買わせてあげる」是允许弟弟自己购买。',
      '使役「～させる」可以表示让、使或允许；加「～てあげる」表示说话人把行动看作给予对方的好处，不能一律译成“帮助”。',
      '「～てあげる」直接对上司、顾客等使用可能显得居高临下或强调施恩。要结合关系、意愿与场景选择表达。',
    ],
    examples: [
      example('buy-sister-book', '妹の誕生日に、本を買ってあげた。', '妹妹生日时，我给她买了一本书。'),
      example('choose-own-book', '子どもに、自分の小遣いで好きな本を買わせてあげた。', '我允许孩子用自己的零花钱买喜欢的书。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '出張させてあげる\n買ってあげる\n買わせてあげる', translation: '让对方出差；买给对方；让对方购买。授受语气都取决于情境。' },
  },
  {
    id: 'live-2026-10-30-show', title: 'みんなに見せる：给大家看',
    subtitle: '「見る」与词汇动词「見せる」', category: 'transitivity',
    entries: [entry('show-everyone', 'みんなに見せる', 'みんなにみせる', '给大家看、展示给大家')],
    points: [
      '常用「人に、物を見せる」：用「に」标记看的人，用「を」标记展示的东西。',
      '「見せる」是表示展示、让人看的词汇动词。不要把它写成「見る」的普通使役活用；「見る」的使役形是「見させる」。',
    ],
    examples: [example('show-photo', '旅行で撮った写真をみんなに見せた。', '我把旅行时拍的照片给大家看了。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'みんなに見せる', translation: '给大家看。' },
  },
  {
    id: 'live-2026-10-30-prohibition', title: 'いじめちゃいけない・いじめちゃだめだよ',
    subtitle: '「～ては」的口语缩约「～ちゃ」', category: 'grammar',
    entries: [
      entry('do-not-bully', 'いじめちゃいけない', 'いじめちゃいけない', '不能欺负人'),
      entry('do-not-bully-gently', 'いじめちゃだめだよ', 'いじめちゃだめだよ', '不可以欺负人哦'),
    ],
    points: [
      '「いじめちゃ」对应「いじめては」。「～てはいけない／～てはだめだ」都表示禁止，不是“必须去做”。',
      '「～ちゃ」适合口语，正式书面语通常恢复成「～ては」；以「で」结尾的て形常缩成「～じゃ」，如「飲んじゃいけない」。',
    ],
    examples: [example('bullying-warning', '友達をいじめちゃだめだよ。', '不可以欺负朋友哦。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'いじめちゃいけない\nいじめちゃだめだよ', translation: '不能欺负人；不可以欺负人哦。' },
  },
  {
    id: 'live-2026-10-30-obligation', title: '行かなくちゃ・いじめなくちゃ：不要把义务读成禁止',
    subtitle: '「～なくてはならない／いけない」的口语省略', category: 'grammar',
    entries: [
      entry('must-go-soon', 'そろそろ行かなくちゃ', 'そろそろいかなくちゃ', '差不多该走了、我得走了'),
      entry('must-bully-shorthand', 'いじめなくちゃ', 'いじめなくちゃ', '（字面）必须欺负、得欺负才行', '仅辨认原笔记的活用。这个省略本身不是禁止，不把欺负他人当作应采取的行为。'),
    ],
    points: [
      '「行かなくちゃ」由「行かなくては」缩约，后面常省略「ならない／いけない」，表示必须去。「そろそろ」提示适当时机将到。',
      '「いじめなくちゃ」在这种省略用法下等于「いじめなければならない」，与上一组「いじめちゃいけない」方向相反。表达禁止应使用上一组的形式。',
      '单独摘出的片段可能缺少后文。这里说明常见口语省略的字面义，不为原场景推断人物意图。',
    ],
    examples: [example('must-catch-train', '電車の時間だから、そろそろ行かなくちゃ。', '快到电车发车时间了，我差不多得走了。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'そろそろ行かなくちゃ\nいじめなくちゃ', translation: '差不多该走了；后一句按常见口语省略字面为“必须欺负”，仅作形式辨认。' },
  },
  {
    id: 'live-2026-10-30-sekkaku-wazawaza', title: 'せっかく・わざわざ：难得的机会与特意的付出',
    subtitle: '两者都可能与「のに」相连，但着眼点不同', category: 'vocabulary',
    entries: [
      entry('sekkaku', 'せっかく', 'せっかく', '好不容易、难得；特意付出心力', '原笔记旁注“難得”，要结合机会、努力与后文理解。'),
      entry('made-specially', 'わざわざ作ってあげたのに', 'わざわざつくってあげたのに', '明明特意给对方做了，却……', '「のに」后文省略；「てあげた」加上遗憾语气，有时会显得在强调施恩。'),
    ],
    points: [
      '「せっかく」重视来之不易、值得珍惜的机会或努力，如「せっかく来たのだから」。不只是固定对应中文“难得”。',
      '「わざわざ」突出特意花时间、费周折去做某事，可以表达感谢，也可能在语境中带埋怨或讽刺。',
      '「せっかく～のに」常表达付出或机会没有得到预想结果的遗憾。句末「のに」可能省略了不如预期的结果，不把省略内容补造成原场景的事实。',
    ],
    examples: [
      example('rare-chance', 'せっかく日本に来たのだから、地域の料理も食べてみたい。', '难得来日本，我也想尝尝当地料理。'),
      example('thanks-special-visit', 'わざわざ届けてくれて、ありがとう。', '谢谢你特意送过来。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'せっかく 難得\nわざわざ作ってあげたのに', translation: '原笔记：せっかく旁注“难得”；明明特意给对方做了，却……', readAloud: false },
  },
  {
    id: 'live-2026-10-30-corners', title: '庭の隅・隅から隅まで',
    subtitle: '角落、移栽与“各个角落”', category: 'vocabulary',
    entries: [
      entry('replant-corner', '庭の隅に植え替える', 'にわのすみにうえかえる', '移栽到院子的角落里'),
      entry('every-corner', '隅から隅まで', 'すみからすみまで', '从这个角落到那个角落；各个角落、彻底地'),
    ],
    points: [
      '「隅」读「すみ」，表示角落。「庭の隅に」用「に」标记移栽后的目的位置。',
      '「植え替える」是把植物移到别处重新栽种、换盆等；「隅から隅まで」也可比喻仔细、全面地查看。',
    ],
    examples: [
      example('replant-flower', '大きくなった花を庭の隅に植え替えた。', '我把长大的花移栽到了院子角落。'),
      example('clean-every-corner', '部屋を隅から隅まで掃除した。', '把房间的各个角落都打扫了一遍。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '庭の隅に植え替える\n隅から隅まで', translation: '移栽到院子角落；各个角落、从头到尾。' },
  },
  {
    id: 'live-2026-10-30-soft-suggestion', title: 'コーヒーでもどう：要不要来杯咖啡',
    subtitle: '举例、提出轻松建议的「でも」', category: 'grammar',
    entries: [entry('coffee-suggestion', 'コーヒーでもどう', 'コーヒーでもどう', '喝杯咖啡之类的怎么样？')],
    points: [
      '这里的「名词＋でも」举出一个选择，使建议显得随意、柔和，不是转折连词“但是”，也不是“连咖啡都”。',
      '「どう」是简略邀请，礼貌说法可用「コーヒーでもいかがですか」。',
    ],
    examples: [example('coffee-break', '少し休んで、コーヒーでもどう？', '休息一下，喝杯咖啡怎么样？')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: 'コーヒーでもどう', translation: '要不要来杯咖啡之类的？' },
  },
  {
    id: 'live-2026-10-30-sunshine', title: '日当たりのいい部屋：采光好的房间',
    subtitle: '「日当たり」表示阳光照射的情况', category: 'vocabulary',
    entries: [entry('sunny-room', '日当たりのいい部屋', 'ひあたりのいいへや', '向阳、采光好的房间')],
    points: [
      '「日当たり」读「ひあたり」，常用「日当たりがいい／悪い」。这里是阳光，不是“每天”的意思。',
      '修饰名词的结构中可见「日当たりのいい部屋」；相应的独立句是「この部屋は日当たりがいい」。',
    ],
    examples: [example('choose-sunny-room', '植物を育てたいので、日当たりのいい部屋を選んだ。', '因为想养植物，我选了采光好的房间。')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg', quote: '日当たりのいい部屋', translation: '采光好的房间。' },
  },
  {
    id: 'live-2026-10-30-decide-suru', title: 'ご飯にする・お風呂にする：选择先做什么',
    subtitle: '「名词＋にする」表示决定、选择', category: 'grammar',
    entries: [
      entry('choose-meal', 'ご飯にする', 'ごはんにする', '决定吃饭、开始吃饭'),
      entry('choose-bath', 'お風呂にする', 'おふろにする', '决定洗澡、先洗澡'),
    ],
    points: [
      '结合情境表示选择一种活动或安排，不是把某样东西真的变成饭或浴缸。',
      '询问两个备选活动可以说「先にご飯にする？ それともお風呂にする？」；「ご飯」在这里常指一顿饭，不限于白米饭。',
    ],
    examples: [example('meal-or-bath', '先にご飯にする？ それともお風呂にする？', '先吃饭？还是先洗澡？')],
    source: { kind: 'note', label: '手机笔记 · 写真2.jpg／写真3.jpg重叠部分', quote: 'ご飯にする\nお風呂にする', translation: '决定吃饭；决定洗澡。' },
  },
  {
    id: 'live-2026-10-30-alternatives', title: 'それとも・または・もしくは・あるいは',
    subtitle: '都能关联选择，但语域、句式与用法不同', category: 'grammar',
    entries: [
      entry('soretomo', 'それとも', 'それとも', '还是……？', '常用于选择疑问句，接着提出另一个备选。'),
      entry('matawa', 'または', 'または', '或者、或', '常见于说明、书面表达与选项并列。'),
      entry('moshikuwa', 'もしくは', 'もしくは', '或者、或是', '较郑重，常见于规定、条件或正式说明。'),
      entry('aruiwa', 'あるいは', 'あるいは', '或者；也许', '除了列举选择，还可以表示不确定的推测。'),
      entry('a-or-b', 'AかB', 'エーかビー', 'A或者B、A还是B'),
    ],
    points: [
      '「お茶にしますか。それともコーヒーにしますか」是在问两种选择；「または」「もしくは」常直接并列词语或条件。不能只凭中文“或者”随意互换。',
      '「あるいは」还能表示“也许”，如「あるいは間に合うかもしれない」。本组以选择表达为主，不把所有用法归为同义。',
      '「AかB」中的「か」连接两个备选；整句话是否是疑问，要看句末与上下文。',
    ],
    examples: [
      example('tea-or-coffee', 'お茶にしますか。それともコーヒーにしますか。', '您选茶，还是选咖啡？'),
      example('submit-format', '申込書は郵送、または窓口で提出してください。', '申请表请通过邮寄或到窗口提交。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'それとも、 还是\nまたは\nもしくは\nあるいは\nAかB', translation: '原笔记给それとも旁注“还是”；其余为选择表达。', readAloud: false },
  },
  {
    id: 'live-2026-10-30-whether', title: '来るかどうかわからない：不知是否会来',
    subtitle: '把“是否……”嵌入句中的「かどうか」', category: 'grammar',
    entries: [entry('whether-coming', '来るかどうかわからない', 'くるかどうかわからない', '不知道是否会来')],
    points: [
      '「普通形＋かどうか」表示是否，后面可接「分からない／確認する／迷っている」等。名词、な形容词的现在肯定形通常不加「だ」，如「学生かどうか」「静かかどうか」。',
      '与前组「AかB」相比，这里围绕同一命题的肯定与否定：会来还是不会来。',
    ],
    examples: [example('check-coming', '彼が明日来るかどうか、まだわからない。', '还不知道他明天会不会来。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '来るかどうかわからない', translation: '不知道是否会来。' },
  },
  {
    id: 'live-2026-10-30-give-feed', title: '水をやる・エサをやる：浇水与喂食',
    subtitle: '用于植物、动物的授受表达', category: 'vocabulary',
    entries: [
      entry('give-water', '水をやる', 'みずをやる', '给植物浇水；给动物水喝', '具体对象由上下文确定。'),
      entry('give-feed', 'エサをやる', 'エサをやる', '给动物喂食、投喂饲料'),
    ],
    points: [
      '植物和动物作接受方时，常用「花に水をやる」「犬にエサをやる」。',
      '当代日语中「水をあげる」「エサをあげる」也很常见，不能一概判错。对人使用「やる」须注意关系与语气。',
    ],
    examples: [
      example('water-flowers', '朝、庭の花に水をやる。', '早上给院子里的花浇水。'),
      example('feed-dog', '犬にエサをやってから、出かけた。', '给狗喂食以后，我出门了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '水をやる\nエサをやる', translation: '浇水、给水；喂食。' },
  },
  {
    id: 'live-2026-10-30-forced-feed', title: '食わされた：被迫吃了',
    subtitle: '「食う」的口语使役受身缩约', category: 'grammar',
    entries: [entry('forced-dog-food', 'ドッグフードを食わされた', 'ドッグフードをくわされた', '被迫吃了狗粮', '指原句字面上的狗食；没有足够情境判断人物，不采用中文网络“吃狗粮”的恋爱隐喻。')],
    points: [
      '「食う→食わせる→食わせられる／食わされる」，「食わされた」表示受到他人使役而吃了，常带被迫、不情愿的感觉。',
      '「食う」比「食べる」粗率、随意，较中性的对应形式是「食べさせられた」。不是“被狗粮吃掉”。',
    ],
    examples: [example('forced-spicy-food', '辛い料理が苦手なのに、無理に食べさせられた。', '明明不擅长吃辣，却被硬逼着吃了辣菜。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'ドッグフードを食わされた', translation: '被迫吃了狗粮。原图未提供完整的主语与场景。' },
  },
  {
    id: 'live-2026-10-30-konoaida', title: 'この間：前几天、上次',
    subtitle: '笔记「この間＝最近」是近似提示', category: 'vocabulary',
    entries: [entry('konoaida', 'この間', 'このあいだ', '前些天、上次；（依语境）这段时间')],
    points: [
      '会话中的「この間」常指不久前某一次发生的事情，可译成“前几天、上次”；「最近」常着眼于近来的一段时间或状况。',
      '原笔记用「最近」帮助理解时间接近，不表示两者在所有句子中完全同义。「この間」还可有期间用法，要结合上下文。',
    ],
    examples: [
      example('other-day-met', 'この間、駅で先生に会った。', '前几天在车站遇见了老师。'),
      example('recently-busy', '最近、仕事が忙しい。', '最近工作很忙。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'この間＝最近', translation: '原笔记将この間近似说明为最近；具体用法并非完全相同。', readAloud: false },
  },
  {
    id: 'live-2026-10-30-dryness', title: 'のどがかわく・カラカラ・かさかさ',
    subtitle: '口渴、干透与皮肤干燥粗糙', category: 'vocabulary',
    entries: [
      entry('thirsty', 'のどがかわく', 'のどがかわく', '口渴、嗓子发干', '通常写作「喉が渇く」；保留截图的假名形式。'),
      entry('throat-parched', 'のどがカラカラ', 'のどがカラカラ', '嗓子干得厉害、渴得嗓子冒烟'),
      entry('skin-dry', '皮膚がかさかさ', 'ひふがかさかさ', '皮肤干燥、粗糙'),
    ],
    points: [
      '「喉が渇く」说口渴；「カラカラ」可形容干透，在这里加强嗓子干的程度。',
      '「かさかさ」常形容皮肤等失去水分后干燥粗糙，也可能描述干燥物摩擦的声音；不能在所有对象上替换「カラカラ」。',
    ],
    examples: [
      example('thirst-after-run', '走った後で、のどがカラカラだ。', '跑完步后，嗓子干得厉害。'),
      example('dry-winter-skin', '冬になると、皮膚がかさかさする。', '一到冬天，皮肤就干燥粗糙。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'のどがかわく\nのどがカラカラ\n皮膚がかさかさ', translation: '口渴；嗓子干得厉害；皮肤干燥粗糙。' },
  },
  {
    id: 'live-2026-10-30-touch-panel', title: 'タッチパネル：触摸屏、触控面板',
    subtitle: '日常设备操作里的外来语', category: 'vocabulary',
    entries: [entry('touch-panel', 'タッチパネル', 'タッチパネル', '触摸屏、触控面板')],
    points: ['用手指等触摸来输入、操作的面板，常用搭配是「タッチパネルを操作する」「画面に触れる」。'],
    examples: [example('operate-touch-panel', 'タッチパネルで、飲み物の種類を選んでください。', '请在触摸屏上选择饮料种类。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'タッチパネル', translation: '触摸屏、触控面板。' },
  },
  {
    id: 'live-2026-10-30-hottoku', title: 'ほっとく：先放着、不管',
    subtitle: '「放っておく」的口语形式', category: 'vocabulary',
    entries: [entry('leave-alone', 'ほっとく', 'ほっとく', '放着不管、不干预；先搁置')],
    points: [
      '对应「放っておく（ほうっておく）」；对象既可能是事情，也可能是暂时不打扰的人。与松口气的「ほっとする」区分。',
      '「ほっといて」有时是“别管我、让我一个人待会儿”，语气取决于场景。正式书面表达通常恢复完整形式。',
    ],
    examples: [example('do-not-ignore-problem', '小さな問題でも、ほっとくと大きくなることがある。', '即使是小问题，放着不管也可能变严重。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'ほっとく', translation: '放着不管、不干预。' },
  },
  {
    id: 'live-2026-10-30-wake', title: 'わけがない・わけではない・わけにはいかない',
    subtitle: '不可能、并非与受情况约束而不能', category: 'grammar',
    entries: [
      entry('wakeganai', 'わけがない', 'わけがない', '不可能……、怎么会……', '基于理由或常识作出强烈否定判断，不是单纯表示能力不足。'),
      entry('wakedewanai', 'わけではない', 'わけではない', '并不是……、并非……', '否定所说的判断、解释或概括；不一定能机械译为“并非全都”。'),
      entry('wakeniwaikanai', 'わけにはいかない', 'わけにはいかない', '由于责任、情理、立场等不能……'),
    ],
    points: [
      '「知っているわけがない」判断“不可能知道”；「知っているわけではない」否定“知道”的说法，二者强度和逻辑不同。',
      '「休むわけにはいかない」通常不是身体做不到休息，而是考虑到责任、约定或状况不能休息。',
      '「～ないわけにはいかない」双重否定常表示“不能不……、必须……”，与「～わけがない」的否定判断区分。',
    ],
    examples: [
      example('wake-impossible', '今知ったばかりだから、昨日知っていたわけがない。', '因为刚刚才知道，不可能昨天就知道了。'),
      example('wake-not-dislike', '嫌いなわけではないが、今日は食べたくない。', '并不是讨厌，只是今天不想吃。'),
      example('wake-cannot-rest', '大切な約束があるので、休むわけにはいかない。', '因为有重要约定，不能休息。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: 'わけがない\nわけではない\nわけにはいかない', translation: '不可能；并非；由于责任、情理或立场而不能。' },
  },
  {
    id: 'live-2026-10-30-hearing', title: '私には聞こえない：我这里听不见',
    subtitle: '「には」标出感知者，并可能带对照', category: 'grammar',
    entries: [entry('cannot-hear', '私には聞こえない', 'わたしにはきこえない', '我听不见、在我听来没有声音')],
    points: [
      '「聞こえる」说声音自然传入耳中。「私には」标明对我而言，常与别人的感知情况形成对照。',
      '这句话本身没有完整指定听不见的对象，也不等于“不愿听”。能否主动听取、得到许可等场景还可能用「聞ける」。',
    ],
    examples: [example('cannot-hear-small-sound', 'みんなには聞こえるそうだが、私には聞こえない。', '听说大家都听得到，但我听不见。')],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg', quote: '私には聞こえない', translation: '我听不见。' },
  },
  {
    id: 'live-2026-10-30-voluntary', title: '自分から・進んで・好き好んで',
    subtitle: '主动发起、积极自愿与出于个人喜好', category: 'vocabulary',
    entries: [
      entry('on-own-initiative', '自分から', 'じぶんから', '自己主动地、由自己先发起'),
      entry('willingly', '進んで', 'すすんで', '积极主动地、乐意地'),
      entry('by-preference', '好き好んで', 'すきこのんで', '特意出于个人喜好、自愿地', '常出现在否定或反问中，强调并不是因为喜欢才做；不是“喜欢”的万能同义词。'),
    ],
    points: [
      '「自分から話しかける」强调由自己发起；「進んで手伝う」强调积极、乐意，不只是没有被强迫。',
      '「好き好んで苦労するわけではない」常否认行为出于个人喜好。三个表达不能简单画等号。',
    ],
    examples: [
      example('start-conversation', '彼は自分から先生に質問した。', '他主动向老师提了问题。'),
      example('help-willingly', '困っている人がいたので、進んで手伝った。', '因为有人遇到困难，我主动上前帮忙。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真3.jpg／写真4.jpg重叠部分', quote: '自分から\n進んで\n好き好んで', translation: '由自己主动发起；积极自愿；特意出于个人喜好。' },
  },
  {
    id: 'live-2026-10-30-water-plants', title: '水まきをする：洒水、浇洒',
    subtitle: '也写作「水撒きをする」', category: 'vocabulary',
    entries: [entry('sprinkle-water', '水まきをする', 'みずまきをする', '洒水、浇水', '比「植物に水をやる」更着眼于把水洒在一片范围内；用途由场景确定。')],
    points: ['「水まき」是名词，加「する」表示进行洒水。常用于庭院、路面等，也可为花草浇洒水。'],
    examples: [example('water-garden', '夕方、庭で水まきをした。', '傍晚在院子里洒了水。')],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg', quote: '水まきをする', translation: '洒水、浇洒。' },
  },
  {
    id: 'live-2026-10-30-laziness-thought', title: '怠ける・怠け者・深く考える',
    subtitle: '动词、表示人的名词与思考搭配', category: 'vocabulary',
    entries: [
      entry('be-lazy', '怠ける', 'なまける', '偷懒、懈怠'),
      entry('lazy-person', '怠け者', 'なまけもの', '懒人、懒惰的人', '评价人的词，直接称呼别人可能带批评或冒犯。'),
      entry('think-deeply', '深く考える', 'ふかくかんがえる', '深入思考、认真考虑'),
    ],
    points: [
      '「怠ける」是动词，「怠け者」是指人的名词；不要把词尾的「者」忽略后仍按动词使用。',
      'い形容词「深い」修饰动词时变成「深く」；「深く考える」不是把思考地点说成“很深的地方”。',
    ],
    examples: [
      example('do-not-be-lazy', '怠けずに、毎日の練習を続けよう。', '不要偷懒，坚持每天练习吧。'),
      example('think-before-answer', 'すぐに答えず、少し深く考えてみた。', '我没有马上作答，而是试着深入想了一下。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg', quote: '怠ける\n怠け者\n深く考える', translation: '偷懒；懒人；深入思考。' },
  },
  {
    id: 'live-2026-10-30-frequency', title: 'めったにしない・たまには・ときどき・常に',
    subtitle: '频率表达与「は」带来的对照', category: 'vocabulary',
    entries: [
      entry('rarely-do', 'めったにしない', 'めったにしない', '很少做、难得做一次'),
      entry('once-in-while', 'たまには', 'たまには', '偶尔也……、难得一次……'),
      entry('sometimes', 'ときどき', 'ときどき', '有时、时不时、偶尔'),
      entry('constantly', '常に', 'つねに', '始终、时刻、总是'),
      entry('habitually', 'いつも', 'いつも', '总是、经常；平时、一贯'),
    ],
    points: [
      '「めったに」通常与否定相呼应，如「めったに行かない」；原笔记的「めったにしない」已包含否定，不能漏译。',
      '「たまには」的「は」常带对照或建议：平时未必如此，但偶尔也可以这样做。与中性的「たまに」不完全相同。',
      '原笔记用「常に＝いつも」作近义提示。「常に」较书面、强调持续与一贯；「いつも」也可说惯常状态。频率词没有固定百分比，不规定跨情境的绝对大小。',
    ],
    examples: [
      example('rarely-eat-out', '外食はめったにしないが、たまには店で食べたい。', '我很少在外面吃饭，但偶尔也想去店里吃。'),
      example('always-safe', '作業中は常に安全を確認してください。', '作业中请时刻确认安全。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg', quote: 'めったにしない\nたまには\nときどき\n常に＝いつも', translation: '很少做；偶尔也；有时；原笔记把常に近似说明为いつも。', readAloud: false },
  },
  {
    id: 'live-2026-10-30-revisit', title: '二度と行くもんか・また来ます・また、',
    subtitle: '强烈拒绝、再次与补充连接', category: 'grammar',
    entries: [
      entry('never-go-again', '二度と行くもんか', 'にどといくもんか', '再也不去了、谁还会再去！', '强烈的口语反问，语气激烈；不是普通询问。'),
      entry('come-again', 'また来ます', 'またきます', '我还会再来、我会再来的'),
      entry('in-addition', 'また、', 'また', '另外、此外；（依语境）又、再次', '原笔记保留逗号，提示可能是在说明连接用法。'),
    ],
    points: [
      '「～ものか／～もんか」以反问表达强烈否定、拒绝；「二度と行くもんか」含“绝不再去”的态度。',
      '「また来ます」的「また」是再次；句子或段落开头的「また、」还能补充另一个事项，不能看到相同词形就只译成再次。',
    ],
    examples: [
      example('never-again-complaint', 'あんな失礼な店には、二度と行くもんか。', '那种没礼貌的店，我绝不会再去了。'),
      example('come-next-week', 'ありがとうございました。また来ます。', '谢谢，我还会再来的。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg／写真5.jpg重叠部分', quote: '二度と行くもんか\nまた来ます\nまた、', translation: '绝不再去了；我还会再来；另外、此外。' },
  },
  {
    id: 'live-2026-10-30-winter', title: '冬に備える：为冬天作准备',
    subtitle: '「に」标记需要应对的情况', category: 'vocabulary',
    entries: [entry('prepare-winter', '冬に備える', 'ふゆにそなえる', '为冬天作准备、备冬')],
    points: ['「備える」表示预先准备，以应对将来的情况。常用「冬に備える」「災害に備える」，不是把「に」一律理解为动作发生地点。'],
    examples: [example('prepare-heater', '冬に備えて、暖房器具を点検した。', '为了迎接冬天，我检查了取暖设备。')],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg／写真5.jpg重叠部分', quote: '冬に備える', translation: '为冬天作准备。' },
  },
  {
    id: 'live-2026-10-30-future-time', title: 'そのうち・いずれ・いまに・まもなく',
    subtitle: '不确定的将来、终将与眼前将至', category: 'vocabulary',
    entries: [
      entry('sonouchi', 'そのうち', 'そのうち', '过些时候、迟早；（依语境）其中'),
      entry('izure', 'いずれ', 'いずれ', '将来某时、终将', '这里整理将来用法；另有“哪个”等用法。'),
      entry('imani', 'いまに', 'いまに', '不久、迟早、总有一天', '常带对将来结果的预料、警告或决心，不等于“现在”。'),
      entry('soon-osaka', 'まもなく大阪です', 'まもなくおおさかです', '马上就到大阪了', '列车广播等场景可省略“到达”；不意味着所有“まもなく”都需要接地名。'),
    ],
    points: [
      '「そのうち」常把时间留得较模糊；「いずれ」常强调未来某时或最终结果。具体远近仍需语境，不能排成固定的时间刻度。',
      '「いまに」常预示接下来会出现某种结果，如「いまにわかるよ」；「まもなく」通常是较郑重的“马上、不久”，常见于广播。',
    ],
    examples: [
      example('future-understanding', '今は難しくても、いずれ理解できるようになる。', '即使现在很难，总有一天会变得能够理解。'),
      example('soon-osaka-announcement', 'まもなく大阪です。お降りのお客様は、お忘れ物にご注意ください。', '马上就到大阪了。下车的旅客请注意不要遗忘物品。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg／写真5.jpg重叠部分', quote: 'そのうち\nいずれ\nいまに\nまもなく大阪です', translation: '过些时候；终将；迟早、不久；马上就到大阪了。' },
  },
  {
    id: 'live-2026-10-30-youni', title: '遅れないように・のび太にならないように',
    subtitle: '否定形＋ように：避免某种结果', category: 'grammar',
    entries: [
      entry('avoid-late-tomorrow', '明日遅れないように', 'あしたおくれないように', '为了明天不迟到；注意明天别迟到', '后面的行动或提醒内容在笔记中省略。'),
      entry('avoid-becoming-nobita', 'のび太にならないように', 'のびたにならないように', '为了不变得像野比大雄那样', '保留原笔记的角色比喻，不据此把某种性格当作角色的完整定义。'),
    ],
    points: [
      '「～ないように」可说明为了避免某种结果而采取行动，也可用于提醒、叮嘱。两条都是省略了后文的片段。',
      '「なる」的否定是「ならない」；人物名作比喻时，具体指哪一方面需依对话确定。',
    ],
    examples: [
      example('avoid-late-alarm', '明日遅れないように、目覚ましを二つセットした。', '为了明天不迟到，我设了两个闹钟。'),
      example('avoid-forgetting', '忘れ物をしないように、今夜のうちに準備しておこう。', '为了避免忘带东西，今晚先准备好吧。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg／写真5.jpg重叠部分', quote: '明日遅れないように\nのび太にならないように', translation: '为了明天不迟到；为了不变得像大雄那样。两条后文都省略。' },
  },
  {
    id: 'live-2026-10-30-diligence', title: 'せっせと・コツコツ・気が変になる',
    subtitle: '勤快投入、点滴坚持与情绪表达', category: 'vocabulary',
    entries: [
      entry('study-diligently', 'せっせと勉強する', 'せっせとべんきょうする', '勤奋地、勤勤恳恳地学习'),
      entry('persist-steadily', 'コツコツ頑張る', 'コツコツがんばる', '踏实地、一点一滴地坚持努力'),
      entry('feel-going-crazy', '気が変になる', 'きがへんになる', '快要发疯、精神上受不了', '情绪性口语，不等于「気が変わる」（改变主意）。'),
    ],
    points: [
      '「せっせと」突出勤快、认真投入某个行动；「コツコツ」突出一点一点积累、踏实坚持，二者并非完全同义。',
      '「気が変になる」与「気が変わる」的动词和含义都不同。前者常是强烈情绪表达，要结合语气，不把它当作改变计划的说法。',
    ],
    examples: [
      example('little-every-day', '毎日少しずつ、コツコツ勉強を続けている。', '每天一点点，踏实地坚持学习。'),
      example('noise-distress', 'この騒音が続いたら、気が変になりそうだ。', '这噪声再继续下去，我都快要疯了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · 写真4.jpg／写真5.jpg重叠部分', quote: 'せっせと勉強する\nコツコツ頑張る\n気が変になる', translation: '勤奋学习；一点一滴地坚持努力；觉得快要发疯、受不了。' },
  },
  {
    id: 'live-2026-10-30-spoken-openers', title: 'ここだけの話・自分で言うのも・こう見えても',
    subtitle: '无独立日期的4句补充：铺垫、保密与反差', category: 'grammar', supplement: true,
    entries: [
      entry('not-by-choice', '好き好んでやっているわけではない', 'すきこのんでやっているわけではない', '并不是因为自己喜欢才做的'),
      entry('between-us', 'ここだけの話なんだけど', 'ここだけのはなしなんだけど', '这话只跟你说、这件事你可别往外说', '提出私下谈话的铺垫，不保证听者真的会保密。'),
      entry('say-about-myself', '自分で言うのもあれなんだけど', 'じぶんでいうのもあれなんだけど', '由我自己说这个也有点那什么，不过……', '「あれ」含糊回避“有点不好意思、不太合适”等直说，具体意思依后文。'),
      entry('despite-appearance', '私はこう見えても', 'わたしはこうみえても', '别看我这样，其实我……', '通常需要后文交代与外表印象相反、容易被忽略的事实。'),
    ],
    points: [
      '这4句在写真1上方和写真5下方重复出现，没有可见的独立日期标题，因此单列为截图无日期补充，不能据此认定为10月29日或10月30日的明确原始笔记日期。',
      '「好き好んで～わけではない」否定的是“出于个人喜好去做”这一解释，未否认正在做这件事。可与「自分から」「進んで」所在组联读。',
      '「なんだけど」「こう見えても」常为后话作铺垫；完整话语的重点在后文，不把这些片段机械教成固定、独立的陈述。',
    ],
    examples: [
      example('not-work-by-choice', '好き好んで夜中まで働いているわけではない。', '并不是我自己喜欢才工作到半夜的。'),
      example('between-us-moving', 'ここだけの話なんだけど、来年引っ越す予定なんだ。', '这话只跟你说，我打算明年搬家。'),
      example('despite-appearance-cooking', '私はこう見えても、料理が得意なんです。', '别看我这样，其实我很擅长做饭。'),
    ],
    source: { kind: 'note', label: '截图无日期补充 · 写真1.jpg／写真5.jpg（重复内容合并）', quote: '好き好んでやっているわけではない\nここだけの話なんだけど\n自分で言うのもあれなんだけど\n私はこう見えても', translation: '并非因为喜欢才做；这话只跟你说；自己这么说也有点不好意思，不过……；别看我这样，其实……。' },
  },
]
