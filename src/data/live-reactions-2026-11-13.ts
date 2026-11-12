import type { LiveReactionEntry, LiveReactionExample } from './live-reactions.ts'
import type { LiveUnitGroup } from './live-reaction-units.ts'

// Thirteen user-supplied phone-note screenshots, organized on 2026-11-13 JST.
// The screenshots do not establish the lesson date or manga title. Overlap is
// merged within this unit; incomplete notes stay explicitly labelled as such.
// Source blocks quote the visible notes. All example sentences are original.
const entry = (id: string, expression: string, reading: string, meaning: string, note?: string): LiveReactionEntry => ({
  id: `live-2026-11-13-entry-${id}`, expression, reading, meaning, ...(note ? { note } : {}),
})
const example = (id: string, japanese: string, chinese: string): LiveReactionExample => ({
  id: `live-2026-11-13-example-${id}`, japanese, chinese,
})

export const liveNovember13Groups: LiveUnitGroup[] = [
  {
    id: 'live-2026-11-13-excess', title: 'やたらに',
    subtitle: '表达次数、程度过高，或做事不加考虑', category: 'vocabulary',
    entries: [
      entry('excessively', 'やたらに', 'やたらに', '过分地；动不动就；胡乱地', '常带说话人觉得过多、过头或缺乏考虑的评价。'),
    ],
    points: [
      '「やたらに通知が多い」强调数量异常多；「やたらに触る」则可表示随意乱碰。',
      '不能在所有场合都把它当作中性的「とても」。褒贬与具体搭配、语境有关。',
    ],
    examples: [
      example('too-many-notifications', '今日はやたらに通知が多い。', '今天的通知特别多。'),
      example('random-settings', '設定をやたらに変えると、原因がわからなくなる。', '胡乱修改设置，会让人搞不清原因。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3308.PNG', quote: 'やたらに', translation: '过分地；动不动就；胡乱地。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-dawn-and-dusk', title: '明け暮れる・夜が明ける・日が暮れる',
    subtitle: '从天亮天黑到整天忙于某事', category: 'vocabulary',
    entries: [
      entry('absorbed-in-research', '研究に明け暮れる', 'けんきゅうにあけくれる', '日复一日埋头研究'),
      entry('day-breaks', '夜が明ける', 'よがあける', '天亮、黎明到来', '这个搭配中的「夜」读「よ」。'),
      entry('night-falls', '日が暮れる', 'ひがくれる', '天黑、太阳落山'),
      entry('daybreak', '明け方', 'あけがた', '拂晓、黎明时分'),
      entry('midnight-to-dawn', '夜中から明け方にかけて', 'よなかからあけがたにかけて', '从深夜到黎明这段时间'),
    ],
    points: [
      '「Nに明け暮れる」表示日子持续围绕某事度过，如研究、练习或工作。',
      '「夜が明ける」表示黑夜结束；「日が暮れる」表示一天将尽、天色变暗。',
      '「AからBにかけて」表示大致范围，时间边界通常没有「AからBまで」那么严格。',
    ],
    examples: [
      example('research-days', '大学院では、画像認識の研究に明け暮れている。', '在研究生院，我每天都埋头于图像识别研究。'),
      example('dawn-to-dusk-walk', '夜が明けてから出発し、日が暮れる前に宿に着いた。', '天亮后出发，在天黑前到达了旅馆。'),
      example('rain-before-dawn', '夜中から明け方にかけて、雨が降り続いた。', '从深夜到黎明，雨一直下个不停。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3308.PNG／IMG_3310.PNG', quote: '研究に明け暮れる\n夜が明ける\n日が暮れる\n夜中から明け方にかけて\n明け方', translation: '日复一日埋头研究；天亮；天黑；从深夜到黎明；黎明时分。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-no-end', title: 'キリがない・喋り出したらキリがない',
    subtitle: '表达一旦开始就没完没了', category: 'grammar',
    entries: [
      entry('no-end', 'キリがない', 'きりがない', '没有尽头、没完没了', '也可写作「きりがない」。'),
      entry('talk-endlessly', '喋り出したらキリがない', 'しゃべりだしたらきりがない', '一聊起来就没完没了'),
    ],
    points: [
      '「Vます形去ます＋出す」表示开始某动作，如「喋り出す」「降り出す」。',
      '这里的「たら」表示“一旦……”，不是单纯的过去时。「キリがない」可形容话题、工作、要求等没有尽头。',
    ],
    examples: [
      example('endless-drama-talk', '好きなドラマの話は、喋り出したらキリがない。', '聊起喜欢的电视剧，就会没完没了。'),
      example('endless-features', '機能を増やし始めるとキリがないので、まず公開する範囲を決めよう。', '功能一加起来就没完没了，先定好这次发布的范围吧。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3308.PNG／IMG_3310.PNG', quote: '喋り出したらキリがない\nキリがない', translation: '一聊起来就没完没了；没有尽头。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-clean-up', title: 'ゴミを拾う・ゴミ拾い活動・動き回る',
    subtitle: '捡垃圾、清扫活动与四处走动', category: 'vocabulary',
    entries: [
      entry('pick-up-trash', 'ゴミを拾う', 'ごみをひろう', '捡垃圾'),
      entry('cleanup-activity', 'ゴミ拾い活動', 'ごみひろいかつどう', '捡垃圾活动、清洁活动'),
      entry('move-around', '動き回る', 'うごきまわる', '到处活动、来回走动'),
    ],
    points: [
      '「ゴミを拾う」是动词表达；「ゴミ拾い」用「拾う」的连用形构成名词，可接「活動」。',
      '「Vます形去ます＋回る」可以表示到处做某动作。「動き回る」不一定是在绕圈。',
    ],
    examples: [
      example('riverside-cleanup', '週末は川沿いのゴミ拾い活動に参加する。', '周末我要参加河边的捡垃圾活动。'),
      example('pick-up-while-moving', '公園の中を動き回りながら、落ちているゴミを拾った。', '我在公园里四处走动，把地上的垃圾捡了起来。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3308.PNG／IMG_3310.PNG', quote: 'ゴミを拾う\nゴミ拾い活動\n動き回る', translation: '捡垃圾；捡垃圾活动；到处活动、来回走动。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-variety-and-each', title: 'さまざま・いろいろ・それぞれ・めいめい・おのおの',
    subtitle: '区分“各种各样”与“各自、分别”', category: 'vocabulary',
    entries: [
      entry('various-kinds', 'さまざま', 'さまざま', '各种各样、形形色色', '也写作「様々」。修饰名词用「さまざまな」。'),
      entry('various-ways', 'いろいろ', 'いろいろ', '各种各样；各方面', '既可说「いろいろな方法」，也可作副词说「いろいろ考える」。'),
      entry('each-separately', 'それぞれ', 'それぞれ', '各个、各自、分别'),
      entry('each-person', 'めいめい', 'めいめい', '各人、各自', '也写作「銘々」，通常针对每个人。'),
      entry('each-member', 'おのおの', 'おのおの', '各自、每个', '常写作「各々」，比「それぞれ」更常带书面或郑重的语感。'),
    ],
    points: [
      '「さまざま／いろいろ」强调种类、情况或做法多样；「それぞれ／めいめい／おのおの」强调逐个看待或分别行动。',
      '「それぞれ」可用于人和事物，如「それぞれの意見」「二つの方法にはそれぞれ長所がある」。',
      '「さまざま」较常见于说明文字，「いろいろ」在日常对话中很常用；并不是正式与非正式之间的绝对分界。',
    ],
    examples: [
      example('varied-solutions', 'さまざまな方法を試し、いろいろ考えた末にこの案を選んだ。', '尝试了各种方法、从多方面考虑后，我选了这个方案。'),
      example('individual-preparation', '参加者はそれぞれ必要な物を持ち寄り、めいめい準備を始めた。', '参加者各自带来需要的东西，分别开始了准备。'),
      example('individual-duties', '担当者はおのおのの役割を確認してください。', '请各位负责人确认各自的职责。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3310.PNG', quote: 'さまざま\nいろいろ\nそれぞれ\nめいめい\nおのおの', translation: '各种各样；各种各样、各方面；各自、分别；各人；各自、每个。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-return-contraction', title: '帰りゃいい＝帰ればいい',
    subtitle: '识别条件形的口语缩约和建议语气', category: 'grammar',
    entries: [
      entry('just-go-home', '帰りゃいい', 'かえりゃいい', '回去就行了、那就回去呗', '「帰ればいい」的口语缩约，可表示建议，也可能因口气显得粗率或不耐烦。'),
    ],
    points: [
      '「帰れば」在随意口语中可缩成「帰りゃ」；理解时还原为条件形更容易。',
      '「～ばいい」可以提供解决办法。对不熟悉的人或在正式场合，宜使用完整表达并根据关系调整语气。',
    ],
    examples: [
      example('return-by-taxi', '終電に間に合わないなら、タクシーで帰りゃいい。', '如果赶不上末班车，坐出租车回去就行了。'),
      example('leave-early-advice', '疲れたなら、今日は早く帰ればいいよ。', '累了的话，今天早点回去就好。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3308.PNG', quote: '帰りゃいい', translation: '回去就行了；那就回去呗。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-ownership', title: '飼い主・持ち主',
    subtitle: '区分动物的饲主与物品的所有者', category: 'vocabulary',
    entries: [
      entry('animal-owner', '飼い主', 'かいぬし', '饲主、宠物主人'),
      entry('object-owner', '持ち主', 'もちぬし', '物主、所有者', '也可说「才能の持ち主」，指拥有某种才能的人。'),
    ],
    points: [
      '「飼い主」指饲养动物的人；「持ち主」侧重持有某物的人。',
      '这两个词中的「主」都读「ぬし」，不是「しゅ」。',
    ],
    examples: [
      example('owner-comes-for-cat', '迷子の猫を保護したら、飼い主が迎えに来た。', '我们救助了走失的猫后，它的主人来接它了。'),
      example('umbrella-owner', 'この傘の持ち主を探しています。', '我正在找这把伞的主人。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3312.PNG', quote: '飼い主\n持ち主', translation: '饲主、宠物主人；物主、所有者。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-pointed-questions', title: 'いったいどういうつもり・いったいどういうこと',
    subtitle: '询问意图与追问事情缘由', category: 'grammar',
    entries: [
      entry('what-intention', 'いったいどういうつもり', 'いったいどういうつもり', '到底怎么想的？到底打的什么主意？', '「つもり」针对对方的意图，常带责问意味。'),
      entry('what-is-happening', 'いったいどういうこと', 'いったいどういうこと', '到底怎么回事？到底是什么意思？'),
    ],
    points: [
      '「いったい」也写作「一体」，与疑问词搭配，加强“到底、究竟”的语气。',
      '「どういうつもり」追问行为者的意图；「どういうこと」询问情况、原因或含义。对同事中性确认时，可说「どういう意図ですか」「状況を教えていただけますか」。',
    ],
    examples: [
      example('unannounced-change', '相談もせずに予定を変えるなんて、いったいどういうつもり？', '连商量都不商量就改计划，你到底怎么想的？'),
      example('cancelled-reservation', '予約が取り消されているけど、いったいどういうこと？', '预约被取消了，这到底是怎么回事？'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3312.PNG／IMG_3313.PNG', quote: 'いったいどういうつもり\nいったいどういうこと', translation: '到底怎么想的、打的什么主意；到底怎么回事、是什么意思。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-conjecture', title: 'のではないか・んじゃないの',
    subtitle: '用否定疑问形式提出推测或确认', category: 'grammar',
    entries: [
      entry('could-it-be', 'のではないか', 'のではないか', '会不会是……；是不是……；难道不是……吗'),
      entry('isnt-it-colloquial', 'んじゃないの', 'んじゃないの', '不是……吗？我看是……吧？', '「のではないの」的口语形式，包含「の→ん」「では→じゃ」的变化。'),
    ],
    points: [
      '这些形式常表达推测、确认或反问，不能仅因为有「ない」就把整句理解成否定。',
      '名词、ナ形容词后通常接「なのではないか／なんじゃないの」，如「原因は設定なんじゃないの」。语气是否带责备，要结合上下文与语调。',
    ],
    examples: [
      example('configuration-cause', '原因は設定の違いなのではないかと思います。', '我觉得原因会不会是设置不同。'),
      example('already-home', '電気がついているし、もう帰っているんじゃないの？', '灯都亮着了，他是不是已经回来了？'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3312.PNG／IMG_3313.PNG', quote: 'のではないか\nんじゃないの', translation: '会不会是……、是不是……；不是……吗、我看是……吧。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-this-much', title: 'これだけ・これほど',
    subtitle: '区分数量限定与程度强调', category: 'grammar',
    entries: [
      entry('this-much-only', 'これだけ', 'これだけ', '只有这些；这么多、到了这种程度', '有“仅限这些”和“这么多”两种常见理解，需看语境。'),
      entry('to-this-extent', 'これほど', 'これほど', '如此、这么……、到这种程度'),
    ],
    points: [
      '「必要なのはこれだけ」限定数量，表示“只需要这些”；「これだけ準備した」则可强调已经准备得很多。',
      '「これほど」侧重程度，常带惊讶或强调。不能直接把它替换进所有表示“只有这些”的句子。',
    ],
    examples: [
      example('only-two-items', '持っていく物は、財布とスマホ、これだけです。', '要带的东西只有钱包和手机，就这些。'),
      example('this-much-practice', 'これだけ練習したのだから、自信を持って話そう。', '已经练习了这么多，就自信地说吧。'),
      example('unexpected-popularity', 'この動画がこれほど人気になるとは思わなかった。', '没想到这个视频会这么受欢迎。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3313.PNG', quote: 'これだけ\nこれほど', translation: '只有这些，或这么多；如此、到这种程度。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-meaning-equivalence', title: 'Aということは、Bということだ',
    subtitle: '说明一件事的意义，或换一种说法表达', category: 'grammar',
    entries: [
      entry('protecting-okinawa', '沖縄を守るということは、日本を守るということだ', 'おきなわをまもるということは、にほんをまもるということだ', '守护冲绳，也就是守护日本', '保留截图完整例句；阅读时补入逗号，截图原文分为两行。'),
    ],
    points: [
      '前面的「Aということ」把A这件事作为话题，后面的「Bということだ」说明它意味着什么。',
      '这个句式可以用于解释意义、重新表述或根据情况作推论；具体是否等同，需要结合句子的内容理解。',
    ],
    examples: [
      example('publish-for-users', 'アプリを公開するということは、利用者に使ってもらえるようにするということだ。', '发布应用，也就是让用户能够使用它。'),
      example('no-response-yet', 'まだ返事がないということは、検討が続いているということかもしれない。', '还没有回复，可能就意味着仍在讨论。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3313.PNG', quote: '沖縄を守るということは\n日本を守るということだ', translation: '守护冲绳，也就是守护日本。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-shopping-tools', title: 'カート・買い物かご',
    subtitle: '购物推车与手提购物篮', category: 'vocabulary',
    entries: [
      entry('shopping-cart', 'カート', 'カート', '推车；购物推车', '在超市场景中通常指购物推车，也可明确说「ショッピングカート」。'),
      entry('shopping-basket', '買い物かご', 'かいものかご', '购物篮', '「かご」也写作「籠」。网上购物中的购物篮也可沿用这个说法。'),
    ],
    points: [
      '实体店的「カート」通常带轮子，能推着走；「買い物かご」通常是用手提的篮子。',
      '放入商品时用「かごに入れる」，推购物车用「カートを押す」。',
    ],
    examples: [
      example('push-shopping-cart', '買う物が多いので、カートを使おう。', '要买的东西很多，我们用购物推车吧。'),
      example('put-vegetables-in-basket', '野菜を買い物かごに入れた。', '我把蔬菜放进了购物篮。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3317.PNG', quote: 'カート\n買い物かご', translation: '购物推车。\n购物篮。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-heard-news', title: '～んだって・～と言ってた',
    subtitle: '转述听到的消息和别人的评价', category: 'grammar',
    entries: [
      entry('heard-that', 'んだって', 'んだって', '听说……、据说……', '此处作为口语传闻句型笔记；前面需要接具体内容。'),
      entry('heard-it-will-start', '始まるんだって', 'はじまるんだって', '听说要开始了', '用「始まる」转述尚未发生或一般性的开始，具体时间由语境决定。'),
      entry('heard-it-started', '始まったんだって', 'はじまったんだって', '听说已经开始了', '「始まった」保留过去时，表示开始这一变化已发生。'),
      entry('said-it-was-bad', 'まずいと言ってた', 'まずいといってた', '他说不好吃／他说情况不妙', '「言ってた」是「言っていた」的口语省略。「まずい」可评价味道，也可评价状况或做法；单凭此句不能确定对象。'),
    ],
    points: [
      '「～んだって」常用于随意转述消息；如果提高句尾语调，也可能是在确认自己刚听到的信息。',
      '转述仍要保留原内容的时间差别：「始まる」与「始まった」不能随意互换。',
      '「～と言ってた」明确转述某人的说法；其中「と」标示引用内容。',
    ],
    examples: [
      example('heard-new-class-start', '来月から新しい授業が始まるんだって。', '听说下个月要开一门新课。'),
      example('heard-event-started', '駅前のイベントは、もう始まったんだって。', '听说站前的活动已经开始了。'),
      example('said-schedule-problem', '先輩が、この日程のままではまずいと言ってた。', '前辈说，继续按这个日程安排下去会有问题。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3317.PNG／IMG_3319.PNG', quote: 'んだって\n始まるんだって\n始まったんだって\nまずいと言ってた', translation: '听说……。\n听说要开始了。\n听说已经开始了。\n他说不好吃／他说情况不妙，具体依语境。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-action-choices', title: 'どうしたの？・どうする？・どうしよう',
    subtitle: '询问状况、选择行动和犹豫时的自言自语', category: 'grammar',
    entries: [
      entry('what-happened', 'どうしたの？', 'どうしたの', '怎么了？／发生什么事了？', '常用来询问对方遇到了什么事，或为什么表现得与平时不同。'),
      entry('what-will-you-do', 'どうする？', 'どうする', '你打算怎么办？／接下来怎么办？', '询问今后的行动或选择，也可以讨论双方共同的安排。'),
      entry('what-shall-i-do', 'どうしよう', 'どうしよう', '我该怎么办？／怎么办才好呢？', '「しよう」是「する」的意志形。常用于自言自语，也能与别人一起商量。'),
      entry('maybe-go-tomorrow', '明日行こうかな', 'あしたいこうかな', '明天要不要去呢／我考虑明天去', '意志形「行こう」加「かな」表示思量、犹豫，尚未下定决心。'),
    ],
    points: [
      '「どうしたの？」问已发生的事情或当前状态；「どうする？」问接下来采取什么行动。',
      '原笔记的「问对方／问自己」概括常见语境，不是绝对规则。「どうしようか」也可以邀请对方共同商量。',
      '「～ようかな」常是说话者在考虑自己的行动，不能直接理解为确定的计划或承诺。',
    ],
    examples: [
      example('ask-about-worry', 'どうしたの？　何か困ったことがあった？', '怎么了？遇到什么麻烦了吗？'),
      example('choose-next-action', 'このあとどうする？　図書館に行く？', '接下来怎么办？去图书馆吗？'),
      example('decide-museum-day', '今日行くか、明日行くか、どうしよう。明日行こうかな。', '今天去还是明天去呢，怎么办才好。要不明天去吧。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3317.PNG／IMG_3318.PNG', quote: 'どうしたの？\nどうする？ 问对方\nどうしよう 问自己\n明日行こうかな', translation: '怎么了？\n怎么办？原笔记标注「问对方」。\n怎么办才好呢。原笔记标注「问自己」。\n明天要不要去呢。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-never-again', title: '二度と～ない・～もんか',
    subtitle: '强烈拒绝与尚未写完的引用片段', category: 'grammar',
    entries: [
      entry('never-eat-again', '二度と食べるもんか', 'にどとたべるもんか', '我再也不吃了！', '「もんか」是「ものか」的口语形式。用反问表达强烈否定，虽然前面是「食べる」，整句却是否定意志。'),
      entry('never-shout-fragment', '二度と怒鳴らないと', 'にどとどならないと', '再也不吼叫……（截图未完片段）', '原图停在输入光标处，后文尚未出现。保留原貌，不把它当作已经说完的句子，也不能单独把结尾「ないと」判为义务表达。'),
    ],
    points: [
      '「二度と～ない」表示再也不做某事。「怒鳴る」是大声吼叫、怒吼，语气比普通的「言う」强。',
      '「～もんか」带有强烈情绪，常表示坚决不做；对不熟悉的人或在正式沟通中使用，会显得冲。',
      '下方「二度と怒鳴らないと約束した」是原创补全练习，用于说明引用的「と」，不是从截图恢复出的后半句。',
    ],
    examples: [
      example('refuse-spicy-food', 'こんなに辛い料理、二度と食べるもんか。', '这么辣的菜，我再也不吃了！'),
      example('promise-not-shout', '子どもに二度と怒鳴らないと約束した。', '我保证再也不对孩子吼叫。'),
      example('never-repeat-mistake', '同じ間違いは二度としない。', '同样的错误，我不会再犯。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3318.PNG', quote: '二度と食べるもんか\n二度と怒鳴らないと', translation: '我再也不吃了！\n再也不吼叫……（原图后文未写完）。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-hot-food-sound', title: 'ハフハフ',
    subtitle: '吃热食时一边呼气、一边吃的声音', category: 'vocabulary',
    entries: [
      entry('hot-food-huff', 'ハフハフ', 'はふはふ', '吃滚烫食物时呼气的声音或样子', '拟声拟态表达，可说「ハフハフしながら食べる」。具体动作要结合场景。'),
    ],
    points: [
      '「ハフハフ」常用于刚出锅的食物很烫，吃的人一边呼气散热、一边吃的场面。',
      '「ハアハア」常形容大口喘气，「フーフー」常形容吹气；不要把它们当作完全相同的声音。',
    ],
    examples: [
      example('eat-hot-takoyaki', '焼きたてのたこ焼きをハフハフしながら食べた。', '我一边呼气，一边吃刚烤好的章鱼烧。'),
      example('hot-stew-potatoes', 'シチューのじゃがいもが熱くて、ハフハフしてしまった。', '炖菜里的土豆太烫，我忍不住张嘴呼了几口气。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3319.PNG', quote: 'ハフハフ', translation: '吃热食时一边呼气散热、一边吃的声音或样子。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-gaze-and-games', title: '睨む・にらめっこ・かけっこ',
    subtitle: '瞪视与儿童游戏的口语说法', category: 'vocabulary',
    entries: [
      entry('glare-at', '睨む', 'にらむ', '瞪、怒视', '常用「相手を睨む」，用「を」标记瞪视的对象。'),
      entry('funny-face-game', 'にらめっこ', 'にらめっこ', '做鬼脸比谁先笑的游戏；盯着某物苦思', '游戏中的笑者为输；引申用法如「資料とにらめっこする」，表示对着资料长时间琢磨。'),
      entry('running-race', 'かけっこ', 'かけっこ', '赛跑', '较口语、常用于儿童之间的跑步竞赛，不单指一般跑步。'),
    ],
    points: [
      '「睨む」本身常带有不悦、警告等意味；「にらめっこ」作为游戏名称时，不表示双方真的生气了。',
      '「にらめっこする」「かけっこする」都可以加「する」。前者也有比喻用法，后者指赛跑。',
    ],
    examples: [
      example('glare-after-interruption', '話を遮られて、彼は相手を睨んだ。', '话被打断后，他瞪了对方一眼。'),
      example('study-screen-intently', 'エラーの原因を探して、画面とにらめっこしていた。', '为了找出报错原因，我一直盯着屏幕琢磨。'),
      example('children-race-park', '子どもたちは公園でかけっこをしている。', '孩子们正在公园里赛跑。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3319.PNG', quote: '睨む\nにらめっこ\nかけっこ', translation: '瞪、怒视。\n做鬼脸比谁先笑的游戏；也可引申为盯着某物苦思。\n赛跑。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-new-obligation', title: '～なくちゃならない・～なければならなくなった',
    subtitle: '必须做某事与后来出现的必要性', category: 'grammar',
    entries: [
      entry('must-go-out', '出かけなくちゃならない', 'でかけなくちゃならない', '必须出门／得出门了', '「なくちゃ」是「なくては」的口语缩约；完整形式为「出かけなくてはならない」。'),
      entry('became-necessary-fragment', 'なければならなくなった', 'なければならなくなった', '变得不得不……／后来必须……了', '原图为语法片段，前面的动词没有写在这一行。强调原先没有、后来出现的必要性。'),
    ],
    points: [
      '「なくてはならない」和「なければならない」都可表示必要、义务；前者在口语里常缩成「なくちゃならない」。',
      '「～なければならなくなった」把「ならない」变为「ならなくなった」，说明情况变化后必须做某事。它不是「不再需要做」。',
      '「不再需要做」通常说「～なくてもよくなった」等，表达的变化方向相反。',
    ],
    examples: [
      example('need-to-leave-now', '約束の時間に間に合うように、もう出かけなくちゃならない。', '为了赶上约定的时间，现在得出门了。'),
      example('new-office-obligation', '予定が変わって、明日出社しなければならなくなった。', '计划变了，明天变成必须去公司了。'),
      example('no-longer-need-office', '会議がオンラインになって、出社しなくてもよくなった。', '会议改成线上后，就不必去公司了。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3319.PNG', quote: '出かけなくちゃならない\nなければならなくなった', translation: '必须出门。\n变得不得不……（原图为语法片段）。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-gathering-place', title: '広場に集まる',
    subtitle: '用「に」标记聚集的地点', category: 'transitivity',
    entries: [
      entry('gather-at-square', '広場に集まる', 'ひろばにあつまる', '聚到广场上／在广场集合', '「集まる」是自动词，人或物自己聚集；聚集地点可用「に」标记。'),
    ],
    points: [
      '自动词「人が集まる」表示人们聚在一起；他动词「人を集める」表示由某人召集人。',
      '「広場に集まる」着眼于聚集到这个地点；「広場で話す」中的「で」则标记说话这一动作发生的场所。',
    ],
    examples: [
      example('meet-in-square', '明日の朝九時に、駅前の広場に集まってください。', '请明天早上九点在车站前的广场集合。'),
      example('organizer-gathers-participants', '係の人が参加者を広場に集めた。', '工作人员把参加者召集到了广场上。'),
    ],
    source: { kind: 'note', label: '手机笔记 · IMG_3319.PNG', quote: '広場に集まる', translation: '在广场集合／聚到广场上。', readAloud: false },
  },
  {
    id: 'live-2026-11-13-comparison-and-reframing', title: 'というより・より…のほうが・年が離れる',
    subtitle: '区分改换说法、程度比较和年龄差距', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3322.PNG／IMG_3325.PNG',
      quote: 'というより\n日本よりアメリカのほうが\n日本というより、天国\n年が離れる',
      translation: '与其说……不如说……；比起日本，美国更……（未完比较句）；与其说是日本，不如说是天堂；年龄相差。', readAloud: false,
    },
    entries: [
      entry('rephrase-rather-than', 'というより', 'というより', '与其说……，不如说……', '用更贴切的说法修正前面的描述。'),
      entry('japan-america-comparison', '日本よりアメリカのほうが', 'にほんよりアメリカのほうが', '比起日本，美国更……', '截图未完句：缺少后面的评价，不补造比较结论。IMG_3322 的末尾「が」清晰，IMG_3325 右侧截断。'),
      entry('japan-or-heaven', '日本というより、天国', 'にほんというより、てんごく', '与其说是日本，不如说是天堂', '「天国」可比喻非常舒适、令人满意的环境；截图未给出完整情境，此处保留原笔记说法。'),
      entry('age-gap', '年が離れる', 'としがはなれる', '年龄相差、年龄差距较大', '描述年龄差的状态时常用「年が離れている」。'),
    ],
    points: [
      '「AというよりB」修正对同一事物的描述；「AよりBのほうが〜」比较 A、B 的程度，两者不要混淆。',
      '笔记中的国别比较句尚未写完，不能自行添加「好」「贵」等结论。下面的完整例句均为原创。',
      '「年が離れる」中的「年」读「とし」；也可说「年の離れた兄弟」，表示年龄相差较多的兄弟姐妹。',
    ],
    examples: [
      example('hobby-rather-than-job', 'これは仕事というより、趣味に近いです。', '这与其说是工作，不如说更接近爱好。'),
      example('library-comparison', 'この図書館は、駅前の図書館より静かです。', '这家图书馆比车站前的图书馆安静。'),
      example('older-sister-age-gap', '姉とは十歳、年が離れています。', '我和姐姐相差十岁。'),
    ],
  },
  {
    id: 'live-2026-11-13-unsteady-and-direction', title: 'よろよろ・方向オンチ',
    subtitle: '脚步不稳和方向感不好的说法', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3322.PNG／IMG_3325.PNG／IMG_3326.PNG',
      quote: 'よろよろ\n方向オンチ', translation: '摇摇晃晃、踉踉跄跄；方向感不好、路痴。', readAloud: false,
    },
    entries: [
      entry('staggering', 'よろよろ', 'よろよろ', '摇摇晃晃、踉踉跄跄', '形容身体无力或失去平衡、站立或行走不稳的样子。'),
      entry('poor-sense-of-direction', '方向オンチ', 'ほうこうおんち', '路痴、方向感不好', '常写作「方向音痴」。用来评价别人时注意语气。'),
    ],
    points: [
      '「よろよろ」是拟态词，常用「よろよろ歩く」「よろよろと歩く」「よろよろする」。',
      '「方向オンチ」里的「音痴」由不擅长辨音、唱歌，引申为不擅长某一方面；这里专指方向感不好。',
    ],
    examples: [
      example('stagger-after-running', '長い距離を走ったあと、よろよろと歩いていた。', '跑了很长一段路后，走起路来摇摇晃晃。'),
      example('check-map-for-direction', '私は方向音痴なので、出かける前に地図を確認します。', '我方向感不好，所以出门前会确认地图。'),
    ],
  },
  {
    id: 'live-2026-11-13-physical-sensations', title: '寒気がする・吐き気がする',
    subtitle: '描述发冷和恶心的身体感受', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3326.PNG／IMG_3327.PNG',
      quote: '寒気がする\n吐き気がする', translation: '感到发冷、打寒战；感到恶心、想吐。', readAloud: false,
    },
    entries: [
      entry('feel-chills', '寒気がする', 'さむけがする', '感到发冷、打寒战', '也可形容恐惧或厌恶引起的发冷。这里「寒気」读「さむけ」。'),
      entry('feel-nauseous', '吐き気がする', 'はきけがする', '感到恶心、想吐', '「吐き気」整体是名词，表示想吐的感觉。'),
    ],
    points: [
      '这里的「する」表示产生某种感觉，结构是「寒気／吐き気＋がする」。',
      '身体发冷的「寒気」通常读「さむけ」；气象语境中的冷空气、寒冷气团常读「かんき」。',
      '「吐き気がする」描述具体感觉，不要拆成表示猜测的「〜気がする」。',
    ],
    examples: [
      example('chills-since-earlier', 'さっきから寒気がします。', '从刚才开始就觉得发冷。'),
      example('motion-sickness-nausea', '車に酔って、吐き気がします。', '晕车了，觉得恶心。'),
    ],
  },
  {
    id: 'live-2026-11-13-causative-passive-basics', title: '使役受身・やめさせられる・飲まされた',
    subtitle: '表达被要求或被迫做某事', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3322.PNG／IMG_3323.PNG／IMG_3325.PNG／IMG_3328.PNG',
      quote: 'やめさせられる\n使役受身\n被役\nお酒を飲まされた',
      translation: '被迫停止或辞去；使役被动（笔记中文简称「被役」）；被迫喝了酒。', readAloud: false,
    },
    entries: [
      entry('causative-passive-term', '使役受身', 'しえきうけみ', '使役被动', '日语语法名称，也写作「使役受け身」；截图的「被役」按中文课堂简称理解。'),
      entry('made-to-stop', 'やめさせられる', 'やめさせられる', '被迫停止；被迫辞去', '一段动词「やめる」的使役受身。原图只写假名，具体是停止活动还是辞去工作要看语境。'),
      entry('made-to-drink-alcohol', 'お酒を飲まされた', 'おさけをのまされた', '被迫喝了酒', '「飲まされた」是「飲ませられた」的常用缩约形。'),
    ],
    points: [
      '使役受身从实际做动作的人出发，表达被别人要求或迫使做某事，常含不情愿的语气。日语名称用「使役受身」，不把中文速记「被役」作为日语词条。',
      '一段动词的变化是「やめる→やめさせる→やめさせられる」；表示辞职时可写「辞めさせられる」，表示停止活动时可写「やめさせられる」。',
      '部分五段动词可缩约，如「飲ませられる→飲まされる」；不能把这条规则不加区别地套到所有动词。',
    ],
    examples: [
      example('made-to-stop-game', '騒がしかったので、ゲームをやめさせられた。', '因为太吵，被要求停止玩游戏。'),
      example('made-to-write-essay', '私は先生に作文を書かせられました。', '我被老师要求写作文。'),
      example('made-to-drink-at-party', '飲み会で、飲めないお酒を飲まされた。', '在聚会上，被迫喝了自己喝不了的酒。'),
    ],
  },
  {
    id: 'live-2026-11-13-hear-causative-passive', title: '聞く・聞かせる・聞かれる・聞かされる',
    subtitle: '分清听、让人听、被问和被迫听', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3325.PNG／IMG_3326.PNG／IMG_3327.PNG',
      quote: '聞く\n聞かせる\n聞かれる\n聞かせられる\n聞かされる',
      translation: '听或询问；让人听；被听见或被询问；被迫听；被迫听的常用缩约形式。', readAloud: false,
    },
    entries: [
      entry('hear-or-ask', '聞く', 'きく', '听；询问', '含义由宾语和场景决定，如「話を聞く」「道を聞く」。'),
      entry('let-someone-hear', '聞かせる', 'きかせる', '让人听、说给人听', '「聞く」的使役形，也常用于请别人讲故事或说明。'),
      entry('be-heard-or-asked', '聞かれる', 'きかれる', '被听见；被询问', '也可作尊敬表达，需看语境；不是「聞く」的通常可能形。'),
      entry('made-to-hear-full', '聞かせられる', 'きかせられる', '被要求听、被迫听', '这里作为「聞く」的使役受身完整形学习。'),
      entry('made-to-hear-short', '聞かされる', 'きかされる', '被迫听；被告知', '「聞かせられる」的常用缩约形；在「事実を聞かされた」等句子里也可表示被告知。'),
    ],
    points: [
      '按动作关系区分：「聞く」自己听或问，「聞かせる」让别人听，「聞かれる」自己被听见或被问。',
      '「聞かせられる→聞かされる」是使役受身缩约；既能表示不得不听，也能表示听到了别人告知的事情，不能一律译成强迫。',
      '「聞ける」是通常的可能形，「聞こえる」表示声音听得见；这两者都不要和「聞かれる」混淆。',
    ],
    examples: [
      example('tell-travel-story', '友達に旅行の話を聞かせました。', '我把旅行的故事讲给朋友听。'),
      example('asked-for-directions', '駅で観光客に道を聞かれました。', '我在车站被游客问路了。'),
      example('same-explanation-repeated', '同じ説明を何度も聞かされました。', '同样的说明，我被迫听了好几遍。'),
    ],
  },
  {
    id: 'live-2026-11-13-su-ending-causative-passive', title: '話す→話させられる・渡す→渡させられる',
    subtitle: '以「す」结尾的动词保留使役受身的完整形式', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3327.PNG',
      quote: '話す→話させられる\n渡す→渡させられる',
      translation: '说话→被迫说话；交给、递给→被迫交出或递交。', readAloud: false,
    },
    entries: [
      entry('speak', '話す', 'はなす', '说话、讲述'),
      entry('made-to-speak', '話させられる', 'はなさせられる', '被迫说、被要求发言'),
      entry('hand-over', '渡す', 'わたす', '交给、递给'),
      entry('made-to-hand-over', '渡させられる', 'わたさせられる', '被迫交出、被要求递交'),
    ],
    points: [
      '以「す」结尾的五段动词，标准使役受身形式保留「〜させられる」：話させられる、渡させられる。',
      '「話される」「渡される」是普通被动形，也可能是尊敬形；它们不是上面两个使役受身形式的同义缩约。',
      '以「渡す」为例，「資料を渡される」是别人把资料交给自己，「資料を渡させられる」是自己被要求把资料交出去。',
    ],
    examples: [
      example('made-to-speak-at-meeting', '会議で突然、意見を話させられました。', '在会议上突然被要求说出自己的意见。'),
      example('made-to-hand-documents', '受付で書類を全部渡させられました。', '在前台被要求把所有文件都交出去。'),
      example('given-documents', '受付で書類を渡されました。', '前台把文件交给了我。'),
    ],
  },
  {
    id: 'live-2026-11-13-trouble-and-resolution', title: 'ひどい目にあう・はた迷惑・なんとかする',
    subtitle: '遭遇麻烦、给别人添麻烦与设法解决', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3323.PNG／IMG_3325.PNG／IMG_3328.PNG',
      quote: 'ひどい目にあう\nなんとかする\nはた迷惑',
      translation: '吃苦头、遭殃；想办法处理；给旁人添麻烦。', readAloud: false,
    },
    entries: [
      entry('have-a-terrible-experience', 'ひどい目にあう', 'ひどいめにあう', '遭殃、吃苦头、遇到糟糕的事', '也写作「ひどい目に遭う」；这里的「目」不是字面的眼睛。'),
      entry('do-something-about-it', 'なんとかする', 'なんとかする', '想办法处理、设法解决'),
      entry('nuisance-to-others', 'はた迷惑', 'はためいわく', '给旁人添麻烦、让周围的人困扰', '也写作「傍迷惑」；可用「はた迷惑な行為」，带负面评价。'),
    ],
    points: [
      '「ひどい目にあう」是自己遭受糟糕的经历；「はた迷惑」侧重某行为给周围的人造成困扰。',
      '「なんとかする」表示主动设法处理；「なんとかなる」表示事情总能有办法解决，动作主体和侧重点不同。',
    ],
    examples: [
      example('terrible-rain-experience', '傘を忘れて大雨に降られ、ひどい目に遭った。', '忘了带伞又碰上大雨，真是吃了苦头。'),
      example('handle-by-deadline', '締め切りまでに、なんとかします。', '我会想办法在截止日期前处理好。'),
      example('night-noise-nuisance', '深夜に大声で話すのは、はた迷惑です。', '深夜大声说话会给周围的人添麻烦。'),
    ],
  },
  {
    id: 'live-2026-11-13-recycling-and-clubs', title: 'リサイクル・サークル',
    subtitle: '记准两个外来语的读音和常见搭配', category: 'vocabulary',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3323.PNG／IMG_3325.PNG',
      quote: 'リサイクル\nサークル', translation: '回收再利用；社团、兴趣小组，也可指圆或圈子。', readAloud: false,
    },
    entries: [
      entry('recycle', 'リサイクル', 'リサイクル', '回收再利用、再生利用', '「リサイクルショップ」通常指二手商品店；「リサイクル」本身不直接等于旧货。'),
      entry('club-circle', 'サークル', 'サークル', '社团、兴趣小组；圆、圈子', '大学语境常指学生兴趣团体，如「写真サークル」。'),
    ],
    points: [
      '读音要区分：「リサイクル」含「サイ」，「サークル」含长音「サー」。',
      '「リサイクル」可接「する」；「サークル」常搭配「入る」「参加する」，说加入或参加兴趣团体。',
    ],
    examples: [
      example('recycle-empty-cans', '空き缶をリサイクルに出します。', '把空罐送去回收。'),
      example('join-photo-club', '大学の写真サークルに入りました。', '我加入了大学的摄影社团。'),
    ],
  },
  {
    id: 'live-2026-11-13-plenty-and-casual-completion', title: '野菜たっぷり・～ちゃう・～じゃう',
    subtitle: '数量充足和「てしまう／でしまう」的口语缩约', category: 'grammar',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3328.PNG',
      quote: '野菜たっぷり\n忘れてしまう→忘れちゃう\n飲んでしまう→飲んじゃう',
      translation: '蔬菜满满；忘掉→忘掉的口语说法；喝掉→喝掉的口语说法。', readAloud: false,
    },
    entries: [
      entry('plenty-of-vegetables', '野菜たっぷり', 'やさいたっぷり', '蔬菜满满、蔬菜放得很多', '「たっぷり」表示分量充足，常用于菜品介绍。'),
      entry('forget-completely', '忘れてしまう', 'わすれてしまう', '忘掉、不小心忘了', '完整形式；语气要结合具体上下文。'),
      entry('forget-casual', '忘れちゃう', 'わすれちゃう', '忘掉、会忘的', '「忘れてしまう」的口语缩约。'),
      entry('drink-completely', '飲んでしまう', 'のんでしまう', '喝掉、喝完；不小心喝了', '完整形式；可强调完成，也可带遗憾等语气。'),
      entry('drink-casual', '飲んじゃう', 'のんじゃう', '喝掉、把它喝完（口语）', '「飲んでしまう」的口语缩约。'),
    ],
    points: [
      '成对记忆：「〜てしまう→〜ちゃう」「〜でしまう→〜じゃう」。因此「忘れちゃう」，而「飲んじゃう」不能误写成「飲んちゃう」。',
      '「〜てしまう／でしまう」既能表示动作完成，也能表达遗憾、意外等情绪；口语缩约也保留这些用法。',
      '「野菜たっぷりのスープ」表示蔬菜充足的汤。正式说明和工作邮件通常优先使用「〜てしまう」等完整形式。',
    ],
    examples: [
      example('vegetable-soup', '今日は野菜たっぷりのスープを作ります。', '今天要做一锅放了很多蔬菜的汤。'),
      example('write-before-forgetting', '今メモしないと、忘れちゃう。', '现在不记下来就会忘掉。'),
      example('drink-remaining-juice', '残りのジュースも飲んじゃうね。', '剩下的果汁我也喝掉啦。'),
    ],
  },
  {
    id: 'live-2026-11-13-delay-and-propagation', title: '遅れる・遅らせる・伝わり方',
    subtitle: '区分事情变迟和人为使它延后', category: 'transitivity',
    source: {
      kind: 'note', label: '手机笔记 · IMG_3328.PNG',
      quote: '音の伝わり方を遅らせる\n遅れる',
      translation: '使声音的传递变迟（保留笔记措辞）；延误、变迟。', readAloud: false,
    },
    entries: [
      entry('delay-sound-propagation-note', '音の伝わり方を遅らせる', 'おとのつたわりかたをおくらせる', '使声音的传递变迟', '保留原笔记。若强调延迟声音传递，更自然可说「音が伝わるのを遅らせる」；若强调降低传播速度，可说「音の伝わる速度を遅くする」。'),
      entry('be-delayed', '遅れる', 'おくれる', '延误、变迟、迟到', '自动词，如「電車が遅れる」「授業に遅れる」。'),
    ],
    points: [
      '「遅れる」说明事情本身变迟；「遅らせる」说明有人使某事延后或推迟，常用「時間を遅らせる」。',
      '「動詞ます形去ます＋方」表示做法、方式：「伝わる→伝わり方」。但「方式」与「速度」侧重点不同，表达时按实际意思选择。',
      '「遅らせる」常与「出発」「提出」「開始時間」搭配；「遅れる」则可说「出発が遅れる」「提出が遅れる」。',
    ],
    examples: [
      example('train-is-delayed', '電車が遅れているので、少し遅刻しそうです。', '因为电车晚点，我可能会稍微迟到。'),
      example('delay-start-time', '開始時間を10分遅らせます。', '把开始时间推迟十分钟。'),
      example('delayed-sound-arrival', '映像と音がずれていて、音が少し遅れて届きます。', '画面和声音不同步，声音会稍晚一些传来。'),
    ],
  },
]
