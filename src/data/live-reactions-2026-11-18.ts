import type { LiveReactionEntry, LiveReactionExample } from './live-reactions.ts'
import type { LiveUnitGroup } from './live-reaction-units.ts'

// Ten user-supplied phone-note screenshots. IMG_3356 explicitly dates these
// notes to 2026-11-18. Overlapping lines are merged, unfinished phrases remain
// labelled, and source quotations stay separate from original learning examples.
// IMG_3359's final typed character わ is not a complete word and is not inferred.
const entry = (id: string, expression: string, reading: string, meaning: string, note?: string): LiveReactionEntry => ({
  id: `live-2026-11-18-entry-${id}`, expression, reading, meaning, ...(note ? { note } : {}),
})
const example = (id: string, japanese: string, chinese: string): LiveReactionExample => ({
  id: `live-2026-11-18-example-${id}`, japanese, chinese,
})

export const liveNovember18Groups: LiveUnitGroup[] = [
  {
    id: 'live-2026-11-18-growth-and-diving', title: '身長が伸びる・海に潜る・モグラ',
    subtitle: '长高、潜入与动物名称', category: 'vocabulary',
    entries: [
      entry('grow-taller', '身長が伸びる', 'しんちょうがのびる', '身高增长、长高'),
      entry('dive-into-sea', '海に潜る', 'うみにもぐる', '潜入海中、在海里潜水'),
      entry('mole', 'モグラ', 'もぐら', '鼹鼠'),
    ],
    points: [
      '「伸びる」是自动词，表示长度、能力或数量等增长；「身長が伸びる」中的「身長」是用「が」标记的主语。',
      '这里的「潜る」读「もぐる」，表示潜入水里或进入某物下面，不等同于自然下沉的「沈む」。',
    ],
    examples: [
      example('three-centimeters-taller', '去年より身長が三センチ伸びた。', '比去年长高了三厘米。'),
      example('watch-fish-underwater', '夏休みに海に潜って、魚を観察した。', '暑假时我潜入海中观察了鱼。'),
      example('look-up-moles', '図鑑でモグラについて調べた。', '我查了图鉴，了解鼹鼠。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3356.jpeg', quote: '身長が伸びる\n海に潜る\nモグラ', translation: '长高；潜入海中；鼹鼠。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-hidden-talent', title: '埋もれていた人材・埋もれさせておく',
    subtitle: '发现人才，让才能得到发挥', category: 'grammar',
    entries: [
      entry('recruit-hidden-talent', '埋もれていた人材を採用する', 'うもれていたじんざいをさいようする', '录用此前未被发掘的人才'),
      entry('too-talented-to-overlook', '埋もれさせておくのはもったいない人物', 'うもれさせておくのはもったいないじんぶつ', '不该任其埋没的人才', '按原图相邻两行合读；这是修饰「人物」的名词短语，不另补成完整判断句。'),
    ],
    points: [
      '「埋もれる」本可表示被覆盖、埋住；用于人才时，比喻才能没有被发现或发挥。',
      '「埋もれる→埋もれさせる」是使役变化；「～させておく」在这里表示让某种状态继续保持。',
      '「もったいない」在此表示可惜、浪费才华，并不是说这个人本身没有价值。',
    ],
    examples: [
      example('discover-applicant-strength', '面接で実力を見いだし、これまで埋もれていた人材を採用した。', '通过面试发现其真正实力后，我们录用了这位此前未被发掘的人才。'),
      example('dont-waste-talent', '経験豊かな人材を埋もれさせておくのはもったいない。', '让经验丰富的人才一直被埋没，实在可惜。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3356.jpeg', quote: '埋もれていた人材を採用する\n埋もれさせておくのは\nもったいない人物', translation: '录用此前未被发掘的人才；让其继续埋没下去，未免可惜的人物（后两行合读）。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-gratitude-and-good-news', title: 'ありがたい・めでたいことずくめ',
    subtitle: '表达感激与喜事接连发生', category: 'vocabulary',
    entries: [
      entry('grateful-for-help', 'ありがたい', 'ありがたい', '令人感激的、难得而有帮助的'),
      entry('nothing-but-good-news', 'めでたいことずくめ', 'めでたいことずくめ', '尽是喜事、喜事连连'),
    ],
    points: [
      '「ありがたい」常用来评价帮助、机会或对自己有益的安排；它是形容词，不能在所有句子里直接替换道谢用语「ありがとう」。',
      '「名词＋ずくめ」表示尽是某类事物。「めでたいこと」是值得庆祝的事；「ずくめ」本身不限于好事，也可说「黒ずくめ」。',
    ],
    examples: [
      example('helpful-detailed-feedback', '忙しい中、丁寧に助言していただけてありがたいです。', '您百忙之中还细心给我建议，我很感激。'),
      example('family-good-news', '兄の結婚に妹の合格と、今年はめでたいことずくめだ。', '哥哥结婚，妹妹考试合格，今年真是喜事连连。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3356.jpeg', quote: 'ありがたい\nめでたいことずくめ', translation: '令人感激、难得而有帮助；尽是喜事、喜事连连。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-bottom-and-reserve-strength', title: '鍋の底が・底力',
    subtitle: '底部的字面义与内在实力', category: 'vocabulary',
    entries: [
      entry('pot-bottom-fragment', '鍋の底が', 'なべのそこが', '锅底……（原句未完）', '截图到助词「が」为止，没有谓语；原文不补写具体结果。'),
      entry('reserve-strength', '底力', 'そこぢから', '内在实力、关键时刻显露的潜力', '读作「そこぢから」，注意不是「そこちから」。'),
    ],
    points: [
      '「鍋の底」指锅的最下面部分；「底力」则表示平时未必充分显露、关键时刻发挥出的力量。',
      '「鍋の底が」只是句子开头。下面的完整例句是另写的练习句，不代表截图省略的原句。',
    ],
    examples: [
      example('blackened-pot-bottom', '鍋の底が黒くなっていた。', '锅底变黑了。'),
      example('team-shows-strength', '最後の試合で、チームは底力を見せた。', '在最后一场比赛中，球队展现出了真正的实力。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3356.jpeg', quote: '鍋の底が\n底力', translation: '锅底……（原句未完）；内在实力、关键时刻显露的潜力。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-reassured-and-uneasy', title: '心強い・心細い',
    subtitle: '有依靠而安心，与缺乏把握的不安', category: 'vocabulary',
    entries: [
      entry('feel-reassured', '心強い', 'こころづよい', '令人安心、让人有信心的'),
      entry('feel-uneasy', '心細い', 'こころぼそい', '不安、心里没底、感到无依无靠'),
    ],
    points: [
      '「心強い」常表示有人支持或有可靠条件，因此感到安心；「心細い」则常来自缺少依靠、把握或资源。',
      '这组词描述心理感受，不能按字面理解成心脏强弱。注意读音「こころづよい／こころぼそい」。',
    ],
    examples: [
      example('reliable-teammate', '経験のある人が一緒にいてくれると心強い。', '有经验的人陪在身边，让人很安心。'),
      example('alone-in-new-city', '初めての町で一人になり、少し心細かった。', '独自待在一个陌生城市里，我有些心里没底。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3356.jpeg／IMG_3357.jpeg', quote: '心強い\n心細い', translation: '有依靠而安心、有信心；不安、心里没底。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-unusual-cleaning', title: '珍しく掃除なんかする',
    subtitle: '表达反常举动，并理解「なんか」的口气', category: 'grammar',
    entries: [
      entry('unusual-cleaning', '珍しく掃除なんかする', 'めずらしくそうじなんかする', '难得居然做起打扫之类的事'),
    ],
    points: [
      '「珍しく」修饰动作，表示某人难得这样做，与平常习惯不同。',
      '「なんか」可以表示举例，也可能带轻视、自谦或意外的口气。这句要结合语境判断，不能把所有「なんか」都译成贬义。',
    ],
    examples: [
      example('brother-cleans-unusually', '弟が珍しく掃除なんかしている。誰か来るのかな。', '弟弟难得居然在打扫，是不是有谁要来？'),
      example('quietly-cleans-room', '今日は珍しく、誰にも言われずに部屋を掃除した。', '今天难得不用别人提醒，我就打扫了房间。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3357.jpeg', quote: '珍しく掃除なんかする', translation: '难得居然做起打扫之类的事。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-cleaning-and-discovery', title: 'すると・掃除すると・掃除してみると・掃除していると',
    subtitle: '区分接续、一般结果、尝试后的发现和进行中的事件', category: 'grammar',
    entries: [
      entry('then-as-a-result', 'すると、', 'すると', '于是、接着；这样一来', '单独放在句首时常作接续词；原图只给出开头，不补写后文。'),
      entry('when-cleaning', '掃除すると、', 'そうじすると', '一打扫就……；打扫之后……', '原笔记未写结果部分。'),
      entry('after-trying-cleaning', '掃除してみると、', 'そうじしてみると', '试着打扫后发现……', '「てみる」增加实际尝试的含义。'),
      entry('while-cleaning', '掃除していると、', 'そうじしていると', '正在打扫时……', '「ている」表示动作正在持续，后面可接这时发生或发现的事。'),
    ],
    points: [
      '句首「すると、」承接前文发生的事；「動詞＋と」则把前项动作作为后项出现的条件或契机。',
      '「掃除すると」可谈反复出现的结果；「掃除してみると」强调尝试后才发现的情况。',
      '「掃除していると」将打扫设为持续背景，常接此时发生的另一件事。四条原文都没有后半句，不能推断具体发生了什么。',
    ],
    examples: [
      example('clean-room-clear-mind', '部屋を掃除すると、気分もすっきりする。', '打扫完房间，心情也会变得舒畅。'),
      example('discover-old-photo', '棚を掃除してみると、奥に古い写真があった。', '试着清理了一下架子，发现里面有一张旧照片。'),
      example('phone-call-during-cleaning', '部屋を掃除していると、友達から電話がかかってきた。', '正在打扫房间时，朋友打来了电话。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3357.jpeg／IMG_3359.jpeg', quote: 'すると、\n掃除すると、\n掃除してみると、\n掃除していると、', translation: '于是、接着……；一打扫就……；试着打扫后发现……；正在打扫时……。原文均未写后续部分。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-fresh-and-clear', title: '爽やか・スッキリ・すがすがしい・みずみずしい',
    subtitle: '清爽、舒畅与水灵新鲜的区别', category: 'vocabulary',
    entries: [
      entry('refreshing', '爽やか', 'さわやか', '清爽、爽朗、令人舒畅'),
      entry('clear-and-uncluttered', 'スッキリ', 'すっきり', '清爽、利落；问题消除后舒畅'),
      entry('fresh-and-invigorating', 'すがすがしい', 'すがすがしい', '清新爽快、身心舒畅', '也写作「清々しい」。'),
      entry('fresh-and-juicy', 'みずみずしい', 'みずみずしい', '水灵、新鲜；充满活力的'),
    ],
    points: [
      '「爽やか」是ナ形容词，可说「爽やかな風」；「すがすがしい」是イ形容词，常形容清新空气或爽快心情。',
      '「スッキリ」常用「すっきりする／すっきりした」，可描述整理干净、疑问消除或头脑清醒后的状态。',
      '「みずみずしい」常强调水果、蔬菜等富有水分，也可比喻感性、文章等清新鲜活，不能处处替换「すっきり」。',
    ],
    examples: [
      example('refreshing-morning-air', '爽やかな風に吹かれて、すがすがしい気分になった。', '吹着清爽的风，心情也变得舒畅起来。'),
      example('desk-after-tidying', '机の上を片づけたら、見た目がすっきりした。', '整理桌面后，看起来清爽利落多了。'),
      example('juicy-pears', 'この梨はみずみずしくて、食べると果汁があふれる。', '这个梨水分充足，咬下去满是果汁。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3357.jpeg／IMG_3359.jpeg', quote: '爽やか\nスッキリ\nすがすがしい\nみずみずしい', translation: '清爽、爽朗；清爽利落、舒畅；清新爽快；水灵、新鲜。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-interpersonal-distance', title: '馴れ馴れしい・対人距離を測る',
    subtitle: '判断亲疏分寸，避免过分套近乎', category: 'vocabulary',
    entries: [
      entry('overly-familiar', '馴れ馴れしい', 'なれなれしい', '过分亲热、自来熟得有些失礼'),
      entry('gauge-interpersonal-distance', '対人距離を測る', 'たいじんきょりをはかる', '衡量与他人之间的距离、判断相处分寸', '原笔记写作「測る」。可指实际距离，也可结合语境理解为心理上的亲疏分寸。'),
    ],
    points: [
      '「馴れ馴れしい」通常带负面评价，表示亲热程度超出了双方关系所允许的范围，并不等同于「親しみやすい」。',
      '谈人际交往时，可根据对方反应判断合适的称呼、语气和话题范围；「対人距離」的具体所指需要看语境。',
    ],
    examples: [
      example('first-meeting-too-familiar', '初対面なのに馴れ馴れしく話しかけられて、少し戸惑った。', '初次见面，对方却过分亲热地搭话，让我有点不知所措。'),
      example('gauge-distance-through-reactions', '相手の反応を見ながら対人距離を測り、話し方を調整する。', '我会观察对方的反应，把握相处分寸，调整说话方式。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3357.jpeg／IMG_3359.jpeg', quote: '馴れ馴れしい\n対人距離を測る', translation: '过分亲热、套近乎；衡量与他人的距离、判断相处分寸。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-cigarette-litter', title: '吸い殻のポイ捨てをする・灰皿',
    subtitle: '烟头、乱扔与烟灰缸', category: 'vocabulary',
    entries: [
      entry('litter-cigarette-butts', '吸い殻のポイ捨てをする', 'すいがらのぽいすてをする', '随手乱扔烟头'),
      entry('ashtray', '灰皿', 'はいざら', '烟灰缸', '原笔记同一行已注明读音「はいざら」。'),
    ],
    points: [
      '「吸い殻」指抽剩的烟头等残留部分；「ポイ捨て」指随手丢弃、乱扔，可接「する」。',
      '除了「吸い殻のポイ捨てをする」，也可用「吸い殻をポイ捨てする」，把丢弃对象直接用「を」标记。',
    ],
    examples: [
      example('dont-litter-butts', '吸い殻のポイ捨てをしないでください。', '请不要乱扔烟头。'),
      example('empty-ashtray', 'テーブルの上に空の灰皿が置いてあった。', '桌上放着一个空烟灰缸。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3359.jpeg', quote: '吸い殻のポイ捨てをする\n灰皿 はいざら', translation: '随手乱扔烟头；烟灰缸，读作はいざら。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-critical-concession', title: '約束したくせに・子供のくせに',
    subtitle: '用「くせに」表达责怪、不满或讥讽', category: 'grammar',
    entries: [
      entry('despite-promising', '約束したくせに、', 'やくそくしたくせに', '明明答应了，却……', '原笔记保留逗号，未显示后半句。「くせに」常带责怪或不满。'),
      entry('despite-being-a-child', '子供のくせに', 'こどものくせに', '明明还是个孩子，却……', '原图没有后半句。直接对人说时常含轻视或责怪，不能当作中性的「虽然是孩子」。'),
    ],
    points: [
      '接续：动词、イ形容词普通形＋くせに；名词＋のくせに；ナ形容词词干＋なくせに。',
      '「くせに」指出言行或结果与前项不相符，同时加入说话者的批评态度；「のに」的使用范围更广。',
      '截图中的两条都是学习片段。下面的完整句子是原创例句，不补写进原笔记。',
    ],
    examples: [
      example('promise-without-contact', '約束したくせに、連絡もしないなんてひどい。', '明明答应了，却连联系都不联系，真过分。'),
      example('upset-by-child-remark', '「子供のくせに」と言われて、悔しかった。', '被人说“明明就是个小孩”，我很不甘心。'),
      example('blame-others-despite-own-error', '自分も間違えたくせに、人の失敗ばかり責める。', '自己也犯了错，却光责怪别人的失误。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3360.jpeg／IMG_3362.jpeg', quote: '約束したくせに、\n子供のくせに', translation: '明明答应了，却……；明明还是个孩子，却……（均未显示后半句）。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-verbal-habit', title: '口癖',
    subtitle: '描述反复挂在嘴边的话', category: 'vocabulary',
    entries: [
      entry('verbal-habit', '口癖', 'くちぐせ', '口头禅、说话时的习惯表达', '原图在汉字后注明「くちぐせ」。'),
    ],
    points: [
      '常用「『～』が口癖だ」说明一个人经常说的话，也可说「口癖を直す」。',
      '「口癖」是名词；「～くせに」是连接前后内容、表达不满的句型，不能因读音相近就混用。',
    ],
    examples: [
      example('it-will-work-out-catchphrase', '「なんとかなる」が彼の口癖だ。', '“总会有办法的”是他的口头禅。'),
      example('notice-interview-verbal-habit', '面接の練習で、自分の口癖に気づいた。', '通过面试练习，我注意到了自己的口头禅。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3360.jpeg／IMG_3362.jpeg／IMG_3363.jpeg', quote: '口癖 くちぐせ', translation: '口头禅；读音为くちぐせ。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-relative-expectation', title: '勤務時間のわりに・割合',
    subtitle: '预期落差、比例与相对程度', category: 'grammar',
    entries: [
      entry('relative-to-working-hours', '勤務時間のわりに', 'きんむじかんのわりに', '相对于工作时长来说……／按工作时长来看却……', '原图没有后半评价，不能擅自补成工资高、工资低等结论。'),
      entry('proportion-or-relatively', '割合', 'わりあい', '比例、比率；比较、相对地', '可作名词，也可作副词。读「わりあい」，不是「わりに」。'),
    ],
    points: [
      '「～わりに」表示实际情况与根据前项推想的程度不太一致。名词后接「のわりに」，动词普通形后直接接「わりに」。',
      '「学生の割合」中的「割合」是名词，表示比例；「割合暖かい」中的「割合」是副词，表示比较暖和。',
      '「わりに」与「割合」在部分用法上相关，但接续和结构不同，不能在所有句子里直接替换。',
    ],
    examples: [
      example('salary-relative-to-hours', 'この仕事は、勤務時間のわりに給料が高い。', '这份工作按工作时长来看，薪水算高的。'),
      example('student-proportion', '参加者のうち、学生の割合は約半分だ。', '参加者中，学生约占一半。'),
      example('relatively-warm-day', '今日は割合暖かい。', '今天比较暖和。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3360.jpeg／IMG_3362.jpeg／IMG_3363.jpeg', quote: '勤務時間のわりに\n割合', translation: '相对于工作时长来说……（后半未显示）；比例、比率，或比较、相对地。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-thanks-to-guidance', title: '先生のおかげだ・指導してくれたおかげだ',
    subtitle: '说明帮助带来的结果并表达感谢', category: 'grammar',
    entries: [
      entry('thanks-to-teacher', '先生のおかげだ', 'せんせいのおかげだ', '多亏了老师'),
      entry('thanks-to-teacher-guidance', '先生が指導してくれたおかげだ', 'せんせいがしどうしてくれたおかげだ', '多亏了老师给予指导', '「くれた」表明说话者把老师的指导视作对自己的帮助。'),
      entry('okage-kanji', 'お陰', 'おかげ', '恩惠；多亏、托……的福', '原笔记补充「おかげ」的汉字写法。日常也常直接写平假名「おかげ」。'),
    ],
    points: [
      '接续：名词＋のおかげ；动词普通形＋おかげ。以「おかげだ」结句，或用「おかげで」连接后面的结果。',
      '通常把帮助或原因与好结果联系起来，常含感谢；遇到反话时也可能用于不好的结果，需结合语境。',
      '正式向老师致谢时，可将「指導してくれたおかげだ」调整为「指導してくださったおかげです」。',
    ],
    examples: [
      example('pass-thanks-to-teacher', '試験に合格できたのは、先生のおかげです。', '能够通过考试，多亏了老师。'),
      example('confidence-after-guidance', '先生が丁寧に指導してくれたおかげで、発表に自信がついた。', '多亏了老师耐心指导，我对发表有了信心。'),
      example('release-thanks-to-everyone', '皆さんのおかげで、無事に公開できました。', '多亏大家的帮助，终于顺利发布了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3362.jpeg／IMG_3363.jpeg', quote: '先生のおかげだ\n先生が指導してくれたおかげだ\nお陰', translation: '多亏了老师；多亏了老师给予指导；「おかげ」的汉字写法为「お陰」。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-ending-you-ni-instructions', title: '早く来るように・遅刻しないように',
    subtitle: '用句末「ように」叮嘱或指示', category: 'grammar',
    entries: [
      entry('come-early-instruction', '早く来るように。', 'はやくくるように', '要早点来。', '原笔记标注「叮嘱」。句末「ように」可作提醒或指示，不必机械当作未完句。'),
      entry('do-not-be-late-instruction', '絶対に遅刻しないように。', 'ぜったいにちこくしないように', '千万不要迟到。', '否定形＋ように要求避免某事；「絶対に」加强语气。'),
    ],
    points: [
      '句末「動詞普通形＋ように」可用于叮嘱或指示，常见于老师、负责人等对对方提出要求的场景。',
      '可理解为省略了「してください」等后续表达，但语气仍须结合关系与场合；它并不总是柔和的请求。',
      '这里要求对方采取行动，与祈愿用法、句中表示目的的「ように」分开理解。',
    ],
    examples: [
      example('arrive-before-briefing', '説明会には五分前に来るように。', '说明会要提前五分钟到。'),
      example('do-not-forget-name', '提出前に、名前を書き忘れないように。', '提交前，别忘了写上姓名。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3363.jpeg／IMG_3364.jpeg', quote: '早く来るように。 叮嘱\n絶対に遅刻しないように。', translation: '要早点来。（原笔记中文标签：叮嘱）\n千万不要迟到。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-ending-you-ni-wishes', title: 'いい一年になるように・合格できるように',
    subtitle: '用句末「ように」表达希望与祈愿', category: 'grammar',
    entries: [
      entry('wish-for-good-year', '来年、いい一年になるように。', 'らいねん、いいいちねんになるように', '愿明年是美好的一年。', '原笔记标注「祈愿」，保留原句。常见的完整祈愿说法还有「いい一年になりますように」。'),
      entry('wish-to-pass', '合格できるように。', 'ごうかくできるように', '希望能够考过／愿能合格。', '按截图中相邻的祈愿说明理解；也可说「合格できますように」。单独出现在其他语境时，仍需判断是否还有后续内容。'),
    ],
    points: [
      '祈愿用法表达说话者希望某种结果实现，常用「～ますように／～ませんように」，如「うまくいきますように」。',
      '「合格できる」使用可能形，把“能够通过”作为期待的结果；它不表示已经合格或保证一定合格。',
      '形式同样以「ように」结束，也可能是叮嘱或目的表达。要结合前后文、语调和原笔记的用法标签判断。',
    ],
    examples: [
      example('wish-for-peaceful-year', '来年が、穏やかでいい一年になりますように。', '愿明年是平稳而美好的一年。'),
      example('wish-to-pass-japanese-test', '日本語の試験に合格できますように。', '希望能够通过日语考试。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3363.jpeg／IMG_3364.jpeg', quote: '来年、いい一年になるように。 祈愿\n合格できるように。', translation: '愿明年是美好的一年。（原笔记中文标签：祈愿）\n希望能够合格。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-exaggerated-and-rough', title: '大袈裟・大雑把',
    subtitle: '区分夸张反应与粗略处理', category: 'vocabulary',
    entries: [
      entry('exaggerated', '大袈裟', 'おおげさ', '夸张、小题大做', '常指说法或反应超出了实际程度；可用「大袈裟な説明」「大袈裟に言う」。'),
      entry('rough-or-careless', '大雑把', 'おおざっぱ', '粗略、大致；粗枝大叶', '形容估计或计划时可指不细分；形容人的做事方式时可能指不拘小节或粗心。注意促音「っぱ」。'),
    ],
    points: [
      '两者都是ナ形容词：修饰名词用「大袈裟な」「大雑把な」，修饰动作可用「大袈裟に」「大雑把に」。',
      '「大袈裟」着眼于程度被夸大；「大雑把」着眼于没有细分、没有关注细节。后者不一定是贬义，如先做粗略计划。',
    ],
    examples: [
      example('reduce-exaggeration', '大袈裟な表現を減らして、事実を簡潔に説明した。', '我减少了夸张的说法，简洁地说明了事实。'),
      example('rough-plan-before-details', 'まずは大雑把な計画を立ててから、細部を詰めよう。', '先拟一个大致计划，再完善细节吧。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3363.jpeg／IMG_3364.jpeg', quote: '大袈裟おおげさ\n大雑把おおざっぱ', translation: '大袈裟：夸张，读おおげさ。\n大雑把：粗略、粗枝大叶，读おおざっぱ。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-cheeky-and-greedy', title: '生意気・欲張り',
    subtitle: '对言行分寸和欲望过多的评价', category: 'vocabulary',
    entries: [
      entry('cheeky-presumptuous', '生意気', 'なまいき', '狂妄、傲慢、不知分寸', '常指言行超出对方认为应有的身份、资历或年龄分寸；一般带负面评价，熟人之间也可能是玩笑。'),
      entry('greedy-person', '欲張り', 'よくばり', '贪心；贪心的人', '可说「欲張りな人」。与动词「欲張る」一起记忆，表示什么都想要或过度追求。'),
    ],
    points: [
      '「生意気」评价态度、说话方式或行为分寸；「欲張り」评价想要的东西或目标过多，侧重点不同。',
      '两者都常带批评语气；使用时要看关系、语调和上下文，不宜当成一般性的褒义评价。',
      '「生意気なことを言ってすみませんが」可用于表达不同意见前自谦；「欲張りだ」也可在亲近的人之间半开玩笑地说。',
    ],
    examples: [
      example('presumptuous-opinion', '生意気なことを言ってすみませんが、この案には問題があると思います。', '请原谅我说得冒昧，但我觉得这个方案有问题。'),
      example('want-everything', '全部ほしいなんて、欲張りだなあ。', '居然全都想要，真贪心呀。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3363.jpeg／IMG_3364.jpeg／IMG_3365.jpeg', quote: '生意気なまいき\n欲張り', translation: '生意気：狂妄、不知分寸，读なまいき。\n欲張り：贪心、贪心的人。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-attention-and-noticing', title: '気になる・気づく',
    subtitle: '区分心里在意与发现、意识到', category: 'vocabulary',
    entries: [
      entry('be-on-ones-mind', '気になる', 'きになる', '在意、放心不下；产生兴趣', '对象通常用「が」，如「結果が気になる」。是担心还是好奇，要看语境。'),
      entry('notice-realize', '気づく', 'きづく', '注意到、察觉、意识到', '也写作「気付く」。察觉的对象通常用「に」，如「間違いに気づく」。'),
    ],
    points: [
      '「気になる」表示某件事进入注意中心、让人挂心；「気づく」强调从没有注意到，转为发现或意识到。',
      '对照助词：「表示のずれが気になる」是在意显示偏移；「表示のずれに気づく」是发现了显示偏移。',
    ],
    examples: [
      example('concerned-about-result', '試験の結果が気になって、何度もメールを確認した。', '因为一直惦记考试结果，我反复查看邮件。'),
      example('notice-name-typo', '提出したあとで、名前の誤字に気づいた。', '提交后才发现名字写错了。'),
      example('interested-in-new-shop', '駅前にできた新しい店が気になる。', '我对车站前新开的那家店有点好奇。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3364.jpeg／IMG_3365.jpeg', quote: '気になる\n気づく', translation: '在意、放心不下或产生兴趣；注意到、察觉。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-whichever-alternative', title: '～だろうが・～だろうと・～であろうが',
    subtitle: '列举不同情况，表达结论不受影响', category: 'grammar',
    entries: [
      entry('today-or-tomorrow', '今日だろうが、明日だろうが', 'きょうだろうが、あしただろうが', '无论今天还是明天，……', '原图仅列举两种情况，未写后半结论。'),
      entry('japan-or-america', '日本だろうと、アメリカだろうと', 'にほんだろうと、アメリカだろうと', '无论日本还是美国，……', '原图未写后半结论；这里的「と」与前一条的「が」都构成让步条件。'),
      entry('meat-or-vegetables', '肉であろうが、野菜であろうが', 'にくであろうが、やさいであろうが', '无论是肉还是蔬菜，……', '原图未写后半结论。「であろう」比「だろう」更常见于郑重或书面表达。'),
    ],
    points: [
      '「AだろうがBだろうが／AだろうとBだろうと」表示不管是哪一种情况，后面的判断、方针或结果都不改变。',
      '这里的「だろう」参与构成让步句型，不只是在猜测“也许是A”。名词后也可以用较郑重的「であろうが」。',
      '三个截图原句都只有条件部分。下面补入的完整结论均为原创例句，不代表直播中未展示的原话。',
    ],
    examples: [
      example('contact-on-either-day', '今日だろうが、明日だろうが、困ったら連絡して。', '无论今天还是明天，遇到困难就联系我。'),
      example('study-online-anywhere', '日本だろうと、アメリカだろうと、オンラインなら一緒に勉強できる。', '无论在日本还是美国，通过网络就能一起学习。'),
      example('avoid-food-waste', '肉であろうが、野菜であろうが、食材を無駄にはしたくない。', '无论肉类还是蔬菜，我都不想浪费食材。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3364.jpeg／IMG_3365.jpeg', quote: '今日だろうが、明日だろうが\n日本だろうと、アメリカだろうと\n肉であろうが、野菜であろうが', translation: '无论今天还是明天，……\n无论日本还是美国，……\n无论肉类还是蔬菜，……（三条均未显示后半结论）。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-wearing-armband', title: '腕章を腕にはめる',
    subtitle: '识别「腕章」与装戴动作', category: 'vocabulary',
    entries: [
      entry('put-armband-on-arm', '腕章を腕にはめる', 'わんしょうをうでにはめる', '把袖章戴在手臂上', '「腕章」读「わんしょう」，单独的「腕」读「うで」；「はめる」表示套上、装入。'),
    ],
    points: [
      '装戴的物品用「を」，装戴的部位用「に」：「腕章を／腕に／はめる」。',
      '按袖章的形状和动作，也可说「腕章をつける」「腕に巻く」；原笔记保留「はめる」。',
    ],
    examples: [
      example('guide-wears-yellow-armband', '案内係は黄色い腕章を腕にはめている。', '引导人员的手臂上戴着黄色袖章。'),
      example('staff-armbands', 'スタッフは腕章をつけてから、持ち場に向かった。', '工作人员戴上袖章后，前往各自的岗位。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3365.jpeg', quote: '腕章を腕にはめる', translation: '把袖章戴在手臂上。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-fall-into-and-entrap', title: '陥れる・陥る',
    subtitle: '区分使人陷入与自己陷入某种状态', category: 'transitivity',
    entries: [
      entry('entrap-or-plunge-into', '陥れる', 'おとしいれる', '使……陷入；陷害', '他动词，常见「人を不利な立場に陥れる」「混乱に陥れる」。读音中的「しい」不要省略。'),
      entry('fall-into-state', '陥る', 'おちいる', '陷入、落入某种状态', '自动词，常见「困難に陥る」「資金不足に陥る」。不要读成「おちる」。'),
    ],
    points: [
      '「人・物を＋状態に＋陥れる」说明某因素让对象陷入状态；「人・物が＋状態に＋陥る」说明主体陷入了该状态。',
      '原笔记写「陥れる＝落とし入れる」「陥る＝落ち入る」。这里保留等号原貌，但不把两边教成任何语境都能互换；学习抽象状态与陷害等含义时，使用常见写法「陥れる／陥る」。',
      '它们常与混乱、困难、危险等不利状态搭配；不能把「陥る」直接当作普通「入る」来表示进入房间。',
    ],
    examples: [
      example('error-plunges-system-into-confusion', '一つの不具合が、システム全体を混乱に陥れた。', '一个故障使整个系统陷入了混乱。'),
      example('project-in-financial-difficulty', '計画の途中で、資金不足に陥った。', '计划进行到一半时，陷入了资金不足的困境。'),
      example('false-information-entrapment', 'うその情報で人を陥れるようなことはしない。', '我不会用虚假信息去陷害别人。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3365.jpeg', quote: '陥れる＝落とし入れる\n陥る＝落ち入る', translation: '笔记写「陥れる＝落とし入れる」「陥る＝落ち入る」：分别学习使……陷入／陷害，以及自己陷入。等号不表示所有语境都可替换。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-escape-concession', title: '逃げても無駄・どこに～ても',
    subtitle: '区分即使发生某种情况和无论哪种情况', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3367.jpeg',
      quote: '日本に逃げても無駄だよ\nどこに逃げても無駄だよ',
      translation: '即使逃到日本也没用哦；无论逃到哪里都没用哦。', readAloud: false,
    },
    entries: [
      entry('escape-to-japan-in-vain', '日本に逃げても無駄だよ', 'にほんににげてもむだだよ', '即使逃到日本也没用哦', '「日本に」给出具体去向；「ても」表示即使这样，结果仍不改变。'),
      entry('escape-anywhere-in-vain', 'どこに逃げても無駄だよ', 'どこににげてもむだだよ', '无论逃到哪里都没用哦', '「どこに〜ても」把范围扩大为任何地点。'),
    ],
    points: [
      '「〜ても」表示让步；前接「どこ／誰／何」等疑问词时，可表达无论哪里、无论谁、无论做什么。',
      '「無駄だ」表示做了也没有效果；「よ」把判断告诉对方。截图句子根据语境可能带警告或威胁，并非普通的建议用语。',
    ],
    examples: [
      example('button-without-power', '電源が入っていなければ、ボタンを押しても無駄です。', '没有接通电源的话，按按钮也没有用。'),
      example('same-answer-anywhere', 'どこに問い合わせても、同じ回答でした。', '无论向哪里询问，得到的都是同样的答复。'),
    ],
  },
  {
    id: 'live-2026-11-18-demo-even-and-anyone', title: '子供でも・誰でも',
    subtitle: '「连……都」与「无论谁、任何人」', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3367.jpeg／IMG_3373.jpeg',
      quote: '子供でもわかるよ\n誰でもわかるよ',
      translation: '连孩子都懂哦；谁都懂哦。', readAloud: false,
    },
    entries: [
      entry('even-children-understand', '子供でもわかるよ', 'こどもでもわかるよ', '连孩子都懂哦', '举出孩子作为例子，强调容易理解；直接对别人说可能显得轻视。'),
      entry('anyone-understands', '誰でもわかるよ', 'だれでもわかるよ', '谁都懂哦', '「誰でも」表示任何人，不限定某个人。'),
    ],
    points: [
      '「子供でも」以一个通常被认为条件较弱的例子作强调，相当于“连孩子都……”。',
      '「誰でも」是疑问词加「でも」，表示任何人；同类表达有「何でも」「いつでも」「どこでも」。',
      '工作沟通中说明容易理解时，可以用「初心者にもわかりやすい」等表达，避免让对方感到被贬低。',
    ],
    examples: [
      example('beginners-can-understand', 'この説明なら、初心者でも理解できます。', '按照这份说明，即使是初学者也能理解。'),
      example('park-open-to-everyone', 'この公園は誰でも利用できます。', '这个公园任何人都可以使用。'),
    ],
  },
  {
    id: 'live-2026-11-18-strange-events', title: 'おかしなことが起こる',
    subtitle: '描述奇怪的事件发生', category: 'transitivity',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3367.jpeg／IMG_3373.jpeg',
      quote: 'おかしなことが起こる', translation: '发生奇怪的事。', readAloud: false,
    },
    entries: [
      entry('strange-things-happen', 'おかしなことが起こる', 'おかしなことがおこる', '发生奇怪的事', '「起こる」是自动词，发生的事情用「が」标记。'),
    ],
    points: [
      '「おかしな＋名词」表示奇怪的、不寻常的，也可能表示滑稽的，具体含义要看语境。可说「おかしいこと」，不说「おかしいなこと」。',
      '「事件が起こる」着眼于事情发生；「事件を起こす」着眼于某人引起事情。这里使用自动词「起こる」。',
    ],
    examples: [
      example('strange-after-setting-change', '設定を変えてから、おかしなことが起こるようになった。', '修改设置后，开始出现奇怪的情况。'),
      example('unexpected-during-meeting', '会議の途中で、思いがけないことが起こった。', '会议中途发生了意想不到的事。'),
    ],
  },
  {
    id: 'live-2026-11-18-following-direction', title: '私についていこう',
    subtitle: '保留笔记原文，辨析「ついていく／ついてくる」', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3367.jpeg／IMG_3373.jpeg',
      quote: '私についていこう',
      translation: '原笔记写法：跟着我去吧（普通直接对话中人称与移动方向不自然，需结合语境）。', readAloud: false,
    },
    entries: [
      entry('follow-me-original-note', '私についていこう', 'わたしについていこう', '原笔记：跟着我去吧（普通直接对话中不自然）', '两张截图均明确写「いこう」，按原文保留。向对方说“跟我来”通常用「私についてきて」或「私についておいで」。'),
    ],
    points: [
      '「ついていく」表示跟随某人去；「ついてくる」以说话者一方为参照，表示跟随过来。',
      '「いこう」是「いく」的意志形，可表示自己的意图或邀请共同动作。原句同时把「私」设为被跟随的人，作为普通的“跟我来”指令不自然；截图没有提供足够上下文，保留原文并另外示范自然说法。',
    ],
    examples: [
      example('follow-me-to-reception', '私についてきてください。受付まで案内します。', '请跟我来。我带您去前台。'),
      example('follow-him-who-knows-way', '道を知っている彼についていこう。', '跟着认识路的他走吧。'),
    ],
  },
  {
    id: 'live-2026-11-18-ikenai-response', title: 'それはいけないね',
    subtitle: '表示不妥、劝阻或对麻烦情况的反应', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3367.jpeg／IMG_3373.jpeg',
      quote: 'それはいけないね', translation: '那可不行啊；那可不好。', readAloud: false,
    },
    entries: [
      entry('that-is-not-good', 'それはいけないね', 'それはいけないね', '那可不行啊；那可不好', '根据语境，既能劝阻不妥的行为，也能对令人担忧的情况作出反应。'),
    ],
    points: [
      '「いけない」这里评价某事不妥、不可以，不是「行けない（去不了）」的意思。',
      '「ね」可让语气带有共感或向对方确认，但整句仍可能含批评；语气强弱要结合说话方式和关系判断。',
    ],
    examples: [
      example('do-not-read-notebook-secretly', '友達のノートを勝手に見たの？それはいけないね。', '你擅自看了朋友的笔记？那可不行啊。'),
      example('missed-submission-deadline', '提出期限を過ぎてしまったの？それはいけないね。先生に相談しよう。', '已经错过提交期限了吗？那可不好，去找老师商量一下吧。'),
    ],
  },
  {
    id: 'live-2026-11-18-conditional-advice', title: '～たければ・～ばいい',
    subtitle: '想做的话就去做：条件、建议与许可', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3367.jpeg／IMG_3373.jpeg',
      quote: '走りたければ、走ればいいんだよ\nばいい\n食べたければ、食べればいい',
      translation: '想跑的话，跑就好了；“……就好”的句型片段；想吃的话，吃就好了。', readAloud: false,
    },
    entries: [
      entry('run-if-you-want', '走りたければ、走ればいいんだよ', 'はしりたければ、はしればいいんだよ', '想跑的话，跑就好了', '「走りたい→走りたければ」；「走る→走れば」。'),
      entry('eat-if-you-want', '食べたければ、食べればいい', 'たべたければ、たべればいい', '想吃的话，吃就好了', '「食べたい→食べたければ」；「食べる→食べれば」。'),
      entry('ba-ii-pattern', '～ばいい', 'ばいい', '……就好、……就可以', '原图写「ばいい」，是句型速记；实际使用时需要前接条件形。'),
    ],
    points: [
      '愿望「〜たい」按イ形容词方式变化，条件形为「〜たければ」：読みたい→読みたければ。',
      '「動詞ば形＋いい」给出一种可行做法、建议或许可；「〜ばいいんだよ」增加解释、告诉对方的语气。',
      '同一结构既可能是温和鼓励，也可能显得不耐烦，例如“那你去做不就好了”；不能只凭句型判断态度。',
    ],
    examples: [
      example('take-break-if-tired', '疲れているなら、少し休めばいいですよ。', '累了的话，稍微休息一下就好。'),
      example('ask-teacher-if-unclear', 'わからなければ、先生に聞けばいい。', '不明白的话，问老师就好了。'),
      example('read-book-if-interested', 'この本を読みたければ、借りていけばいいよ。', '想读这本书的话，借走就好啦。'),
    ],
  },
  {
    id: 'live-2026-11-18-manner-and-malfunction', title: 'こんな具合に・不具合・故障',
    subtitle: '说明方式，以及区分问题与设备故障', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3373.jpeg',
      quote: 'こんな具合に\n不具合＝故障',
      translation: '像这样、以这样的方式；不正常、问题＝故障（笔记的近义对照，实际范围并非完全相同）。', readAloud: false,
    },
    entries: [
      entry('in-this-manner', 'こんな具合に', 'こんなぐあいに', '像这样、以这样的方式', '这里的「具合」指方式或情况；其他语境也能指身体或事物的状态。'),
      entry('malfunction-defect', '不具合', 'ふぐあい', '问题、缺陷、运作不正常', '范围较广，软件问题或操作不顺也可叫不具合。'),
      entry('equipment-breakdown', '故障', 'こしょう', '故障、机器设备不能正常工作', '常用「故障する」「故障中」。'),
    ],
    points: [
      '「こんな具合に」可在示范动作、说明步骤时使用，后接具体做法。',
      '原笔记用等号对照「不具合」「故障」，但二者不能在所有场合互换；「不具合」常涵盖比明确损坏更广的问题。',
      '例如画面布局显示不正常可说「表示の不具合」；电梯不能正常运行可说「エレベーターの故障」。',
    ],
    examples: [
      example('fold-paper-like-this', 'こんな具合に紙を二つに折ってください。', '请像这样把纸对折。'),
      example('fix-display-defect', '画面の表示に不具合があり、修正しています。', '画面显示存在问题，正在修复。'),
      example('elevator-breakdown', 'エレベーターが故障しているので、階段を使います。', '电梯发生故障，所以走楼梯。'),
    ],
  },
  {
    id: 'live-2026-11-18-only-said', title: '～と言っただけだ',
    subtitle: '限定自己说过的话，解释或辩解', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3373.jpeg',
      quote: '○○と言っただけだ', translation: '只是说了“某某”而已；○○是引用内容的占位符。', readAloud: false,
    },
    entries: [
      entry('only-said-pattern', '～と言っただけだ', 'といっただけだ', '只是说了……而已', '原图用「○○」表示引用内容；词条用波浪线标明句型，不补猜原话。'),
    ],
    points: [
      '「と」标记引用内容，「言った」表示说过，「だけだ」把范围限定为“只是如此”。',
      '句子常用于澄清自己没有别的意思或没有做更多事情，也可能带辩解语气；礼貌表达可用「と言っただけです」。',
    ],
    examples: [
      example('only-said-busy', '私は「今日は忙しい」と言っただけです。断ったわけではありません。', '我只是说“今天很忙”，并没有拒绝。'),
      example('only-thanked', '彼には「ありがとう」と言っただけだ。', '我只是对他说了声“谢谢”。'),
    ],
  },
  {
    id: 'live-2026-11-18-queue-cutting', title: '列に割り込む・割り込みはいけない',
    subtitle: '插队的动作与劝阻表达', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3373.jpeg',
      quote: '列に割り込む\n割り込みはいけない', translation: '插队；不可以插队。', readAloud: false,
    },
    entries: [
      entry('cut-into-line', '列に割り込む', 'れつにわりこむ', '插队', '「列に」指出插入的队列；「割り込む」也能用于插入别人的谈话等。'),
      entry('no-queue-cutting', '割り込みはいけない', 'わりこみはいけない', '不可以插队', '「割り込み」是名词；动词形式的禁止可说「割り込んではいけない」。'),
    ],
    points: [
      '「割り込む」描述动作，「割り込み」把动作名词化，可作句子的主题。',
      '提醒陌生人排队时，可以用「列の最後尾にお並びください」等说法，直接说明对方应怎么做。',
    ],
    examples: [
      example('someone-cut-into-line', '順番を待っていたら、前に人が割り込んできた。', '我正在等候，结果有人插到了前面。'),
      example('join-end-of-line', '皆さんお待ちですので、列の最後尾にお並びください。', '大家都在等候，请到队尾排队。'),
    ],
  },
  {
    id: 'live-2026-11-18-rough-call-aside', title: 'ツラを貸せ・顔を貸せ',
    subtitle: '要求对方过来一下的粗鲁说法', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3373.jpeg',
      quote: 'ツラを貸せ＝顔を貸せ', translation: '过来一下、跟我来一下；命令式，可能带威吓。', readAloud: false,
    },
    entries: [
      entry('rough-give-me-your-face', 'ツラを貸せ', 'つらをかせ', '过来一下、跟我来一下（粗鲁）', '「ツラ」是「顔」的粗俗说法，「貸せ」是命令形。'),
      entry('come-aside-command', '顔を貸せ', 'かおをかせ', '过来一下、让我跟你谈谈（命令式）', '不是字面借脸；要结合人物关系判断是否带威吓。'),
    ],
    points: [
      '「顔を貸す」在这里表示应邀或被叫去见面、谈话；「貸せ」把它变成强硬命令。',
      '「ツラ」进一步增加粗鲁语气。课堂上理解原句即可；日常请别人谈一谈可说「少しお話しできますか」。',
    ],
    examples: [
      example('polite-short-talk', '少しお話しできますか。確認したいことがあります。', '可以聊一会儿吗？我有件事想确认。'),
      example('narrate-rough-call', '映画の登場人物が「ちょっと顔を貸せ」と言って、相手を呼び出した。', '电影中的人物说了句“过来一下”，把对方叫了出去。'),
    ],
  },
  {
    id: 'live-2026-11-18-ask-for-leniency', title: '勘弁してください',
    subtitle: '请求宽恕或请对方别再为难', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3373.jpeg',
      quote: '勘弁してください', translation: '请饶了我；请原谅；请别为难我。', readAloud: false,
    },
    entries: [
      entry('please-spare-me', '勘弁してください', 'かんべんしてください', '请饶了我、请原谅；请别为难我', '既能求情，也能表达某种要求实在受不了；译法依上下文决定。'),
    ],
    points: [
      '「勘弁」表示原谅、宽恕；「勘弁してください」也常用于请求对方停止令人困扰的行为。',
      '虽有「ください」，整句仍可能带强烈情绪。正式道歉或拒绝时，往往需要直接说明原因，并选择更具体、礼貌的说法。',
    ],
    examples: [
      example('spare-this-once', '今回だけは勘弁してください。次から気をつけます。', '这次请饶了我吧，下次我会注意。'),
      example('please-stop-teasing', 'その話でからかうのは、もう勘弁してください。', '请别再拿那件事取笑我了。'),
    ],
  },
  {
    id: 'live-2026-11-18-effectiveness-and-winning', title: '効き目がある・勝ち目がない',
    subtitle: '效果和获胜的可能性', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3373.jpeg',
      quote: '効き目がある\n勝ち目がない', translation: '有效果；没有胜算。', readAloud: false,
    },
    entries: [
      entry('has-an-effect', '効き目がある', 'ききめがある', '有效果、起作用', '「効き目」侧重药物、措施、劝说等产生的效果。'),
      entry('no-chance-of-winning', '勝ち目がない', 'かちめがない', '没有胜算', '「勝ち目」指获胜的可能性，不是眼睛。'),
    ],
    points: [
      '两个词虽然都以「目」结尾，意思要分别记忆：「効き目」是效果，「勝ち目」是胜算。',
      '「ある／ない」表示有无，也可说「効き目が強い」「勝ち目は少ない」，进一步描述程度。',
    ],
    examples: [
      example('reminder-was-effective', 'その注意書きには効き目があり、置き忘れが減った。', '那张提示起了作用，遗忘物品的情况减少了。'),
      example('no-win-without-plan', '準備をしないままでは、強い相手に勝ち目がない。', '不做准备的话，面对强劲对手就没有胜算。'),
    ],
  },
  {
    id: 'live-2026-11-18-seize-miss-overlook', title: 'チャンスをつかむ・逃す・見逃す',
    subtitle: '抓住机会、错失机会与忽略某事', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3373.jpeg',
      quote: 'チャンスをつかむ\nチャンスを逃す\n悪いことを見逃す',
      translation: '抓住机会；错失机会；没有发现坏事，或对坏事放过不究。', readAloud: false,
    },
    entries: [
      entry('seize-opportunity', 'チャンスをつかむ', 'チャンスをつかむ', '抓住机会', '「つかむ」也写作「掴む」。'),
      entry('miss-opportunity', 'チャンスを逃す', 'チャンスをのがす', '错失机会', '这里通常读「のがす」，与抓住机会相对。'),
      entry('overlook-wrongdoing', '悪いことを見逃す', 'わるいことをみのがす', '没有发现坏事；对坏事放过不究', '「見逃す」既能表示无意漏看，也能表示明知而放过，原句不能唯一确定是哪一种。'),
    ],
    points: [
      '「つかむ」把握眼前机会，「逃す」未能把握机会。对象是「チャンス」时通常读「のがす」。',
      '「見逃す」含“看”这一层意思，可指没注意到，也可指故意不追究；需从上下文判断是否有意。',
    ],
    examples: [
      example('seize-learning-chance', '新しい技術を学べるチャンスをつかみたい。', '我想抓住学习新技术的机会。'),
      example('missed-application-chance', '締め切りを忘れて、応募のチャンスを逃してしまった。', '忘了截止日期，错失了报名的机会。'),
      example('do-not-overlook-small-errors', '小さなミスも見逃さないように、提出前に確認します。', '为了不漏掉小错误，我会在提交前检查。'),
    ],
  },
  {
    id: 'live-2026-11-18-even-if-failure', title: 'たとえ失敗しても',
    subtitle: '即使结果不理想，后面的意志或判断仍成立', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3373.jpeg',
      quote: 'たとえ失敗しても', translation: '即使失败……；原图未给出后面的结论。', readAloud: false,
    },
    entries: [
      entry('even-if-fail', 'たとえ失敗しても', 'たとえしっぱいしても', '即使失败……', '截图是前半句，保留未完成状态；下面完整句均为原创例句。'),
    ],
    points: [
      '「たとえ〜ても」先设定一种情况，再表示即使如此，后面的判断、意志或结果也不变。',
      '「失敗しても」本身已能表达让步，「たとえ」把假设的意味说得更明确；不是断定一定会失败。',
    ],
    examples: [
      example('try-again-after-failure', 'たとえ失敗しても、原因を調べてもう一度試します。', '即使失败，也会查明原因再试一次。'),
      example('challenge-even-if-difficult', 'たとえ難しくても、自分で考えてみたいです。', '即使很难，我也想先自己思考看看。'),
    ],
  },
  {
    id: 'live-2026-11-18-want-and-want-someone-to', title: 'ほしい・稼ぎたい・稼いでほしい',
    subtitle: '区分想要某物、自己想做与希望别人做', category: 'grammar',
    entries: [
      entry('want-money', 'お金がほしい', 'おかねがほしい', '想要钱', '「Nがほしい」表示想得到某物。'),
      entry('want-someone-to-earn-money', 'お金を稼いでほしい', 'おかねをかせいでほしい', '希望对方挣钱', '挣钱的人由上下文确定，需要明说时可用「相手に」。'),
      entry('want-someone-to-do', '～てほしい', 'てほしい', '希望别人做……；希望某种情况发生', '接动词て形，如「読んでほしい」「晴れてほしい」。'),
      entry('want-to-earn-money', 'お金を稼ぎたい', 'おかねをかせぎたい', '自己想挣钱', '「Vます形去ます＋たい」表示想做某动作。'),
    ],
    points: [
      '「お金がほしい」的对象是钱；「稼ぎたい」希望自己做挣钱这件事；「稼いでほしい」则希望另一个人去挣钱。',
      '希望别人做某事时，常用「人に＋Vてほしい」。也可用于期待某种情况，如「明日は晴れてほしい」。',
      '「～てほしい」直接表达自己的愿望。向上级或不熟悉的人提出请求时，要结合关系调整为「～ていただけますか」等说法。',
    ],
    examples: [
      example('money-rather-than-things', '今は物より、自由に使えるお金がほしい。', '现在比起东西，我更想要能自由支配的钱。'),
      example('earn-for-new-computer', '新しいパソコンを買いたいので、もう少しお金を稼ぎたい。', '我想买一台新电脑，所以想再多挣点钱。'),
      example('wish-son-earns-living', '息子には、まず自分で生活費を稼いでほしい。', '我希望儿子先自己挣出生活费。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3373.jpeg', quote: 'お金がほしい\nお金を稼いでほしい\nてほしい 想要对方做\nお金を稼ぎたい', translation: '想要钱；希望对方挣钱；希望对方做；自己想挣钱。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-passive-desire', title: '叩かれたい・縛られたい',
    subtitle: '在被动形后接「たい」，表达希望自己受到某动作', category: 'grammar',
    entries: [
      entry('tap-or-hit', '叩く', 'たたく', '拍、敲、打', '具体力度和含义取决于对象，如「肩を叩く」「ドアを叩く」。'),
      entry('want-to-be-tapped', '叩かれたい', 'たたかれたい', '想被拍打或打；希望自己承受这一动作', '叩く → 叩かれる（被动）→ 叩かれたい。具体是轻拍还是打，要看动作对象与情境。'),
      entry('tie-or-restrict', '縛る', 'しばる', '捆绑；约束、束缚', '既可指用绳子捆绑，也可比喻规则等限制行动。'),
      entry('want-to-be-bound', '縛られたい', 'しばられたい', '想被捆绑；希望受到约束', '縛る → 縛られる（被动）→ 縛られたい；具体意思依语境判断。'),
    ],
    points: [
      '这里先把动词变成被动形，再接「たい」。「叩きたい」是自己想拍打别人或某物，「叩かれたい」是希望自己成为动作承受者。',
      '将「受身＋たい」中的「たい」改成「たくない」即可表示不希望受到该动作，例如「縛られたくない」。同类表达还有「褒められたい」。',
      '「叩く」不一定指殴打，「縛る」也不一定指实际捆绑；应连同动作对象与场景理解。',
    ],
    examples: [
      example('want-pat-after-victory', '子供のころは、試合に勝って父に肩を叩かれたいと思っていた。', '小时候，我希望赢得比赛后能得到父亲拍肩鼓励。'),
      example('not-bound-by-time', '時間に縛られたくないので、予定を詰めすぎないようにしている。', '我不想受时间束缚，所以尽量不把日程排得太满。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3373.jpeg', quote: '叩く 叩かれたい\n縛る 縛られたい', translation: '拍、敲、打／想被拍打；捆绑、约束／想被捆绑或约束。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-wanted-action-relative-clause', title: '会ってほしい人・読んでほしい本',
    subtitle: '用「てほしい」修饰名词，再用「んだけど」引出后话', category: 'grammar',
    entries: [
      entry('girl-i-want-you-to-meet', '会ってほしい女の子がいるんだけど', 'あってほしいおんなのこがいるんだけど', '有个女孩想让你见一见……', '这是常见的语境解释；谁与谁见面还要结合前后文判断。'),
      entry('book-i-want-you-to-read', '読んでほしい本があるんだけど', 'よんでほしいほんがあるんだけど', '有本书想让你读一读……'),
    ],
    points: [
      '「Vてほしい」可以直接修饰名词。「読んでほしい本」中的「本」是阅读对象；「会ってほしい女の子」常理解为希望对方见的女孩，谁与谁见面仍需上下文确认。',
      '「人がいる／物がある」分别表示人或物的存在。原句中的动作执行者省略，理解时要结合会话对象。',
      '句末「んだけど」可先交代情况，等对方回应，或自然地引出请求；不必每次都翻译成转折的“但是”。',
    ],
    examples: [
      example('introduce-someone-next-weekend', '会ってほしい女の子がいるんだけど、今度の週末に紹介してもいい？', '有个女孩想让你认识一下，这个周末介绍给你可以吗？'),
      example('lend-recommended-book', 'ぜひ読んでほしい本があるんだけど、あとで貸してもいい？', '有本书很想让你读一读，过会儿借给你可以吗？'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3373.jpeg', quote: '会ってほしい女の子がいるんだけど\n読んでほしい本があるんだけど', translation: '有个女孩想让你见一见……；有本书想让你读一读……。', readAloud: false },
  },
  {
    id: 'live-2026-11-18-name-plus-desu-ga', title: '坂本ですが。',
    subtitle: '自报姓名后，用「が」为接下来的话留出空间', category: 'grammar',
    entries: [
      entry('sakamoto-introduction', '坂本ですが。', 'さかもとですが。', '我是坂本……', '按会话表达理解：先报上姓名，再等回应或接着说明来意。截图仅有这句话，不能单凭它确认作品标题。'),
    ],
    points: [
      '「Nですが」可以用作开场或铺垫，如打电话时先说「坂本ですが」。此时「が」不一定表示强烈转折。',
      '对方知道你是谁时，简短报姓名即可承接话题；正式初次自我介绍可用「坂本と申します」。',
    ],
    examples: [
      example('sakamoto-calling-tanaka', '坂本ですが、田中さんはいらっしゃいますか。', '我是坂本，请问田中先生／女士在吗？'),
      example('sakamoto-reservation-check', '昨日予約した坂本ですが、時間を変更できますか。', '我是昨天预约的坂本，请问可以更改时间吗？'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3373.jpeg', quote: '坂本ですが。', translation: '我是坂本……。', readAloud: false },
  },
]
