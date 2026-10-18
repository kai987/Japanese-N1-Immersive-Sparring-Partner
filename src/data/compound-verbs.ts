export type CompoundVerbEntry = {
  word: string
  reading: string
  meaning: string
  example: string
  translation: string
  note?: string
}

export type CompoundVerbGroup = {
  title: string
  description: string
  words: CompoundVerbEntry[]
}

export type CompoundVerbSeries = {
  id: string
  title: string
  subtitle: string
  summary: string
  structure: string
  notes: string[]
  groups: CompoundVerbGroup[]
  relatedSeriesIds: string[]
  triggers: string[]
  sources: { title: string; url: string }[]
}

// The grouping and all learning examples below are original teaching material.
// NINJAL supplies the linguistic distinction and a reference lexicon, not JLPT levels.
const lexiconSource = {
  title: '国立国語研究所「複合動詞レキシコン」',
  url: 'https://www2.ninjal.ac.jp/vvlexicon/',
}
const structureSource = {
  title: '国立国語研究所：語構造・統語的複合動詞と語彙的複合動詞',
  url: 'https://www2.ninjal.ac.jp/vvlexicon/about.html',
}

export const compoundVerbSeries: CompoundVerbSeries[] = [
  {
    id: 'au',
    title: '「～合う」と関連表現',
    subtitle: '相互・共同／一致・釣り合い／名詞を含む固定表現',
    summary: '从「間に合う」出发，分清表示相互行为的复合动词、表示吻合的词，以及含名词和助词的固定表达。同样写作「合う」，含义和结构并不相同。',
    structure: '動詞の連用形＋合う ／ 名詞＋助詞＋合う（関連表現）',
    notes: [
      '「間に合う」是「間＋に＋合う」的固定表达，常表示赶得上、够用；不属于这里所说的「动词连用形＋动词」型复合动词，也不表示相互。',
      '「気が合う」「割に合う」也含助词，不能概括成可自由造词的「名詞＋合う」规则。应当连同助词一起记忆。',
      '「話し合う」一类可理解为彼此进行某动作；「見合う」「かみ合う」则着重匹配。国研把能广泛组成相互行为的「～合う」列入统语性复合动词。',
    ],
    groups: [
      {
        title: '名詞を含む固定表現',
        description: '与复合动词对照学习的相关表达；保留「に／が」，不要按相互义直译。',
        words: [
          { word: '間に合う', reading: 'まにあう', meaning: '赶得上；来得及；够用', example: '今出発すれば、午後の打ち合わせに間に合います。', translation: '现在出发的话，能赶上下午的会议。', note: '相关固定表达。「締め切りに間に合う」是赶上期限；「今ある資料で間に合う」是现有资料够用。不是“相互配合”。' },
          { word: '気が合う', reading: 'きがあう', meaning: '合得来；意气相投', example: '新しい同僚とは気が合い、休憩中もよく話します。', translation: '我和新同事很合得来，休息时也经常聊天。', note: '相关表达，结构是「気＋が＋合う」。「気を合わせる」不是它的普通替换说法。' },
          { word: '割に合う', reading: 'わりにあう', meaning: '划得来；付出与回报相称', example: 'この作業量では、今の報酬は割に合いません。', translation: '按这个工作量，目前的报酬不划算。', note: '相关表达，常用否定「割に合わない」。这里的「割」指付出与收益之间的比例。' },
        ],
      },
      {
        title: '相互・共同の「～合う」',
        description: '多人彼此进行同一动作；与「一人で」通常不相容。',
        words: [
          { word: '話し合う', reading: 'はなしあう', meaning: '商量；讨论', example: '実装を始める前に、チームで優先順位を話し合いました。', translation: '开始实现前，团队讨论了优先顺序。', note: '「話す」只表示说话；「話し合う」强调双方交换意见。' },
          { word: '助け合う', reading: 'たすけあう', meaning: '互相帮助', example: '忙しい時期は、担当の違いを越えて助け合います。', translation: '忙碌时期，大家会跨越职责分工互相帮助。', note: '与单向的「助ける」区分。' },
          { word: '支え合う', reading: 'ささえあう', meaning: '相互支持；互相支撑', example: '困ったときは、経験の違う仲間同士で支え合います。', translation: '遇到困难时，经验不同的伙伴会互相支持。', note: '强调双向支持；「支える」也可以表示单向支撑。' },
          { word: '奪い合う', reading: 'うばいあう', meaning: '互相争夺', example: '複数の処理が限られた計算資源を奪い合っています。', translation: '多个处理任务正在争夺有限的计算资源。', note: '常用于资源、市场、人才的争夺，未必有身体冲突。' },
        ],
      },
      {
        title: '向き・一致・釣り合い',
        description: '不能一律译成“互相”；根据整体词义学习搭配。',
        words: [
          { word: '向き合う', reading: 'むきあう', meaning: '面对面；认真面对', example: '障害の原因と向き合い、再発防止策を考えます。', translation: '认真面对故障原因，思考防止再次发生的措施。', note: '抽象用法常为「課題・現実と向き合う」。' },
          { word: 'かみ合う', reading: 'かみあう', meaning: '咬合；吻合；谈得拢', example: '前提を確認すると、ようやく議論がかみ合いました。', translation: '确认前提后，讨论终于对上了路。', note: '也写作「噛み合う」。不是“相互咬对方”；抽象用法指内容、条件能衔接。' },
          { word: '釣り合う', reading: 'つりあう', meaning: '平衡；相称；相配', example: '開発の速さと品質が釣り合うように、確認の手順を整えます。', translation: '为了平衡开发速度与质量，完善检查流程。', note: '常用「AとBが釣り合う」表示两者平衡；「Aに見合うB」则着重B与A相称。' },
          { word: '似合う', reading: 'にあう', meaning: '适合；相配；穿戴起来好看', example: 'この落ち着いた色は、読みやすさを大切にした画面によく似合います。', translation: '这种沉稳的颜色很适合重视易读性的页面。', note: '常用「人・物に似合う」。强调外观、气质等相配，不是双向动作；「仕事に向いている」更适合表达能力上适合某工作。' },
          { word: '折り合う', reading: 'おりあう', meaning: '达成妥协；取得一致；相处融洽', example: '費用の上限について折り合い、実施の範囲を決めました。', translation: '就费用上限达成一致后，确定了实施范围。', note: '谈判语境常用「条件が折り合う」「折り合いをつける」；不能换成单纯表示赶上期限的「間に合う」。' },
          { word: '見合う', reading: 'みあう', meaning: '相称；相当；互相看', example: '運用の負担に見合う効果があるかを検証します。', translation: '验证效果是否与运维负担相称。', note: '此处用「Aに見合うB」表示与 A 相称的 B；不等于「見合わせる」（暂缓、互相看）。' },
          { word: '付き合う', reading: 'つきあう', meaning: '交往；陪同；打交道', example: '利用者の相談に、最後まで付き合いました。', translation: '我一直陪用户把问题讨论到最后。', note: '整体词义已固定。与人交往用「人と付き合う」，陪某人做事也可用「人に付き合う」。' },
        ],
      },
    ],
    relatedSeriesIds: ['time-quantity', 'toru-hiku-sasu'],
    triggers: ['間に合う', 'かみ合う', '噛み合う', '向き合う', '奪い合う', '見合う'],
    sources: [structureSource, lexiconSource, { title: '日本漢字能力検定協会「漢字ペディア」：あう', url: 'https://www.kanjipedia.jp/sakuin/doukunigi/items/0000030100' }],
  },
  {
    id: 'time-quantity',
    title: '時間・期限・数量を表す動詞',
    subtitle: '間に合う／持ち越す／使い切る',
    summary: '把“赶上期限、延后处理、数量增减”放到同一使用场景比较。本专题按意思归组，包含复合动词和明确标注的相关固定表达。',
    structure: '期限に間に合う ／ 次へ持ち越す ／ 数量を使い切る・差し引く',
    notes: [
      '「間に合う」「間に合わせる」是相关固定表达，不是狭义的 V＋V 型复合动词。前者着重状态或结果，后者着重设法使之赶上、用现有东西凑合。',
      '「持ち越す」多用于未解决事项或状态延续；「繰り越す」常用于预算、余额、假期等转入下一期间。',
      '这是场景主题，并不表示所有词都采用同一种构词方式，也不把拓展词统一认定为 N1。',
    ],
    groups: [
      {
        title: '期限・進み具合',
        description: '比较赶上、设法赶上、追上和超越。',
        words: [
          { word: '間に合う', reading: 'まにあう', meaning: '赶得上；来得及；够用', example: '修正が午前中に終われば、公開時刻に間に合います。', translation: '如果上午能完成修正，就赶得上发布时间。', note: '相关固定表达。数量义如「予備の一台で間に合う」：有一台备用设备就够用。' },
          { word: '間に合わせる', reading: 'まにあわせる', meaning: '使赶得上；设法按时完成；凑合应付', example: '担当者を増やして、納期に間に合わせました。', translation: '通过增加负责人，设法赶上了交付期限。', note: '相关固定表达。「資料で間に合わせる」也可表示先用这些资料应付。' },
          { word: '追いつく', reading: 'おいつく', meaning: '追上；赶上进度', example: '復習を続け、授業の進度に追いつきました。', translation: '通过持续复习，我赶上了课程进度。', note: '到达与对方相同的进度，还没有“超过”。也写作「追い付く」。' },
          { word: '追い越す', reading: 'おいこす', meaning: '追过；超过', example: '新方式の処理速度が、従来方式を追い越しました。', translation: '新方案的处理速度超过了旧方案。', note: '用「Aを追い越す」；与「Aに追いつく」的助词和结果都不同。' },
        ],
      },
      {
        title: '次の時点へ送る・区切る',
        description: '“延期”和“结束当前阶段”要区分。',
        words: [
          { word: '持ち越す', reading: 'もちこす', meaning: '留到下次；延续至以后', example: '結論が出ず、議題を次回の会議に持ち越しました。', translation: '由于没有得出结论，议题留到下次会议。', note: '常与「問題・議題・不安」搭配。' },
          { word: '繰り越す', reading: 'くりこす', meaning: '结转；转入下一期间', example: '未使用の予算を、規定に従って翌年度へ繰り越します。', translation: '按规定将未使用预算结转至下一年度。', note: '常用于预算、余额和假期；不是任何延期都适用。' },
          { word: '切り上げる', reading: 'きりあげる', meaning: '提前或适时结束；向上取整', example: '今日は作業を早めに切り上げて、体を休めます。', translation: '今天早点结束工作，休息一下。', note: '数值用法如「小数点以下を切り上げる」；与「切り捨てる」相对。' },
        ],
      },
      {
        title: '数量を減らす・使い尽くす・補う',
        description: '扣减、用尽与补偿分别描述不同结果。',
        words: [
          { word: '差し引く', reading: 'さしひく', meaning: '扣除；减去', example: '売上から経費を差し引くと、利益は二十万円です。', translation: '从销售额中扣除费用后，利润为二十万日元。', note: '常用「AからBを差し引く」；不是一般意义的“拉开”。' },
          { word: '使い切る', reading: 'つかいきる', meaning: '全部用完；耗尽', example: '月末までに、今月の通信量を使い切ってしまいました。', translation: '还没到月底，就把这个月的流量用完了。', note: '强调剩余为零；「使い込む」则可能指长期熟用或挪用。' },
          { word: '埋め合わせる', reading: 'うめあわせる', meaning: '弥补；补偿', example: '休んだ分の遅れを、週末の復習で埋め合わせました。', translation: '我通过周末复习弥补了请假落下的进度。', note: '常与「不足・損失・遅れ」搭配；不是时间自动变得够用。' },
        ],
      },
    ],
    relatedSeriesIds: ['au', 'kiru-nuku', 'ageru'],
    triggers: ['間に合う', '持ち越す', '繰り越す', '切り上げる', '差し引く', '使い切る'],
    sources: [lexiconSource, structureSource, { title: '漢字ペディア：あう（間に合うの表記）', url: 'https://www.kanjipedia.jp/sakuin/doukunigi/items/0000030100' }],
  },
  {
    id: 'komu',
    title: '「～込む」の広がり',
    subtitle: '中へ入る／深く関わる／範囲を狭める',
    summary: '「～込む」既可以表示进入内部，也可以表示深入、集中或充分进行。技术语境中的“导入、嵌入、读取、筛选”适合放在一起辨析。',
    structure: '動詞の連用形＋込む',
    notes: [
      '先判断是具体或抽象的“进入内部”，还是程度、结果加深，不能一律译成“进入”。',
      '国研指出「～込む」可因具体用法而具有不同结构；本页按学习意义分组，不对每个词作单一的学术定性。',
      '「読み込む」在计算机语境是读取、加载；阅读语境也可表示仔细研读。',
    ],
    groups: [
      {
        title: '内部・仕組みへ入れる',
        description: '常见于数据、配置和功能集成。',
        words: [
          { word: '組み込む', reading: 'くみこむ', meaning: '编入；集成；纳入', example: '既存の画面に、検索機能を組み込みます。', translation: '把搜索功能集成到现有页面。', note: '强调成为整体或流程的一部分。' },
          { word: '埋め込む', reading: 'うめこむ', meaning: '埋入；嵌入', example: '記事に動画を埋め込む前に、表示速度を確認します。', translation: '把视频嵌入文章前，先确认显示速度。', note: '强调嵌在某个内部位置；与整体集成的「組み込む」侧重点不同。' },
          { word: '書き込む', reading: 'かきこむ', meaning: '写入；填写', example: '確認した結果を、共有の記録に書き込みました。', translation: '把确认结果写入了共享记录。', note: '常用「保存先にデータを書き込む」。' },
          { word: '読み込む', reading: 'よみこむ', meaning: '读取；加载；仔细阅读', example: '設定ファイルを読み込んでから、処理を開始します。', translation: '读取配置文件后再开始处理。', note: '普通阅读也可用「資料を何度も読み込む」表示反复研读。' },
        ],
      },
      {
        title: '取り入れる・関与する',
        description: '主体或对象进入某个范围，未必自愿。',
        words: [
          { word: '取り込む', reading: 'とりこむ', meaning: '取入；导入；吸收', example: '新しいデータを取り込み、集計を更新しました。', translation: '导入新数据，更新了汇总。', note: '比「組み込む」更着重从外部取入。' },
          { word: '持ち込む', reading: 'もちこむ', meaning: '带入；把问题带到某处', example: '個人用の端末を職場に持ち込むには、申請が必要です。', translation: '把个人设备带进工作场所需要申请。', note: '常用「場所に物を持ち込む」，也可说把私事带进工作。' },
          { word: '巻き込む', reading: 'まきこむ', meaning: '卷入；牵涉进来', example: '小さな変更が、別のチームまで巻き込む問題になりました。', translation: '一个小改动变成了牵涉其他团队的问题。', note: '被动「巻き込まれる」常带不情愿、受影响的语感。' },
          { word: '踏み込む', reading: 'ふみこむ', meaning: '踏入；深入触及', example: '現象の説明だけでなく、設計上の原因に踏み込みます。', translation: '不只解释现象，还要深入触及设计层面的原因。', note: '抽象用法常为「議論・原因・核心に踏み込む」。' },
        ],
      },
      {
        title: '集中・蓄積・見通し',
        description: '由“向内”扩展到集中、筛选和预估。',
        words: [
          { word: '抱え込む', reading: 'かかえこむ', meaning: '把问题或工作全揽在自己身上', example: '一人で仕事を抱え込まず、早めに相談してください。', translation: '不要独自揽下工作，请早点商量。', note: '常带负担过重、没有向外求助的语感。' },
          { word: '詰め込む', reading: 'つめこむ', meaning: '塞满；硬塞；集中灌输', example: '一日の予定に会議を詰め込みすぎました。', translation: '我把一天的日程塞进了太多会议。', note: '常与「詰め込みすぎる」搭配，表示缺少余地。' },
          { word: '絞り込む', reading: 'しぼりこむ', meaning: '缩小范围；筛选', example: '条件を追加して、候補を三件に絞り込みました。', translation: '追加条件，把候选项缩小到三项。', note: '「AをBに絞り込む」强调经过筛选后收窄。' },
          { word: '見込む', reading: 'みこむ', meaning: '预估；预期；看好', example: '移行作業には、二週間の余裕を見込んでいます。', translation: '迁移工作预留了两周的余量。', note: '既可说「成長を見込む」，也可说「費用を見込む」；不是已经确认的事实。' },
        ],
      },
    ],
    relatedSeriesIds: ['dasu', 'toru-hiku-sasu'],
    triggers: ['組み込む', '埋め込む', '書き込む', '読み込む', '取り込む', '持ち込む', '巻き込む', '踏み込む', '抱え込む', '詰め込む', '絞り込む', '見込む'],
    sources: [structureSource, lexiconSource],
  },
  {
    id: 'dasu',
    title: '「～出す」で外へ・明らかに',
    subtitle: '取り出す／洗い出す／打ち出す',
    summary: '由“从内部向外”扩展为提取信息、找出问题、提出方针。注意与表示动作开始的「～出す」区分。',
    structure: '動詞の連用形＋出す',
    notes: [
      '「取り出す」突出从里面取出；「抜き出す」突出从多个内容中选取某部分。',
      '「洗い出す」「導き出す」属于整体词义要记忆的表达，不能机械地译为“洗出来”“引导出去”。',
      '「雨が降り出す」中的「～出す」表示开始，是另一种常见用法；本系列先集中学习提取、呈现和排出。',
    ],
    groups: [
      {
        title: '外へ取り出す・持ち出す',
        description: '比较普通取出、选择性提取、携出和偷出。',
        words: [
          { word: '取り出す', reading: 'とりだす', meaning: '取出；提取', example: '圧縮ファイルから、必要な画像だけを取り出します。', translation: '从压缩文件中只取出需要的图片。', note: '核心是从容器、存储位置等内部取出来。' },
          { word: '抜き出す', reading: 'ぬきだす', meaning: '抽取；摘录', example: '報告書から、改善に関する意見を抜き出しました。', translation: '从报告中摘出了有关改进的意见。', note: '强调选出某部分；摘录并不一定删除原文。' },
          { word: '持ち出す', reading: 'もちだす', meaning: '带出；提出话题', example: '機密資料を、許可なく社外へ持ち出してはいけません。', translation: '未经许可，不得把机密资料带出公司。', note: '也可说「昔の話を持ち出す」，表示提起旧事。' },
          { word: '盗み出す', reading: 'ぬすみだす', meaning: '偷出；窃取后带走', example: '第三者が顧客情報を盗み出した可能性があります。', translation: '有第三方窃取客户信息的可能性。', note: '包含未经允许取得并带出的意思，不能替代普通的「取り出す」。' },
        ],
      },
      {
        title: '情報・根拠を明らかにする',
        description: '查全、推导和从对方口中获取信息，过程不同。',
        words: [
          { word: '洗い出す', reading: 'あらいだす', meaning: '全面查明；逐项找出', example: '公開前に、想定される障害を洗い出しました。', translation: '发布前，全面梳理了可能出现的故障。', note: '强调尽可能全面地找出项目，常与「課題・問題点・原因」搭配。' },
          { word: '導き出す', reading: 'みちびきだす', meaning: '推导出；得出', example: '複数の実験結果から、最適な条件を導き出しました。', translation: '根据多次实验结果，推导出了最佳条件。', note: '强调有依据的推导过程，不只是发现现成答案。' },
          { word: '聞き出す', reading: 'ききだす', meaning: '问出；设法打听到', example: '担当者から、手順が変更された理由を聞き出しました。', translation: '我从负责人那里问出了流程变更的原因。', note: '强调通过询问取得原本不容易知道的信息。' },
        ],
      },
      {
        title: '表に出す・入り口を閉ざす',
        description: '注意“提出”与“排除”是不同方向。',
        words: [
          { word: '打ち出す', reading: 'うちだす', meaning: '提出；公布方针；推出', example: '会社は、利用者支援を強化する方針を打ち出しました。', translation: '公司公布了加强用户支持的方针。', note: '常用「方針・対策・新機軸を打ち出す」。' },
          { word: '切り出す', reading: 'きりだす', meaning: '切取；开口提出话题', example: '会議の終わりに、予算の相談を切り出しました。', translation: '会议快结束时，我开口提出了预算方面的商谈。', note: '话题用法强调开始谈某件往往不易开口的事；也可指切取素材。' },
          { word: '締め出す', reading: 'しめだす', meaning: '关在外面；排除；禁止进入', example: '認証の設定ミスで、正規の利用者まで締め出されました。', translation: '认证配置错误，连合法用户也被拒之门外。', note: '「閉め出す」也表示关在门外；此处“排除”用「締め出す」。' },
        ],
      },
    ],
    relatedSeriesIds: ['komu', 'ageru'],
    triggers: ['取り出す', '抜き出す', '持ち出す', '盗み出す', '洗い出す', '導き出す', '聞き出す', '打ち出す', '切り出す', '締め出す'],
    sources: [lexiconSource, structureSource],
  },
  {
    id: 'ageru',
    title: '「～上げる・～上がる」の意味',
    subtitle: '完成／積み重ね／上昇／取り上げ',
    summary: '「上げる」不只表示向上移动，还可表示完成、提高或公开提出。把“使之上升”的他动词与“自然上升”的自动词一起比较。',
    structure: '動詞の連用形＋上げる（他動詞）／＋上がる（自動詞）',
    notes: [
      '「資料を作り上げる」着重完成；「売上を押し上げる」着重提高，不能只靠词尾判断意思。',
      '「読み上げる」通常指朗读，不等于「読み切る」（读完、完全看透）。',
      '「取り上げる」可能表示作为话题、拿起、没收等；这里先学习报道与讨论中常见的“选作话题”。',
    ],
    groups: [
      {
        title: '完成・積み重ね',
        description: '完成作品与逐步积累，重点不同。',
        words: [
          { word: '仕上げる', reading: 'しあげる', meaning: '完成；做最后加工', example: '提出前に、図表を整えて報告書を仕上げました。', translation: '提交前整理了图表，把报告最终完成。', note: '常着重完成的最后阶段。' },
          { word: '作り上げる', reading: 'つくりあげる', meaning: '制作完成；建立起来', example: '利用者の意見を取り入れ、仕組みを作り上げました。', translation: '吸收用户意见，建立起了这套机制。', note: '强调经过过程、努力后形成整体。' },
          { word: '積み上げる', reading: 'つみあげる', meaning: '堆积；逐步积累', example: '小さな改善を積み上げて、品質を高めます。', translation: '通过不断积累小改进，提高质量。', note: '他动词，常用「経験・実績・改善を積み上げる」。' },
          { word: '積み上がる', reading: 'つみあがる', meaning: '累积起来；堆积起来', example: '未処理の依頼が積み上がり、対応が遅れています。', translation: '未处理的请求不断积压，响应出现延迟。', note: '自动词，用「依頼が積み上がる」，与主动积累的「積み上げる」对应。' },
        ],
      },
      {
        title: '数値を上げる・数値が上がる',
        description: '区分外力带动、主动调整和突然上升。',
        words: [
          { word: '押し上げる', reading: 'おしあげる', meaning: '向上推；推高', example: '利用者の増加が、運用費用を押し上げています。', translation: '用户增加正在推高运维费用。', note: '常说明某因素带动数值上涨。' },
          { word: '引き上げる', reading: 'ひきあげる', meaning: '提高；上调；提起', example: '安全性を高めるため、審査基準を引き上げました。', translation: '为提高安全性，上调了审查标准。', note: '也可表示撤离、收回；结合搭配判断。' },
          { word: '跳ね上がる', reading: 'はねあがる', meaning: '猛涨；突然跳起', example: 'アクセスが集中し、応答時間が跳ね上がりました。', translation: '访问集中，响应时间突然大幅上升。', note: '自动词，强调幅度大、变化快。' },
        ],
      },
      {
        title: '声・話題・事実を表へ',
        description: '朗读、作为议题、显现，各自作为整体记忆。',
        words: [
          { word: '読み上げる', reading: 'よみあげる', meaning: '朗读；念出', example: '画面の内容を音声で読み上げる機能を追加しました。', translation: '增加了用语音朗读页面内容的功能。', note: '强调出声读，不能用来表达默读完一篇文章。' },
          { word: '取り上げる', reading: 'とりあげる', meaning: '选作话题；报道；拿起', example: '次の会議では、運用上の課題を取り上げます。', translation: '下次会议将讨论运维方面的问题。', note: '也可表示没收：「携帯電話を取り上げる」。本例是作为议题。' },
          { word: '浮かび上がる', reading: 'うかびあがる', meaning: '浮现；显露出来', example: '記録を比較すると、共通する原因が浮かび上がりました。', translation: '对比记录后，共同原因浮现了出来。', note: '自动词，常用于此前不明显的事实、问题变得清楚。' },
        ],
      },
    ],
    relatedSeriesIds: ['dasu', 'kiru-nuku', 'time-quantity'],
    triggers: ['仕上げる', '作り上げる', '積み上げる', '積み上がる', '押し上げる', '引き上げる', '跳ね上がる', '読み上げる', '取り上げる', '浮かび上がる'],
    sources: [structureSource, lexiconSource],
  },
  {
    id: 'kiru-nuku',
    title: '「～切る・～抜く」の到達点',
    subtitle: '完了／断定／途中で終了／困難を越える',
    summary: '「～切る」常表示彻底、全部完成；「～抜く」常表示克服困难坚持到底。但「打ち切る」是中途终止，「見抜く」是识破，须按整体词义辨析。',
    structure: '動詞の連用形＋切る／抜く',
    notes: [
      '「使い切る」表示用完全部；「打ち切る」表示停止继续，不能理解为顺利完成。',
      '「読み切る」是读完或彻底判断；「読み上げる」是朗读。',
      '「見抜く」表示看透本质，和「生き抜く」「考え抜く」的坚持到底义不同。',
    ],
    groups: [
      {
        title: '全部・最後まで',
        description: '强调达到终点或彻底完成。',
        words: [
          { word: '使い切る', reading: 'つかいきる', meaning: '全部用完', example: '予備の電池まで使い切ったので、補充が必要です。', translation: '连备用电池都用完了，需要补充。', note: '强调用尽，而不只是在使用。' },
          { word: 'やり切る', reading: 'やりきる', meaning: '坚持做完；全部完成', example: '難しい課題でしたが、最後までやり切りました。', translation: '虽然任务很难，但还是坚持完成了。', note: '常伴随努力、成就感；不等于只是停止。' },
          { word: '読み切る', reading: 'よみきる', meaning: '读完；完全看透、判断透', example: '長い仕様書を、二日かけて読み切りました。', translation: '我花两天读完了很长的规格说明书。', note: '「相手の意図を読み切る」则是彻底看透对方意图。' },
        ],
      },
      {
        title: '断定・継続の終了',
        description: '“说得肯定”和“中途停止”都不能按完成义直译。',
        words: [
          { word: '言い切る', reading: 'いいきる', meaning: '断言；把话说完', example: '一度の実験だけでは、安全だと言い切れません。', translation: '只凭一次实验，不能断言是安全的。', note: '「～と言い切れない」常用于保留判断。' },
          { word: '打ち切る', reading: 'うちきる', meaning: '中止；截止；终止继续', example: '期限までに改善が見られず、試験運用を打ち切りました。', translation: '到期限仍未见改善，因此终止了试运行。', note: '强调不再继续，不表示所有计划内容均已完成。' },
        ],
      },
      {
        title: '困難を越える・本質を捉える',
        description: '「～抜く」的坚持义与识破义分开记忆。',
        words: [
          { word: '生き抜く', reading: 'いきぬく', meaning: '顽强生存；熬过困境', example: '変化の激しい時代を生き抜くには、学び続ける姿勢が必要です。', translation: '要在变化剧烈的时代立足，需要持续学习的态度。', note: '常用于困难环境中的生存；不只是一般的“生活”。' },
          { word: '考え抜く', reading: 'かんがえぬく', meaning: '深入思考到底；反复想透', example: '利用者の立場から考え抜き、操作を一つ減らしました。', translation: '从用户立场反复想透后，减少了一个操作步骤。', note: '强调充分思考、坚持思考的过程。' },
          { word: '見抜く', reading: 'みぬく', meaning: '识破；看穿本质', example: '経験のある担当者が、数値の不自然さを見抜きました。', translation: '有经验的负责人看出了数值的异常。', note: '指看穿隐藏事实；不等于“看完”。' },
        ],
      },
    ],
    relatedSeriesIds: ['ageru', 'time-quantity', 'naosu-kaesu'],
    triggers: ['使い切る', '打ち切る', '生き抜く', '見抜く'],
    sources: [structureSource, lexiconSource],
  },
  {
    id: 'naosu-kaesu',
    title: '「～直す・～返す」で再び',
    subtitle: 'やり直す／見直す／繰り返す',
    summary: '「～直す」多表示为修正或改善而重做；「～返す」多表示重复、反向动作或回应。相似的“再来一次”，目的和方向并不相同。',
    structure: '動詞の連用形＋直す／返す',
    notes: [
      '「作り直す」是重新制作；「見直す」可以是复查、调整方案，也可以表示重新肯定评价，并非一定从头做。',
      '「聞き返す」通常是没听清后再问；「聞き直す」也可指重新听录音、重新询问。',
      '「折り返す」有掉头返回、回电等整体用法，不能一律译成重复。',
    ],
    groups: [
      {
        title: 'もう一度取り組む・組み替える',
        description: '为修正结果而重做，或重新审视。',
        words: [
          { word: 'やり直す', reading: 'やりなおす', meaning: '重做；重新开始', example: '条件を間違えたため、実験を最初からやり直します。', translation: '由于条件弄错，要从头重做实验。', note: '范围较广，具体做什么由上下文决定。' },
          { word: '作り直す', reading: 'つくりなおす', meaning: '重新制作', example: '変更された要件に合わせて、画面を作り直しました。', translation: '根据变更后的需求，重新制作了页面。', note: '着重重新制作对象；比普通的局部修正程度更强。' },
          { word: '見直す', reading: 'みなおす', meaning: '重新检查；重新考虑；重新评价', example: '公開前に、権限の設定を見直します。', translation: '发布前，重新检查权限设置。', note: '「彼の仕事を見直した」也可表示对他的工作刮目相看。' },
          { word: '立て直す', reading: 'たてなおす', meaning: '重整；恢复；重新制定', example: '障害対応のあとで、開発計画を立て直しました。', translation: '处理故障后，重新调整了开发计划。', note: '常与「計画・経営・体制」搭配，不只表示重建物理建筑。' },
        ],
      },
      {
        title: '対象の状態を直す',
        description: '前项保留具体动作，后项表示重新进行。',
        words: [
          { word: '張り直す', reading: 'はりなおす', meaning: '重新张设；重新布置、拉紧', example: 'たるんだロープを張り直し、安全を確認しました。', translation: '重新拉紧松弛的绳子，并确认了安全。', note: '「張る」是拉紧、铺设等；粘贴纸张等通常写「貼り直す」，不要混淆字形。' },
          { word: '詰め直す', reading: 'つめなおす', meaning: '重新装填；重新压紧；重新推敲细节', example: '配送中に動かないよう、箱の中身を詰め直しました。', translation: '为了防止运输途中晃动，重新装填了箱内物品。', note: '讨论中也可说「条件を詰め直す」，表示重新谈细节。' },
        ],
      },
      {
        title: '反復・返答・戻る動き',
        description: '同样是“再”，有时强调反复，有时强调返回或回应。',
        words: [
          { word: '繰り返す', reading: 'くりかえす', meaning: '重复；反复进行', example: '同じ障害を繰り返さないよう、原因を記録します。', translation: '记录原因，以免反复发生同样的故障。', note: '整体词义已固定；重复本身不一定带有修正目的。' },
          { word: '聞き返す', reading: 'ききかえす', meaning: '反问；没听清后再问', example: '説明の最後が聞こえず、もう一度聞き返しました。', translation: '没听到说明的最后部分，所以又问了一遍。', note: '强调向对方请求重说或确认，不是自己反复播放录音。' },
          { word: '読み返す', reading: 'よみかえす', meaning: '重读；回头再读', example: '送信する前に、メールを読み返しました。', translation: '发送前，把邮件重新读了一遍。', note: '强调再读；是否修改不由这个词单独决定。' },
          { word: '折り返す', reading: 'おりかえす', meaning: '折回；回电、回信；折叠回去', example: '会議が終わり次第、折り返しお電話します。', translation: '会议一结束，我就给您回电话。', note: '商务联系中常用连用形「折り返し」；物理移动时也可表示到某处掉头返回。' },
        ],
      },
    ],
    relatedSeriesIds: ['kiru-nuku', 'toru-hiku-sasu'],
    triggers: ['やり直す', '作り直す', '見直す', '立て直す', '張り直す', '詰め直す', '繰り返す', '折り返す'],
    sources: [structureSource, lexiconSource],
  },
  {
    id: 'toru-hiku-sasu',
    title: '「取り～・引き～・差し～」の系列',
    subtitle: '除去・取り違い／継承・原因／交換・控除',
    summary: '这组词由常见前项来串联。前项有时保留动作意义，有时弱化成接头语式作用；不能把「取り」「引き」「差し」各自固定翻成一个中文词。',
    structure: '取る・引く・差すの連用形＋後項動詞',
    notes: [
      '国研将部分前项意义弱化的词分析为接头语化类型；但不是所有「取り～」「引き～」「差し～」都属于同一结构。',
      '「取り消す」是取消已作决定等；「取りやめる」是决定不再做；「取り除く」是除去对象。',
      '「引き継ぐ」是从前任接续；「引き受ける」是接受责任。可以同时发生，但不能互换。',
    ],
    groups: [
      {
        title: '取り～：除く・やめる',
        description: '除去、拆下、撤销与取消实施分别记忆。',
        words: [
          { word: '取り除く', reading: 'とりのぞく', meaning: '除去；消除', example: '公開前に、不要な個人情報を取り除きました。', translation: '发布前，删除了不需要的个人信息。', note: '常与「原因・障害・不安・不要なもの」搭配。' },
          { word: '取り外す', reading: 'とりはずす', meaning: '拆下；卸下', example: '交換するため、古い部品を取り外します。', translation: '为了更换，先拆下旧部件。', note: '强调从安装、连接状态分离，不一定丢弃该物。' },
          { word: '取り消す', reading: 'とりけす', meaning: '撤销；取消', example: '日程が変更されたので、予約を取り消しました。', translation: '由于日程变更，取消了预约。', note: '可用于预约、申请、决定、发言等。' },
          { word: '取りやめる', reading: 'とりやめる', meaning: '决定停止；取消原定实施', example: '悪天候のため、屋外での実験を取りやめました。', translation: '由于天气恶劣，取消了户外实验。', note: '强调不再实施原定动作；不只是抹去记录。' },
        ],
      },
      {
        title: '取り～：間違い・漏れ・残り',
        description: '不同类型的失误不能统一译为“遗漏”。',
        words: [
          { word: '取り違える', reading: 'とりちがえる', meaning: '拿错；认错；理解错', example: '似た名前の設定項目を取り違えていました。', translation: '我把名称相近的配置项弄混了。', note: '涉及两个对象之间的混淆；不等于忘记。' },
          { word: '取りこぼす', reading: 'とりこぼす', meaning: '漏掉本应取得的内容；错失', example: '検索条件が厳しすぎると、重要な記録を取りこぼします。', translation: '搜索条件太严格，会漏掉重要记录。', note: '强调本应捕捉、获得的内容没有取得。' },
          { word: '取り残す', reading: 'とりのこす', meaning: '留下未处理；落下；抛在后面', example: '移行作業で、古い設定だけを取り残してしまいました。', translation: '迁移时，把旧配置漏在了处理范围之外。', note: '被动「変化に取り残される」表示被变化甩在后面。' },
        ],
      },
      {
        title: '引き～：受け持つ・つなぐ・生じさせる',
        description: '接受责任、继承工作和引发结果，核心动作不同。',
        words: [
          { word: '引き受ける', reading: 'ひきうける', meaning: '承担；接受委托', example: '次の更新作業は、私が引き受けます。', translation: '下次更新工作由我来承担。', note: '着重接受任务、责任或请求。' },
          { word: '引き継ぐ', reading: 'ひきつぐ', meaning: '接手；移交；继承', example: '前任者から、運用の手順を引き継ぎました。', translation: '从前任那里接手了运维流程。', note: '可用「Aから仕事を引き継ぐ」接手，也可用「Bに仕事を引き継ぐ」移交。' },
          { word: '引き起こす', reading: 'ひきおこす', meaning: '引发；导致；扶起', example: '一つの設定ミスが、大きな障害を引き起こしました。', translation: '一个配置错误引发了严重故障。', note: '因果用法多搭配「問題・障害・事故」，常带负面结果。' },
        ],
      },
      {
        title: '差し～：交換・控除',
        description: '前项意义已弱化，需记忆整个动词的搭配。',
        words: [
          { word: '差し替える', reading: 'さしかえる', meaning: '替换；换成另一份', example: '古い図を、修正済みの図に差し替えました。', translation: '把旧图替换成修正后的图。', note: '常用「AをBに差し替える」；重点是用新的替代原有的。' },
          { word: '差し引く', reading: 'さしひく', meaning: '扣除；减去；综合权衡', example: '手数料を差し引いた金額が、口座に入金されます。', translation: '扣除手续费后的金额会汇入账户。', note: '数量义先记「AからBを差し引く」；也可抽象地表示权衡利弊。' },
        ],
      },
    ],
    relatedSeriesIds: ['komu', 'dasu', 'naosu-kaesu', 'time-quantity'],
    triggers: ['取り除く', '取り外す', '取り消す', '取りやめる', '取り違える', '取りこぼす', '取り残す', '引き受ける', '引き継ぐ', '引き起こす', '差し替える', '差し引く'],
    sources: [structureSource, lexiconSource],
  },
]
