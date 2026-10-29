export interface LiveReactionEntry {
  id: string
  legacyAudioRef?: string
  expression: string
  reading: string
  meaning: string
  note?: string
}
export interface LiveReactionExample {
  id: string
  legacyAudioRef?: string
  japanese: string
  chinese: string
}
export interface LiveReactionGroup {
  id: string
  title: string
  subtitle: string
  entries: LiveReactionEntry[]
  points: string[]
  examples: LiveReactionExample[]
}
const entry = (id: string, legacyAudioRef: string, expression: string, reading: string, meaning: string, note?: string): LiveReactionEntry => ({ id, legacyAudioRef, expression, reading, meaning, note })

export const liveReactionDate = '2026-09-28'
// Independent supplementary notes: never imported into daily lessons or the IT new-word index.
// The three overlapping screenshots contain 64 distinct expressions. The two general
// nouns also discussed in group 15 are referenced from group 6 rather than duplicated.
export const liveReactionGroups: LiveReactionGroup[] = [
  {
    id: 'live-2026-09-28-endurance', title: '「无法忍受 / 难以……」系列', subtitle: 'たまらない・我慢できない・～がたい',
    entries: [
      entry("live-2026-09-28-endurance-entry-01", "entry/たまらない", 'たまらない', 'たまらない', '受不了、不得了', '也能表示强烈的正面感情，并不只用于痛苦。'),
      entry("live-2026-09-28-endurance-entry-02", "entry/我慢できない", '我慢できない', 'がまんできない', '无法忍耐'),
      entry("live-2026-09-28-endurance-entry-03", "entry/耐えられない", '耐えられない', 'たえられない', '无法承受、忍受不了'),
      entry("live-2026-09-28-endurance-entry-04", "entry/耐え難い", '耐え難い', 'たえがたい', '难以忍受', '较书面、郑重。'),
      entry("live-2026-09-28-endurance-entry-05", "entry/別れがたい", '別れがたい', 'わかれがたい', '难舍难分、难以分别'),
    ],
    points: ['接续：动词ます形去掉ます＋がたい。表示心理上、性质上很难做到，不是单纯的技能不足。', '与～にくい相比，～がたい常用于难以接受、相信、忘记等心理判断：信じがたい事実／許しがたい行為／忘れがたい思い出。'],
    examples: [{id: "live-2026-09-28-endurance-example-01", legacyAudioRef: "example/0",  japanese: '長年暮らした町は離れがたい。', chinese: '很难离开生活了多年的小镇。' }, {id: "live-2026-09-28-endurance-example-02", legacyAudioRef: "example/1",  japanese: 'うれしくてたまらない。', chinese: '高兴得不得了。' }],
  },
  {
    id: 'live-2026-09-28-questions', title: '询问对方想法、状况', subtitle: '用「いったい」加强“到底、究竟”的语气',
    entries: [
      entry("live-2026-09-28-questions-entry-01", "entry/いったいどういうこと？", 'いったいどういうこと？', 'いったいどういうこと', '到底怎么回事？'),
      entry("live-2026-09-28-questions-entry-02", "entry/いったいどういうつもり？", 'いったいどういうつもり？', 'いったいどういうつもり', '你到底什么意思？／到底打算干什么？'),
      entry("live-2026-09-28-questions-entry-03", "entry/これからどうするの？", 'これからどうするの？', 'これからどうするの', '接下来怎么办？'),
      entry("live-2026-09-28-questions-entry-04", "entry/どうしたの？", 'どうしたの？', 'どうしたの', '怎么了？'),
      entry("live-2026-09-28-questions-entry-05", "entry/そこまで追い込まれたか", 'そこまで追い込まれたか', 'そこまでおいこまれたか', '已经被逼到那种地步了吗？'),
      entry("live-2026-09-28-questions-entry-06", "entry/教えてくれないか", '教えてくれないか', 'おしえてくれないか', '能不能告诉我？'),
    ],
    points: ['いったい常与疑问词搭配：いったい誰が／何が／どうして。', 'どういうつもり？可能带责问语气；教えてくれないか较随意，不宜直接当作对客户的敬语。'],
    examples: [{id: "live-2026-09-28-questions-example-01", legacyAudioRef: "example/0",  japanese: 'いったい何があったの？', chinese: '究竟发生了什么？' }, {id: "live-2026-09-28-questions-example-02", legacyAudioRef: "example/1",  japanese: '詳しく教えていただけますか。', chinese: '可以请您详细告诉我吗？（较礼貌）' }],
  },
  {
    id: 'live-2026-09-28-omoikiri', title: '「思い切り」系列', subtitle: '尽情地、用尽力气；果断与犹豫',
    entries: [
      entry("live-2026-09-28-omoikiri-entry-01", "entry/ぼやっとしている", 'ぼやっとしている', 'ぼやっとしている', '发呆、迷迷糊糊'),
      entry("live-2026-09-28-omoikiri-entry-02", "entry/思い切り殴る", '思い切り殴る', 'おもいきりなぐる', '用力打、狠狠地揍', '按原图校正：图中是「殴る」，不是之前转录的「叱る」。'),
      entry("live-2026-09-28-omoikiri-entry-03", "entry/思いっきり", '思いっきり', 'おもいっきり', '尽情地、狠狠地', '思い切り的强调口语形式。'),
      entry("live-2026-09-28-omoikiri-entry-04", "entry/思い切りがいい", '思い切りがいい', 'おもいきりがいい', '果断、下得了决心'),
      entry("live-2026-09-28-omoikiri-entry-05", "entry/思い切りが悪い", '思い切りが悪い', 'おもいきりがわるい', '犹豫不决、不果断'),
      entry("live-2026-09-28-omoikiri-entry-06", "entry/いつまでも", 'いつまでも', 'いつまでも', '一直、永远；老是', '褒贬取决于上下文。'),
    ],
    points: ['思い切り作副词时表示“尽情地／尽全力”；作名词时可表示“决断、下决心”。', '思い切り叱る也可理解为“狠狠训斥”，但它不是这张图里的原句。'],
    examples: [{id: "live-2026-09-28-omoikiri-example-01", legacyAudioRef: "example/0",  japanese: '休日は思い切り遊ぶ。', chinese: '休息日尽情地玩。' }, {id: "live-2026-09-28-omoikiri-example-02", legacyAudioRef: "example/1",  japanese: 'いつまでもお元気で。', chinese: '愿您一直身体健康。' }],
  },
  {
    id: 'live-2026-09-28-obligation', title: '「必须做」的三个口语形式', subtitle: 'なきゃ・なくちゃ・ないと',
    entries: [
      entry("live-2026-09-28-obligation-entry-01", "entry/頑張らなきゃ", '頑張らなきゃ', 'がんばらなきゃ', '得努力才行', '～なければ（ならない／いけない）→ ～なきゃ'),
      entry("live-2026-09-28-obligation-entry-02", "entry/頑張らなくちゃ", '頑張らなくちゃ', 'がんばらなくちゃ', '得努力才行', '～なくては（ならない／いけない）→ ～なくちゃ'),
      entry("live-2026-09-28-obligation-entry-03", "entry/頑張らないと", '頑張らないと', 'がんばらないと', '得努力才行', '～ないと（いけない）→ ～ないと'),
    ],
    points: ['三种都能在句尾省略后半部分，用来表达义务或提醒自己。', '这是“句尾表示义务”时的解释；在完整句子中，～ないと等也可能只是条件表达，需要看后文。'],
    examples: [{id: "live-2026-09-28-obligation-example-01", legacyAudioRef: "example/0",  japanese: 'もう行かなきゃ。', chinese: '我得走了。' }, {id: "live-2026-09-28-obligation-example-02", legacyAudioRef: "example/1",  japanese: '明日までに提出しないと。', chinese: '必须在明天之前提交。' }],
  },
  {
    id: 'live-2026-09-28-recovery', title: '情绪与重新振作', subtitle: '～たって・だって・気を取り直す',
    entries: [
      entry("live-2026-09-28-recovery-entry-01", "entry/くよくよしたって", 'くよくよしたって', 'くよくよしたって', '就算一直烦恼……', '～たって是～ても对应的口语表达。'),
      entry("live-2026-09-28-recovery-entry-02", "entry/子供だってわかる", '子供だってわかる', 'こどもだってわかる', '连小孩都知道', '这里的だって表示“连……也”，近似でも。'),
      entry("live-2026-09-28-recovery-entry-03", "entry/気を取り直す", '気を取り直す', 'きをとりなおす', '重新振作、调整心情'),
      entry("live-2026-09-28-recovery-entry-04", "entry/明るく暮らす", '明るく暮らす', 'あかるくくらす', '开朗、乐观地生活'),
    ],
    points: ['动词的～たって／～だって与名词后的だって要分开理解：くよくよしたって＝くよくよしても；子供だって＝子供でも。'],
    examples: [{id: "live-2026-09-28-recovery-example-01", legacyAudioRef: "example/0",  japanese: 'くよくよしたって仕方ない。気を取り直して、もう一度やってみよう。', chinese: '一直烦恼也没有用。重新振作，再试一次吧。' }],
  },
  {
    id: 'live-2026-09-28-nouns', title: '一般词汇', subtitle: '幻想、舞台与外来语',
    entries: [
      entry("live-2026-09-28-nouns-entry-01", "entry/ファンタジー", 'ファンタジー', 'ファンタジー', '幻想、奇幻；奇幻作品'),
      entry("live-2026-09-28-nouns-entry-02", "entry/まぼろしの舞台（幻の舞台）", 'まぼろしの舞台（幻の舞台）', 'まぼろしのぶたい', '幻影般的舞台；未实现、难得一见或已不复存在的舞台', '具体译法依上下文决定，不能一律译成“梦幻般的”。'),
    ],
    points: ['先入観（せんにゅうかん）＝先入为主的观念；インスピレーション＝灵感。这两项统一收录在第15组，避免重复词条。'],
    examples: [{id: "live-2026-09-28-nouns-example-01", legacyAudioRef: "example/0",  japanese: 'ファンタジー小説を読む。', chinese: '阅读奇幻小说。' }],
  },
  {
    id: 'live-2026-09-28-transitivity', title: '自动词 vs 他动词', subtitle: '見つかる／見つける・捕まる／捕まえる',
    entries: [
      entry("live-2026-09-28-transitivity-entry-01", "entry/犯人が見つかる", '犯人が見つかる', 'はんにんがみつかる', '犯人被找到了', '見つかる：自动词；犯人是主语。'),
      entry("live-2026-09-28-transitivity-entry-02", "entry/犯人を見つける", '犯人を見つける', 'はんにんをみつける', '找到犯人', '見つける：他动词；犯人是宾语。'),
      entry("live-2026-09-28-transitivity-entry-03", "entry/犯人が捕まる", '犯人が捕まる', 'はんにんがつかまる', '犯人被抓住', '捕まる：自动词。'),
      entry("live-2026-09-28-transitivity-entry-04", "entry/犯人を捕まえる", '犯人を捕まえる', 'はんにんをつかまえる', '抓住犯人', '捕まえる：他动词。'),
      entry("live-2026-09-28-transitivity-entry-05", "entry/捕まえるのを手伝う", '捕まえるのを手伝う', 'つかまえるのをてつだう', '帮忙抓住（他）', '图中原句「捕まえるの手伝う」省略了助词を；这里保留完整形式便于学习。'),
    ],
    points: ['这两组的核心搭配是「が＋自动词／を＋他动词」。中文译文可能使用“被”，但日语自动词本身并不是被动语态。', '「动词普通形＋の」将动作名词化；「捕まえるのを」整体作手伝う的宾语。'],
    examples: [{id: "live-2026-09-28-transitivity-example-01", legacyAudioRef: "example/0",  japanese: '鍵が見つかった。／鍵を見つけた。', chinese: '钥匙找到了。／（我）找到了钥匙。' }],
  },
  {
    id: 'live-2026-09-28-communication', title: '人际交流类表达', subtitle: '调侃、讥讽、提醒与「二度と～ない」',
    entries: [
      entry("live-2026-09-28-communication-entry-01", "entry/私語を慎む", '私語を慎む', 'しごをつつしむ', '避免私下交谈、不要闲聊', '常用于课堂、会议等需要安静的场合。'),
      entry("live-2026-09-28-communication-entry-02", "entry/からかう", 'からかう', 'からかう', '戏弄、调侃'),
      entry("live-2026-09-28-communication-entry-03", "entry/揶揄される", '揶揄される', 'やゆされる', '被嘲弄、被讥讽'),
      entry("live-2026-09-28-communication-entry-04", "entry/嫌味を言う", '嫌味を言う', 'いやみをいう', '说挖苦人的话'),
      entry("live-2026-09-28-communication-entry-05", "entry/聞いて驚くなよ", '聞いて驚くなよ', 'きいておどろくなよ', '听了别吃惊啊', '动词辞书形＋な：禁止，语气较强。'),
      entry("live-2026-09-28-communication-entry-06", "entry/落ち着いて聞けよ", '落ち着いて聞けよ', 'おちついてきけよ', '冷静下来听我说', '聞け是聞く的命令形，不适合直接用于客户沟通。'),
      entry("live-2026-09-28-communication-entry-07", "entry/二度と来られない", '二度と来られない', 'にどとこられない', '再也不能来了', '来られない在这里按可能形理解；不是“再也不要来”的命令。'),
      entry("live-2026-09-28-communication-entry-08", "entry/私に顔を見せる", '私に顔を見せる', 'わたしにかおをみせる', '来见我；把脸给我看', '需根据场景判断是露面还是字面上的展示脸部。'),
    ],
    points: ['二度と～ない是固定搭配，表示“再也不……”。注意不能把可能否定来られない与禁止来るな混同。'],
    examples: [{id: "live-2026-09-28-communication-example-01", legacyAudioRef: "example/0",  japanese: '二度と同じ失敗はしない。', chinese: '再也不犯同样的错误。' }, {id: "live-2026-09-28-communication-example-02", legacyAudioRef: "example/1",  japanese: '落ち着いて聞いてください。', chinese: '请冷静地听我说。（较礼貌）' }],
  },
  {
    id: 'live-2026-09-28-embarrassment', title: '「照れ」相关', subtitle: '照れる・照れくさい・ツンデレ',
    entries: [
      entry("live-2026-09-28-embarrassment-entry-01", "entry/照れる", '照れる', 'てれる', '害羞、不好意思', '动词。'),
      entry("live-2026-09-28-embarrassment-entry-02", "entry/ツンデレ", 'ツンデレ', 'ツンデレ', '傲娇', '外表冷淡或嘴硬，但也会流露好感的角色、表现类型。'),
      entry("live-2026-09-28-embarrassment-entry-03", "entry/照れくさい", '照れくさい', 'てれくさい', '感到难为情、不好意思', 'い形容词。'),
    ],
    points: ['照れる描述害羞这一反应；照れくさい描述“觉得难为情”的感受。ツンデレ不是两者的同义词。'],
    examples: [{id: "live-2026-09-28-embarrassment-example-01", legacyAudioRef: "example/0",  japanese: '褒められると照れる。', chinese: '被夸奖就会不好意思。' }, {id: "live-2026-09-28-embarrassment-example-02", legacyAudioRef: "example/1",  japanese: '面と向かってお礼を言うのは照れくさい。', chinese: '当面道谢有些难为情。' }],
  },
  {
    id: 'live-2026-09-28-reasons', title: '「ものだから / ことだから」', subtitle: '说明原因 vs 根据已知特点作判断',
    entries: [
      entry("live-2026-09-28-reasons-entry-01", "entry/ものだから", 'ものだから', 'ものだから', '因为……', '说明原因，常带解释、辩解的语气。普通形＋ものだから；名词、な形容词常用～なものだから。'),
      entry("live-2026-09-28-reasons-entry-02", "entry/ことだから", 'ことだから', 'ことだから', '以……的性格／作风来看，想必……', '这里重点学习「名词＋のことだから」，根据已知特点推断。'),
    ],
    points: ['～ものだから侧重“解释为什么发生”；～のことだから侧重“依据了解推测会怎样”。', '不要把所有ことだから都套成性格推断。例如「大切なことだから」只是“因为是重要的事”。'],
    examples: [{id: "live-2026-09-28-reasons-example-01", legacyAudioRef: "example/0",  japanese: '道が混んでいたものだから、遅れました。', chinese: '因为路上堵车，所以迟到了。' }, {id: "live-2026-09-28-reasons-example-02", legacyAudioRef: "example/1",  japanese: '真面目な彼のことだから、きっと来る。', chinese: '以他那么认真的性格，肯定会来。' }],
  },
  {
    id: 'live-2026-09-28-ki', title: '「気」系列', subtitle: '気になる／気にする／気に入る',
    entries: [
      entry("live-2026-09-28-ki-entry-01", "entry/気になってならない", '気になってならない', 'きになってならない', '在意得不得了、十分挂心', '～てならない：某种感觉强烈，难以抑制。'),
      entry("live-2026-09-28-ki-entry-02", "entry/気になる", '気になる', 'きになる', '在意、挂心；引起兴趣', '通常用「某事が気になる」，着眼于某事牵动自己的心。'),
      entry("live-2026-09-28-ki-entry-03", "entry/気にする", '気にする', 'きにする', '把……放在心上、介意', '通常用「某事を気にする」，着眼于人在意某事；并非一定是主动、有意选择。'),
      entry("live-2026-09-28-ki-entry-04", "entry/気に入る", '気に入る', 'きにいる', '喜欢、中意', '表示符合自己的喜好，不是“介意”。'),
      entry("live-2026-09-28-ki-entry-05", "entry/お気に入りの服", 'お気に入りの服', 'おきにいりのふく', '喜欢的衣服、最爱穿的衣服'),
    ],
    points: ['結果が気になる／人の評価を気にする／この服が気に入る。搭配助词和含义一起记忆，比只背中文更稳。'],
    examples: [{id: "live-2026-09-28-ki-example-01", legacyAudioRef: "example/0",  japanese: '結果が気になる。', chinese: '我很在意结果。' }, {id: "live-2026-09-28-ki-example-02", legacyAudioRef: "example/1",  japanese: 'そんなことを気にしないで。', chinese: '别在意那种事。' }, {id: "live-2026-09-28-ki-example-03", legacyAudioRef: "example/2",  japanese: 'この服が気に入った。', chinese: '我很中意这件衣服。' }],
  },
  {
    id: 'live-2026-09-28-daily-life', title: '生活表达', subtitle: '取款、提前购买与愚人节',
    entries: [
      entry("live-2026-09-28-daily-life-entry-01", "entry/貯金を下ろす", '貯金を下ろす', 'ちょきんをおろす', '取出存款'),
      entry("live-2026-09-28-daily-life-entry-02", "entry/どっさり買ってきておこう", 'どっさり買ってきておこう', 'どっさりかってきておこう', '事先买一大堆回来吧', 'どっさり＝大量；買ってくる＝买回来；～ておく＝提前做好；～ておこう＝其意向形。'),
      entry("live-2026-09-28-daily-life-entry-03", "entry/エープリルフール", 'エープリルフール', 'エープリルフール', '愚人节', '保留图片表记；也常写作エイプリルフール。'),
    ],
    points: ['～ておく表示为以后提前做好某事，也可表示让某种状态保持着。这里是“买回来备着”。'],
    examples: [{id: "live-2026-09-28-daily-life-example-01", legacyAudioRef: "example/0",  japanese: '来客があるので、飲み物を買っておこう。', chinese: '因为有客人要来，先买好饮料吧。' }],
  },
  {
    id: 'live-2026-09-28-mimetics', title: '「けろっと / ころっと」', subtitle: '若无其事 vs 轻易上当',
    entries: [
      entry("live-2026-09-28-mimetics-entry-01", "entry/叱られてもけろっとしている", '叱られてもけろっとしている', 'しかられてもけろっとしている', '被训斥了也若无其事'),
      entry("live-2026-09-28-mimetics-entry-02", "entry/ころっと騙される", 'ころっと騙される', 'ころっとだまされる', '轻易被骗'),
      entry("live-2026-09-28-mimetics-entry-03", "entry/ころっとひっかかる", 'ころっとひっかかる', 'ころっとひっかかる', '一下子就上当'),
    ],
    points: ['けろっと：若无其事、毫不在意，也可用于不适消失后恢复平常的样子。', 'ころっと：这里与騙される／ひっかかる搭配，表示轻易地就上当。其他语境中可能表示滚动、骤变等，不应一律译成“被骗”。'],
    examples: [{id: "live-2026-09-28-mimetics-example-01", legacyAudioRef: "example/0",  japanese: '冗談を信じて、ころっと騙された。', chinese: '把玩笑当真，轻易就被骗了。' }],
  },
  {
    id: 'live-2026-09-28-other-verbs', title: '其他动词', subtitle: 'ウソをつく・～に化ける',
    entries: [
      entry("live-2026-09-28-other-verbs-entry-01", "entry/ウソをつく", 'ウソをつく', 'うそをつく', '撒谎', '也写作嘘をつく。'),
      entry("live-2026-09-28-other-verbs-entry-02", "entry/悪魔に化ける", '悪魔に化ける', 'あくまにばける', '变成恶魔；装扮成恶魔', '化ける表示变成另一种形态或乔装，具体译法依语境判断。'),
    ],
    points: ['变化后的形态用に标记：狐が人間に化ける。'],
    examples: [{id: "live-2026-09-28-other-verbs-example-01", legacyAudioRef: "example/0",  japanese: '狐が人間に化ける。', chinese: '狐狸变成人。' }],
  },
  {
    id: 'live-2026-09-28-ideas', title: '「思い～」系列', subtitle: '想到、想起、认定与灵感',
    entries: [
      entry("live-2026-09-28-ideas-entry-01", "entry/思い付く / 思いつく", '思い付く / 思いつく', 'おもいつく', '想到、突然想到'),
      entry("live-2026-09-28-ideas-entry-02", "entry/思い出す", '思い出す', 'おもいだす', '想起来、回忆起来'),
      entry("live-2026-09-28-ideas-entry-03", "entry/思い込む", '思い込む', 'おもいこむ', '深信、认定；想当然', '常用于缺乏充分依据却认定某事，但也有坚信的用法。'),
      entry("live-2026-09-28-ideas-entry-04", "entry/思いつき", '思いつき', 'おもいつき', '临时想到的主意、点子', '有时带“未经深思熟虑”的感觉。'),
      entry("live-2026-09-28-ideas-entry-05", "entry/ひらめき", 'ひらめき', 'ひらめき', '灵光一现、突然闪现的想法'),
      entry("live-2026-09-28-ideas-entry-06", "entry/インスピレーション", 'インスピレーション', 'インスピレーション', '灵感、启发'),
      entry("live-2026-09-28-ideas-entry-07", "entry/先入観", '先入観', 'せんにゅうかん', '先入为主的观念、成见'),
    ],
    points: ['思いつく：产生新想法；思い出す：从记忆中重新想起；思い込む：认定或深信某事。', '思いつき侧重临时想到的点子，ひらめき侧重瞬间闪现，インスピレーション侧重灵感或启发。三者有重叠，不是严格互斥分类。'],
    examples: [{id: "live-2026-09-28-ideas-example-01", legacyAudioRef: "example/0",  japanese: 'いいアイデアを思いついた。', chinese: '我想到一个好主意。' }, {id: "live-2026-09-28-ideas-example-02", legacyAudioRef: "example/1",  japanese: '名前を思い出した。', chinese: '我想起名字了。' }, {id: "live-2026-09-28-ideas-example-03", legacyAudioRef: "example/2",  japanese: '彼が犯人だと思い込んでいた。', chinese: '我一直认定他就是犯人。' }],
  },
]
