import type { DailyLesson, GrammarItem, VocabularyItem } from '../types'
import { lesson as rawLatestLesson } from './lesson'

type ReviewFocus = { type: '词汇' | '文法' | '读解'; title: string; detail: string }
type HistoryItem = { date: string; day: number; title: string; minutes: number; merged: boolean }
type VSeed = Omit<VocabularyItem, 'id' | 'jlpt'>
type GSeed = Omit<GrammarItem, 'id'>
type Seed = {
  date: string
  day: number
  title: string
  subtitle: string
  minutes: number
  immersionTitle: string
  ja: [string, string, string]
  zh: [string, string, string]
  notes: [string, string, string]
  vocab: [string, string, string, string]
  grammar: [string, string, string]
  readingTitle: string
  reading: [string, string]
  correct: string
  wrong: [string, string, string]
  explanation: string
  merged?: boolean
}

const vocab: Record<string, VSeed> = {
  '芳しい': { word: '芳しい', reading: 'かんばしい', meaning: '令人满意的；情况良好的（多与否定搭配）', partOfSpeech: 'い形容詞', example: 'PoCの結果が芳しくなければ、前提から見直します。', translation: '如果 PoC 结果不理想，就从前提重新审视。', collocations: ['結果が芳しくない', '成績が芳しくない', '反応が芳しくない'], nuance: '实际使用中「芳しくない」尤其常见，表示结果不理想。' },
  '管轄': { word: '管轄', reading: 'かんかつ', meaning: '管辖；负责范围', partOfSpeech: '名詞・サ変', example: 'Security Teamの管轄範囲を明確にします。', translation: '明确 Security Team 的管辖范围。', collocations: ['管轄する', '管轄範囲', '管轄部署'], nuance: '行政、组织、权限边界场景都很常见。' },
  'ひとまず': { word: 'ひとまず', reading: 'ひとまず', meaning: '暂且；姑且先', partOfSpeech: '副詞', example: 'ひとまず影響範囲を確認し、その後で恒久対策を考えます。', translation: '先暂且确认影响范围，之后再考虑永久对策。', collocations: ['ひとまず確認する', 'ひとまず対応する', 'ひとまず落ち着く'], nuance: '强调先完成当前必要的一步，不等于最终解决。' },
  '割り当てる': { word: '割り当てる', reading: 'わりあてる', meaning: '分配；指派', partOfSpeech: '動詞・一段', example: 'Agentの役割に応じて必要な権限だけを割り当てます。', translation: '根据 Agent 的角色只分配必要权限。', collocations: ['権限を割り当てる', 'Roleを割り当てる', 'Resourceを割り当てる'], nuance: 'IT 中常用于 Role、Permission、Resource 的正式分配。' },
  '行政': { word: '行政', reading: 'ぎょうせい', meaning: '行政；行政机关的活动', partOfSpeech: '名詞', example: '行政手続きでも生成AIの活用が広がっています。', translation: '行政手续中生成 AI 的应用也在扩大。', collocations: ['行政機関', '行政手続き', '行政サービス'], nuance: '重点是读音「ぎょうせい」，容易被汉字直觉干扰。' },
  '当面': { word: '当面', reading: 'とうめん', meaning: '目前；眼下一段时间', partOfSpeech: '名詞・副詞', example: '当面はRead-onlyで運用し、実績を見て権限を広げます。', translation: '目前先按只读方式运维，再根据实绩扩大权限。', collocations: ['当面の課題', '当面は～', '当面の間'], nuance: '比「しばらく」更正式，常用于商务和政策语境。' },
  '目まぐるしい': { word: '目まぐるしい', reading: 'めまぐるしい', meaning: '变化极快的；令人应接不暇的', partOfSpeech: 'い形容詞', example: 'AI分野は目まぐるしく変化しています。', translation: 'AI 领域变化非常快。', collocations: ['目まぐるしい変化', '目まぐるしく変わる', '目まぐるしい展開'], nuance: '强调变化速度快到令人难以跟上。' },
  'ひそかに': { word: 'ひそかに', reading: 'ひそかに', meaning: '暗中；悄悄地', partOfSpeech: '副詞', example: '攻撃者がひそかにCredentialを収集する可能性があります。', translation: '攻击者可能暗中收集 Credential。', collocations: ['ひそかに進める', 'ひそかに期待する', 'ひそかに収集する'], nuance: '比「こっそり」更书面。' },
  '打ち切る': { word: '打ち切る', reading: 'うちきる', meaning: '终止；明确结束', partOfSpeech: '動詞・五段', example: '必要な一次情報がそろった時点で探索を打ち切ります。', translation: '必要的一手信息齐全后终止继续搜索。', collocations: ['調査を打ち切る', '探索を打ち切る', '交渉を打ち切る'], nuance: '比「止める」正式，常表示流程被明确终止。' },
  '絞る': { word: '絞る', reading: 'しぼる', meaning: '限定；缩小范围', partOfSpeech: '動詞・五段', example: 'AIに任せる範囲をTask単位で絞ります。', translation: '按 Task 限定交给 AI 的范围。', collocations: ['用途を絞る', '範囲を絞る', '候補を絞る'], nuance: '技术面试中常用于 Scope、Permission、Candidate。' },
  '引き受ける': { word: '引き受ける', reading: 'ひきうける', meaning: '接手；承担', partOfSpeech: '動詞・一段', example: 'Gatewayが認証と監査を一元的に引き受けます。', translation: '由 Gateway 统一承担认证与审计。', collocations: ['責任を引き受ける', '処理を引き受ける', '業務を引き受ける'], nuance: '有“从其他地方接过来并负责”的语感。' },
  '煩雑な': { word: '煩雑な', reading: 'はんざつな', meaning: '繁杂的；步骤多且难管理的', partOfSpeech: 'な形容詞', example: '接続先が増えると認証管理が煩雑になります。', translation: '连接目标增加后认证管理会变得繁杂。', collocations: ['煩雑な手順', '管理が煩雑だ', '煩雑さを減らす'], nuance: '不是单纯“困难”，而是细节和步骤过多。' },
  '見逃す': { word: '見逃す', reading: 'みのがす', meaning: '漏掉；未发现', partOfSpeech: '動詞・五段', example: '同じModelだけでReviewすると前提ミスを見逃すことがあります。', translation: '只用同一模型 Review 时可能漏掉前提错误。', collocations: ['問題を見逃す', '異常を見逃す', '見逃しを減らす'], nuance: '测试与安全场景里常表示“未检出”。' },
  '委譲する': { word: '委譲する', reading: 'いじょうする', meaning: '委托；移交权限或责任', partOfSpeech: '名詞・サ変', example: 'Sub-agentへTaskを委譲するときは必要な権限だけを渡します。', translation: '向 Sub-agent 委托任务时只授予必要权限。', collocations: ['権限を委譲する', 'Taskを委譲する', '責任を委譲する'], nuance: '比「任せる」正式，常用于权限与职权转移。' },
  '後押しする': { word: '後押しする', reading: 'あとおしする', meaning: '推动；助推', partOfSpeech: '名詞・サ変', example: '共通の認証基盤がEnterprise採用を後押しします。', translation: '统一认证基础设施推动企业采用。', collocations: ['普及を後押しする', '導入を後押しする', '成長を後押しする'], nuance: '通过制度、条件或资源促成进展。' },
  '明示的に': { word: '明示的に', reading: 'めいじてきに', meaning: '明确地；显式地', partOfSpeech: '副詞', example: 'Productionで使うModelとPermissionを明示的に指定します。', translation: '在 Production 中明确指定 Model 与 Permission。', collocations: ['明示的に指定する', '明示的に許可する', '明示的に定義する'], nuance: '技术文档里常与 implicit 相对。' },
  '乗っ取る': { word: '乗っ取る', reading: 'のっとる', meaning: '劫持；夺取控制权', partOfSpeech: '動詞・五段', example: '悪意あるDependencyがLocal Agentを乗っ取るRiskがあります。', translation: '恶意依赖存在劫持 Local Agent 的风险。', collocations: ['Accountを乗っ取る', 'Sessionを乗っ取る', 'Agentを乗っ取る'], nuance: 'Security 新闻中常指控制权被夺取。' },
  '迂回する': { word: '迂回する', reading: 'うかいする', meaning: '绕过；绕行', partOfSpeech: '名詞・サ変', example: 'Prompt上の禁止だけではRuntimeの制御を迂回される可能性があります。', translation: '只有 Prompt 禁止规则时，Runtime 控制仍可能被绕过。', collocations: ['認証を迂回する', '制御を迂回する', '対策を迂回する'], nuance: 'Security 语境对应 bypass。' },
  '据え置く': { word: '据え置く', reading: 'すえおく', meaning: '维持不变；暂不调整', partOfSpeech: '動詞・五段', example: '単価を据え置いても利用量が増えれば総Costは上がります。', translation: '即使单价保持不变，使用量增加也会推高总成本。', collocations: ['価格を据え置く', '料金を据え置く', '条件を据え置く'], nuance: '商务报道中常表示“本可调整但选择维持现状”。' },
  'もたらす': { word: 'もたらす', reading: 'もたらす', meaning: '带来；造成', partOfSpeech: '動詞・五段', example: 'Agent Automationが必ずBusiness Valueをもたらすとは限りません。', translation: 'Agent 自动化并不一定会带来业务价值。', collocations: ['価値をもたらす', '変化をもたらす', 'Riskをもたらす'], nuance: '书面感强，可用于正面或负面结果。' },
  '把握する': { word: '把握する', reading: 'はあくする', meaning: '掌握；系统了解', partOfSpeech: '名詞・サ変', example: 'まず組織内のAgentとTool権限を把握します。', translation: '首先掌握组织内 Agent 与 Tool 权限。', collocations: ['状況を把握する', '所在を把握する', '全体像を把握する'], nuance: '比「見る」「知る」正式，强调系统性了解。' },
  '絞り込む': { word: '絞り込む', reading: 'しぼりこむ', meaning: '逐步缩小范围；筛选', partOfSpeech: '動詞・五段', example: '参照できるMemoryをTenant単位に絞り込みます。', translation: '把可参照的 Memory 限制到 Tenant 级。', collocations: ['範囲を絞り込む', '候補を絞り込む', '結果を絞り込む'], nuance: '比「絞る」更强调经过条件过滤后进一步缩小。' },
  '継承する': { word: '継承する', reading: 'けいしょうする', meaning: '继承；沿用', partOfSpeech: '名詞・サ変', example: 'Team設定がない利用者は全社Defaultを継承します。', translation: '没有 Team 设置的用户继承全公司默认值。', collocations: ['設定を継承する', '権限を継承する', 'Defaultを継承する'], nuance: '常用于设置、规则、权限和组织知识的继承。' },
  '跳ね上がる': { word: '跳ね上がる', reading: 'はねあがる', meaning: '急剧上升；猛增', partOfSpeech: '動詞・五段', example: 'Agentが大量Queryを繰り返すとCostが跳ね上がる可能性があります。', translation: 'Agent 反复产生大量 Query 时成本可能猛增。', collocations: ['コストが跳ね上がる', '価格が跳ね上がる', '負荷が跳ね上がる'], nuance: '比「増える」更强调突然且幅度很大的增长。' },
  '頼る': { word: '頼る', reading: 'たよる', meaning: '依赖；依靠', partOfSpeech: '動詞・五段', example: 'LLMだけに頼らずRuleとTestを組み合わせます。', translation: '不只依赖 LLM，而是结合 Rule 与 Test。', collocations: ['AIだけに頼る', '経験に頼る', '人手に頼る'], nuance: '有把解决能力寄托在某对象上的语感。' },
  '怠る': { word: '怠る', reading: 'おこたる', meaning: '疏忽；怠于执行', partOfSpeech: '動詞・五段', example: '修正後のRegression Testを怠ってはいけません。', translation: '不能疏忽修复后的回归测试。', collocations: ['確認を怠る', '検証を怠る', '対策を怠る'], nuance: '书面且带责任意味，比「忘れる」更严肃。' },
  '見直す': { word: '見直す', reading: 'みなおす', meaning: '重新审视；重新调整', partOfSpeech: '動詞・五段', example: 'PoCの結果を踏まえてAIに任せる範囲を見直します。', translation: '基于 PoC 结果重新审视交给 AI 的范围。', collocations: ['方法を見直す', '設定を見直す', '権限を見直す'], nuance: '强调先重新评价，再进行调整。' },
  '足掛かり': { word: '足掛かり', reading: 'あしがかり', meaning: '突破口；进一步行动的入口', partOfSpeech: '名詞', example: '古いCredentialが攻撃の足掛かりにならないよう棚卸しします。', translation: '盘点旧 Credential，避免成为攻击突破口。', collocations: ['攻撃の足掛かり', '解決の足掛かり', '足掛かりにする'], nuance: 'Security 语境中常指 Attack Chain 的起点。' },
  '認める': { word: '認める', reading: 'みとめる', meaning: '承认；认可', partOfSpeech: '動詞・一段', example: '想定外の挙動を認めた時点でIncident Responseを開始します。', translation: '在承认存在预期外行为时启动 Incident Response。', collocations: ['事実を認める', '問題を認める', '必要性を認める'], nuance: '既可表示承认事实，也可表示认可价值或资格。' },
  '追跡する': { word: '追跡する', reading: 'ついせきする', meaning: '追踪；跟踪', partOfSpeech: '名詞・サ変', example: 'AI機能の利用ActionをUser単位で追跡します。', translation: '按用户追踪 AI 功能的使用行为。', collocations: ['操作を追跡する', '変更履歴を追跡する', '利用を追跡する'], nuance: '强调沿时间或路径持续追查。' },
  '切り分ける': { word: '切り分ける', reading: 'きりわける', meaning: '切分；定位原因', partOfSpeech: '動詞・一段', example: 'Model、Tool、Contextのどこに原因があるか切り分けます。', translation: '定位原因究竟在 Model、Tool 还是 Context。', collocations: ['原因を切り分ける', '障害を切り分ける', '問題を切り分ける'], nuance: '日本 IT 现场高频排障词。' },
  '偏る': { word: '偏る', reading: 'かたよる', meaning: '偏向；不均衡', partOfSpeech: '動詞・五段', example: 'Evaluation Dataが特定Tenantに偏らないようにします。', translation: '避免评估数据偏向特定 Tenant。', collocations: ['Dataが偏る', '評価が偏る', '特定Caseに偏る'], nuance: '数据、观点、资源分布都可以使用。' },
  '実態': { word: '実態', reading: 'じったい', meaning: '实际情况；实态', partOfSpeech: '名詞', example: 'DashboardだけでなくAssetの利用実態を把握します。', translation: '不只看 Dashboard，也掌握 Asset 的实际使用情况。', collocations: ['実態を把握する', '利用実態', '実態が浮き彫りになる'], nuance: '比「状況」更强调真实状态。' },
  '死角': { word: '死角', reading: 'しかく', meaning: '盲区；未被管理的风险区域', partOfSpeech: '名詞', example: '古いIDがSecurityの死角にならないよう棚卸しします。', translation: '盘点旧 ID，避免形成 Security 盲区。', collocations: ['Securityの死角', '死角をなくす', '死角が生じる'], nuance: '原义是视觉盲区，Security 中常比喻不可见 Risk。' },
  '両立する': { word: '両立する', reading: 'りょうりつする', meaning: '兼顾；让两个目标同时成立', partOfSpeech: '名詞・サ変', example: '推論性能とData Governanceを両立できる構成を選びます。', translation: '选择能够兼顾推理性能与 Data Governance 的架构。', collocations: ['Securityと利便性を両立する', '性能とCostを両立する', '二つを両立する'], nuance: '常用于存在 Trade-off 的两个目标。' },
  '適合する': { word: '適合する', reading: 'てきごうする', meaning: '符合；适合', partOfSpeech: '名詞・サ変', example: '候補Serviceが自社Workloadに適合するか検証します。', translation: '验证候选 Service 是否适合自家 Workload。', collocations: ['要件に適合する', '仕様に適合する', 'Workloadに適合する'], nuance: '比「合う」正式，规格与选型文档中常用。' },
  'ひも付ける': { word: 'ひも付ける', reading: 'ひもづける', meaning: '关联；绑定', partOfSpeech: '動詞・一段', example: '各AI Requestに確認済みのUser IDをひも付けます。', translation: '为每个 AI Request 绑定已验证的 User ID。', collocations: ['IDをひも付ける', 'CostをOwnerにひも付ける', '利用者とRequestをひも付ける'], nuance: '日本 IT 现场常用，强调明确映射。' },
  '妨げる': { word: '妨げる', reading: 'さまたげる', meaning: '妨碍；阻碍', partOfSpeech: '動詞・一段', example: 'Security Ruleが開発速度を不必要に妨げないようにします。', translation: '避免 Security Rule 不必要地阻碍开发速度。', collocations: ['進行を妨げる', '利用を妨げる', '成長を妨げる'], nuance: '比「邪魔する」正式。' },
  '粒度': { word: '粒度', reading: 'りゅうど', meaning: '粒度；信息或控制的细致程度', partOfSpeech: '名詞', example: '部門間でDataの粒度をそろえてからAgentに渡します。', translation: '统一部门间 Data 粒度后再交给 Agent。', collocations: ['データの粒度', '粒度をそろえる', '細かい粒度で管理する'], nuance: '技术现场常用于讨论“细到什么层级”。' },
  '懸念': { word: '懸念', reading: 'けねん', meaning: '担忧；正式风险顾虑', partOfSpeech: '名詞・サ変', example: '予想外のAI利用料金と情報漏えいには運用上の懸念があります。', translation: '意外 AI 费用和信息泄漏存在运维上的担忧。', collocations: ['懸念がある', '懸念を抱く', 'Security上の懸念'], nuance: '比「心配」更正式，常见于会议、报告和风险说明。' },
}

const grammar: Record<string, GSeed> = {
  '～なくしては': { pattern: '～なくしては', meaning: '如果没有……就无法……', form: 'N + なくしては', register: '书面语・正式', frequency: 5, explanation: '强调前项是后项成立不可缺少的条件。', example: '継続的な復習なくしては、N1語彙の定着は難しい。', translation: '没有持续复习，就很难牢固掌握 N1 词汇。', comparison: '比「なければ」更正式，也更强调不可缺少。' },
  '～くらいなら': { pattern: '～くらいなら', meaning: '与其……倒不如……', form: 'V辞書形 + くらいなら', register: '口语・评论', frequency: 4, explanation: '对前项做负面评价，并选择后项作为更可接受方案。', example: '答えだけ覚えるくらいなら、もう一度本文を読み直したほうがいい。', translation: '与其只记答案，不如重新读一遍正文。', comparison: '常和「ほうがいい」一起表达取舍。' },
  '～とするには': { pattern: '～とするには', meaning: '如果要……；为了……', form: 'V普通形 + とするには', register: '书面语', frequency: 4, explanation: '提出实现某目标所需的条件或前提。', example: '本番運用するとするには、監査Logが必要です。', translation: '如果要投入生产运用，就需要审计日志。', comparison: '「ためには」更普遍；本句型更带假设与条件判断。' },
  '～に越したことはない': { pattern: '～に越したことはない', meaning: '最好……；没有比……更好', form: '普通形 + に越したことはない', register: '口语・书面语', frequency: 4, explanation: '表示某做法虽非绝对必要，但从安全或理想角度最好如此。', example: '重要な設定は事前に確認しておくに越したことはありません。', translation: '重要设置最好事先确认。', comparison: '比「ほうがいい」更像一般性的最佳实践。' },
  '～てくれたものだ': { pattern: '～てくれたものだ', meaning: '以前常常为我……（带回忆/感慨）', form: 'Vて + くれたものだ', register: '回忆・会话', frequency: 3, explanation: '回忆过去他人为自己反复做过的事情，并带有感慨。', example: '先生は難しい文法を何度も説明してくれたものです。', translation: '以前老师常常反复给我讲解难文法。', comparison: '不是单纯一次性的授受表达，重点在回忆过去的反复状态。' },
  '～みたいなところがある': { pattern: '～みたいなところがある', meaning: '有点像……；有……的一面', form: '普通形 / N + みたいなところがある', register: '口语', frequency: 3, explanation: '对人或事物的一种倾向、特征做不完全断定。', example: '彼には一つの問題に集中しすぎるみたいなところがあります。', translation: '他有点容易过度集中在一个问题上的倾向。', comparison: '比直接断言更委婉。' },
  '～にとらわれず': { pattern: '～にとらわれず', meaning: '不受……束缚；不拘泥于……', form: 'N + にとらわれず', register: '书面语・商务', frequency: 4, explanation: '表示不被既有标准或表面指标限制。', example: '利用回数にとらわれず、業務成果でAIを評価します。', translation: '不拘泥于使用次数，而按业务成果评价 AI。', comparison: '比「気にせず」更正式。' },
  '～かねない': { pattern: '～かねない', meaning: '有可能……（多为不良结果）', form: 'Vます去ます + かねない', register: '书面语・正式', frequency: 5, explanation: '表示某风险从当前条件看确实可能发生。', example: '権限が広すぎると重大Incidentにつながりかねません。', translation: '权限过大可能导致重大 Incident。', comparison: '比「かもしれない」更常用于风险警告。' },
  '～にとどまらず': { pattern: '～にとどまらず', meaning: '不止于……；不仅限于……', form: 'N / V辞書形 + にとどまらず', register: '书面语', frequency: 5, explanation: '强调范围从前项继续扩大到后项。', example: 'Model性能にとどまらず、運用とGovernanceまで評価します。', translation: '不只评价模型性能，也评价运维与治理。', comparison: '比「だけでなく」更书面。' },
  '～を余儀なくされる': { pattern: '～を余儀なくされる', meaning: '被迫……；不得不……', form: 'N + を余儀なくされる', register: '新闻・正式', frequency: 5, explanation: '表示因外部情况没有选择，只能采取某行动。', example: 'Credential漏えいで全Keyの再発行を余儀なくされました。', translation: '因 Credential 泄漏被迫重新签发全部 Key。', comparison: '比「なければならない」更强调外部强制。' },
  '～一方で': { pattern: '～一方で', meaning: '一方面……另一方面……', form: '普通形 + 一方で', register: '书面语・评论', frequency: 5, explanation: '把两个并存但方向不同的事实放在一起比较。', example: 'Agentは便利である一方で、権限管理のRiskも大きいです。', translation: 'Agent 很方便，但另一方面权限管理风险也大。', comparison: '比「でも」更适合结构化表达 Trade-off。' },
  '～に応じて': { pattern: '～に応じて', meaning: '根据……；随着……', form: 'N + に応じて', register: '书面语・商务', frequency: 5, explanation: '前项条件变化时，后项作相应调整。', example: 'Risk Levelに応じてAgentの権限を変えます。', translation: '根据风险等级调整 Agent 权限。', comparison: '比「によって」更强调对应调整。' },
  '～たうえで': { pattern: '～たうえで', meaning: '在……之后；在……基础上', form: 'Vた + うえで', register: '书面语・商务', frequency: 5, explanation: '先完成前项，再基于其结果做后项判断。', example: '要件を整理したうえで利用するToolを選びます。', translation: '梳理要求之后再选择要使用的 Tool。', comparison: '比「てから」更正式，并强调前项是判断基础。' },
  '～に至るまで': { pattern: '～に至るまで', meaning: '甚至到……；从……直到……', form: 'N + に至るまで', register: '书面语', frequency: 4, explanation: '列举范围终点，强调覆盖非常广。', example: 'Model選定からAudit設計に至るまで一貫して確認します。', translation: '从模型选择直到审计设计都进行一致确认。', comparison: '比「まで」更强调范围广度。' },
  '～に際して': { pattern: '～に際して', meaning: '在……之际', form: 'N / V辞書形 + に際して', register: '正式・书面语', frequency: 4, explanation: '用于重要事件、变更或导入时说明原则和注意事项。', example: 'System移行に際して互換性を事前に確認します。', translation: '在系统迁移之际事先确认兼容性。', comparison: '与「にあたって」接近，更偏事件节点。' },
  '～に即して': { pattern: '～に即して', meaning: '按照……；依据……', form: 'N + に即して', register: '正式・书面语', frequency: 4, explanation: '表示判断或措施贴合实际情况、规则或目的。', example: '自社Workloadの実態に即してServiceを選定します。', translation: '依据自家 Workload 实际情况选择 Service。', comparison: '比「に合わせて」更正式。' },
  '～とは限らない': { pattern: '～とは限らない', meaning: '未必……；不一定……', form: '普通形 + とは限らない', register: '口语・书面语', frequency: 5, explanation: '否定“总是如此”的一般化结论。', example: '一回のBenchmark結果が自社環境でも再現するとは限りません。', translation: '一次 Benchmark 结果未必能在自家环境复现。', comparison: '常用于 Evidence Boundary 和条件限制。' },
  '～わけではない': { pattern: '～わけではない', meaning: '并不是……；并非意味着……', form: '普通形 + わけではない', register: '口语・书面语', frequency: 5, explanation: '否定过度概括，同时保留部分事实。', example: 'Benchmarkが高いからといって本番でも最適なわけではありません。', translation: 'Benchmark 高并不意味着生产环境也最适合。', comparison: '适合限制结论范围。' },
}

const v = (date: string, key: string): VocabularyItem => ({ id: `${date}-v-${key}`, jlpt: 'N1', ...vocab[key] })
const g = (date: string, key: string): GrammarItem => ({ id: `${date}-g-${key}`, ...grammar[key] })

const seeds: Seed[] = [
  {
    date: '2026-09-08', day: 10, title: 'AIの利便性を「追跡できる仕組み」に変える', subtitle: 'Identity、Memoryの出典、Dataの粒度をそろえ、便利さとGovernanceを両立させる。', minutes: 30,
    immersionTitle: '共有Keyから、誰が何をしたか分かる設計へ',
    ja: ['AI Gatewayを共有API Keyだけで運用すると、利用者とRequestをひも付けにくく、CostやSecurity Incidentの追跡が難しくなる。利用規模が大きくなるほど、この匿名化された管理方式は限界に達しやすい。', 'Memoryも同じで、結論だけを蓄積すると、どの出典から得た情報か分からなくなる。さらに部門ごとにDataの粒度が異なれば、Agentは同じ言葉を別の意味で扱いかねない。', 'Securityを強くするだけでInnovationを妨げては意味がない。Identity、出典、Data定義を一元的に管理し、必要なところだけを細かく制御することが現実的である。'],
    zh: ['AI Gateway 若只用共享 API Key，就很难把使用者与 Request 绑定，成本和安全事件也难追踪。', 'Memory 只保存结论会失去出处；部门间数据粒度不一致时，Agent 还可能误解同一词语。', '安全措施也不能反过来阻碍创新，应统一管理 Identity、出处和数据定义，再细粒度控制必要环节。'],
    notes: ['「ひも付ける」是日本 IT 现场表示绑定/关联的高频动词。', '「かねない」用于现实风险警告。', '「とは限らない」适合限制过度一般化的结论。'],
    vocab: ['ひも付ける', '妨げる', '粒度', '懸念'], grammar: ['～かねない', '～に至るまで', '～とは限らない'],
    readingTitle: 'Data GovernanceとAgent利用', reading: ['Agentに大量のDataを与えるだけでは、必ずしも良い回答になるとは限らない。Dataの定義、粒度、更新責任がそろっていなければ、Contextが増えるほど矛盾も増える。', '導入時にはData量よりも、誰が管理し、どの単位で更新し、どのSourceに戻れるかを明確にする必要がある。'],
    correct: 'Agent導入ではData量だけでなく、定義・粒度・責任・出典を管理する必要がある。', wrong: ['Agentには可能な限り多くのDataを渡せばよい。', 'Data GovernanceはModel精度が高ければ不要になる。', 'Securityを強化するためAI利用を全面停止すべきだ。'], explanation: '本文はData量ではなく、意味・粒度・責任・出典をそろえるGovernanceを重視している。'
  },
  {
    date: '2026-09-07', day: 9, title: '「見えていないRisk」を言葉にする', subtitle: 'Securityの死角、要件、互換性を整理し、一回のBenchmarkを過信しない。', minutes: 29,
    immersionTitle: 'VisibilityがなければControlも成立しない',
    ja: ['Securityでは、管理対象として見えていないAssetやCredentialが死角になりやすい。使っていないつもりのIDでも、放置すれば攻撃の足掛かりになる可能性がある。', '新しいModelやRuntimeを選ぶときは性能だけで決めるべきではない。自社の要件に適合するか、CostとGovernanceを両立できるかを確かめる必要がある。', '一回のBenchmarkは重要な判断材料ではあるが、最終結論そのものではない。実態に即して再計測し、条件を明示して判断する姿勢が求められる。'],
    zh: ['安全领域中，看不见、没被纳入管理的 Asset 与 Credential 容易成为盲区。', '选择新 Model 或 Runtime 时不能只看性能，还要确认要件适配以及成本与治理能否兼顾。', '一次 Benchmark 是判断材料，但不是最终结论，应结合实际条件重新测量。'],
    notes: ['「死角」从视觉盲区扩展到Security不可见风险。', '「に即して」表示依据实际情况或规则。', '「とは限らない」用于说明并不一定总是如此。'],
    vocab: ['実態', '死角', '両立する', '適合する'], grammar: ['～に際して', '～に即して', '～とは限らない'],
    readingTitle: 'Benchmarkの読み方', reading: ['Benchmarkは候補比較に役立つ。しかし測定条件が自社のInput、Latency要件、Data Policyと異なるなら、その順位がそのままProductionの順位になるとは限らない。', '導入判断ではBenchmarkを出発点にしつつ、自社Workloadで再測定することが重要である。'],
    correct: 'Benchmarkは参考にしつつ、自社の条件に即して再検証することが重要だ。', wrong: ['Benchmark一位のModelをそのまま採用すべきだ。', 'Benchmarkは全く参考にならない。', 'ProductionではLatencyやData Policyを考えなくてよい。'], explanation: '本文はBenchmarkを否定せず、条件差を理解して自社環境で再検証することを求めている。'
  },
  {
    date: '2026-09-06', day: 8, title: 'Agentを「本番で評価できる形」に分解する', subtitle: 'Misalignment、Audit、Production Evalsを分けて観測し、Regressionの原因を切り分ける。', minutes: 31,
    immersionTitle: '一つのScoreでは、本番の問題は説明できない',
    ja: ['Agentが利用者の意図から外れたActionを取ったとき、単に「精度が低かった」で終わらせると原因が見えない。Model、Tool、Context、Permissionのどこで問題が生じたかを分解して追跡する必要がある。', 'Production Evalsでは、出力の自然な揺らぎと、本当に壊してはいけないContractの違反を区別することも重要だ。Evaluation Dataが特定Caseに偏ると、良いScoreでも実運用を代表しない。', 'Audit Logを包括的に残し、Evaluation Setを定期的に見直す。厳しすぎるSnapshotで改善を妨げるのではなく、守るべきBehaviorを明確にすることが大切である。'],
    zh: ['Agent 偏离用户意图时，不能只归结为精度低，而应拆分 Model、Tool、Context、Permission 来定位原因。', '生产评估还要区分自然输出波动与真正不能破坏的 Contract；评估数据偏向特定 Case 时，高分也不能代表实战。', '因此要保留综合 Audit Log，并定期复查 Evaluation Set，明确真正必须守住的行为。'],
    notes: ['「切り分ける」是排障与评价中定位原因的关键动词。', '「わけではない」适合否定过度简单化的理解。', '「たうえで」强调先做前项，再基于结果判断。'],
    vocab: ['認める', '追跡する', '切り分ける', '偏る'], grammar: ['～を余儀なくされる', '～わけではない', '～たうえで'],
    readingTitle: 'Production Evalsの目的', reading: ['Production Evalsの目的は、すべての出力を固定することではない。LLMには一定の揺らぎがあるため、意味的に許容できる変化まで失敗扱いすると改善を止めてしまう。', '重要なのはSecurity、Tool Use、必須情報など、壊れてはいけないContractを明確にし、そのRegressionを検出することである。'],
    correct: '自然な出力変化と、壊してはいけないContractのRegressionを区別して評価すべきだ。', wrong: ['すべての出力を文字単位で固定すべきだ。', 'LLMには揺らぎがあるのでProduction Evalsは不要だ。', 'Evaluation Dataは一度作れば見直さなくてよい。'], explanation: '本文は出力固定ではなく、守るべきContractを定義してRegressionを検出することを目的としている。'
  },
  {
    date: '2026-09-05', day: 7, title: '「AIありき」から脱却して設計する', subtitle: 'AIに任せる範囲を絞り、Rule・Test・Least Privilegeと組み合わせる。', minutes: 30,
    immersionTitle: 'AIを使うこと自体を目的にしない',
    ja: ['PoCで成果が出ないとき、より強いModelを追加する前に「どの部分をAIに任せるべきか」を見直す必要がある。自然言語処理はAI、確定的な計算や制約はRuleというように役割を絞ると、結果を説明しやすくなる。', 'Securityでも同じで、Agentに人間と同じ権限をそのまま与える必要はない。ProductionはRead-only、SandboxだけWrite可能とするなど、用途に応じて実効権限の上限を設けるべきである。', 'PatchやPermission設定を入れた後の検証を怠ると、別経路から同じRiskが残りかねない。AIだけに頼らず、Rule、Test、Auditを組み合わせることが重要だ。'],
    zh: ['PoC 没成果时，不应先堆更强模型，而应重新审视哪一部分适合交给 AI，并把确定性计算交给 Rule。', 'Agent 不必直接继承人类全部权限，可根据用途限制生产只读、沙箱可写。', '修补和权限设置后若疏忽验证，风险可能从其他路径残留；应把 AI 与 Rule、Test、Audit 结合。'],
    notes: ['「頼る」表示把解决能力寄托在某对象上。', '「に応じて」适合描述按Risk/用途调整权限。', '「かねない」用于说明可能发生的不良后果。'],
    vocab: ['頼る', '絞る', '怠る', '足掛かり'], grammar: ['～にとどまらず', '～かねない', '～に応じて'],
    readingTitle: 'Hybrid設計の考え方', reading: ['業務のすべてをLLMに任せると、説明可能性や再現性が下がることがある。特に計算Ruleや権限制約まで自然言語だけに任せる必要はない。', 'AIが得意な曖昧判断と、Ruleが得意な確定処理を分けることで、品質と運用性を両立しやすくなる。'],
    correct: 'AIとRuleの得意分野を分け、必要に応じて組み合わせることが重要だ。', wrong: ['強いModelほど業務全体を任せるべきだ。', 'Rule-based LogicはAI導入後には不要になる。', 'PoCで成果が出なければ検証せず中止すべきだ。'], explanation: '本文はAIかRuleかの二択ではなく、それぞれの得意分野を分けるHybrid設計を支持している。'
  },
  {
    date: '2026-09-04', day: 6, title: 'まず範囲を絞り、当面の運用を決める', subtitle: 'Agent IdentityとPermissionを把握し、いきなり全面展開せず段階的に進める。', minutes: 28,
    immersionTitle: '「ひとまず」と「当面」で段階を切る',
    ja: ['Agentを導入するとき、最初からすべての権限とDataを渡す必要はない。ひとまず利用者、Owner、Tool、接続先を把握し、Riskの高い範囲を絞り込むところから始めればよい。', '当面はRead-onlyや限定Namespaceで運用し、実績が確認できたら権限を追加する。RoleやPolicyをPurposeに応じて割り当てることで、事故時の影響範囲も小さくできる。', '段階導入は消極策ではない。前提が崩れたときにすぐ見直せるようにするための設計であり、Agentの利用拡大には特に重要である。'],
    zh: ['导入 Agent 时没必要一开始就交出全部权限和数据。先掌握用户、Owner、Tool、连接目标，再缩小高风险范围。', '目前可先按只读或限定 Namespace 运维，确认实绩后再加权限，并按 Purpose 分配 Role/Policy。', '阶段导入不是消极，而是为了在前提变化时能迅速重新审视设计。'],
    notes: ['「ひとまず」强调先处理当前一步。', '「当面」表示眼下一段时间内的临时方针。', '「たうえで」适合表达先确认、再基于结果扩大。'],
    vocab: ['当面', '割り当てる', '把握する', '絞り込む'], grammar: ['～にとどまらず', '～かねない', '～たうえで'],
    readingTitle: '段階導入とPermission', reading: ['最小権限は、最初から永遠に狭い権限のままにするという意味ではない。必要性が確認できた時点で、監査可能な形で段階的に権限を追加することもできる。', '重要なのは、なぜその権限が必要なのか、誰が承認し、いつ見直すのかを追跡できることである。'],
    correct: '最小権限は固定ではなく、必要性を確認しながら追跡可能な形で段階調整する考え方だ。', wrong: ['最小権限では権限を絶対に変更してはいけない。', 'Agentには人間と同じ権限を最初から与えるべきだ。', 'Permissionは記録する必要がない。'], explanation: '本文は最小権限を固定値ではなく、必要性と監査を伴う段階的調整として説明している。', merged: true
  },
  {
    date: '2026-09-03', day: 5, title: 'Local Agentの便利さと権限境界を分けて考える', subtitle: '乗っ取りや制御迂回を想定し、便利さだけでSecurityを判断しない。', minutes: 29,
    immersionTitle: '認証済みAgentも、別Processから使われればRiskになる',
    ja: ['Local Agentは、すでに開発者が認証したCredentialやWorkspaceへアクセスできるため便利である。一方で、悪意あるDependencyがそのAgentを乗っ取れば、通常の「SecretをGitへCommitしない」という対策だけでは足りない。', '攻撃者はAgentの能力を利用してFileやCredentialへ到達し、既存の制御を迂回する可能性がある。Modelの価格や性能が据え置かれていても、権限設計が弱ければRiskは別の場所から増える。', 'Agentを便利なAssistantとしてだけではなく、一つの実行主体として扱う必要がある。Workspace分離、Permission、監査を組み合わせて初めて安全性が高まる。'],
    zh: ['Local Agent 因能访问已认证 Credential 与 Workspace 而方便，但恶意依赖若劫持 Agent，传统“不提交 Secret”并不足够。', '攻击者可能利用 Agent 能力到达文件与 Credential 并绕过控制；模型价格性能不变也不代表权限风险不变。', '因此要把 Agent 当作执行主体，通过 Workspace 隔离、权限和审计组合提高安全性。'],
    notes: ['「乗っ取る」是劫持Account/Session/Agent的典型表达。', '「一方で」适合并列便利性与Risk。', '「を余儀なくされる」常用于Incident后被迫执行的措施。'],
    vocab: ['乗っ取る', '迂回する', '据え置く', 'もたらす'], grammar: ['～にとどまらず', '～を余儀なくされる', '～一方で'],
    readingTitle: 'Agent Securityの境界', reading: ['従来のSecurity対策は、人間が直接Toolを使うことを前提にしている場合が多い。しかしAgentは複数のToolを連続実行できるため、一つの弱点から到達できる範囲が広がる。', 'Prompt上の禁止だけでなく、Runtime PermissionとNetwork Boundaryで実行可能な範囲を制御する必要がある。'],
    correct: 'AgentではPromptだけでなくRuntimeとNetworkの実際の権限境界を設ける必要がある。', wrong: ['Agentは人間より賢いのでPermission管理は不要だ。', 'SecretをGitへCommitしなければ十分だ。', 'Local AgentはCloud Agentより常に安全だ。'], explanation: '本文はAgentの連続Tool実行を前提に、Promptより下のRuntime/Network Controlを重視している。', merged: true
  },
  {
    date: '2026-09-02', day: 4, title: 'Second Opinionと権限委譲を安全に使う', subtitle: '同じModelの自己Reviewだけに頼らず、別視点と明示的なPermissionを組み合わせる。', minutes: 29,
    immersionTitle: '「もう一つの視点」が見逃しを減らす',
    ja: ['同じModelに設計とReviewの両方を任せると、同じ前提ミスを共有してしまうことがある。別Modelや別AgentからSecond Opinionを得ることで、初期の誤りを見逃すRiskを下げられる。', 'Agent同士がTaskを委譲するときは、権限まで無制限に引き継いではいけない。必要なPermissionを明示的に渡し、誰がどこまで実行できるか確認する必要がある。', 'Open Standardは異なるAgent間の協調を後押しするが、標準化そのものがSecurityを保証するわけではない。IdentityとAuditを設計することが重要である。'],
    zh: ['同一模型负责设计和 Review 时可能共享同一前提错误，其他模型或 Agent 的第二意见能减少漏检。', 'Agent 间委托任务时不能无限继承权限，应显式授予必要 Permission 并确认执行边界。', '开放标准能推动 Agent 协作，但标准本身不等于安全保证，仍需设计 Identity 与 Audit。'],
    notes: ['「見逃す」在Review与测试里表示未能检出问题。', '「委譲する」比「任せる」正式。', '「に至るまで」适合强调范围延伸到较远终点。'],
    vocab: ['見逃す', '委譲する', '後押しする', '明示的に'], grammar: ['～を余儀なくされる', '～に至るまで', '～たうえで'],
    readingTitle: 'AI Reviewの独立性', reading: ['Reviewの目的は、最初の判断をそのまま繰り返すことではない。同じ情報、同じModel、同じPromptだけを使うと、Biasまで共有する可能性がある。', '重要な設計では、異なる観点や一次情報を追加し、最初の結論を本当に再検証できる仕組みにすることが望ましい。'],
    correct: '重要なReviewでは、最初の判断と異なる観点や一次情報を使って再検証することが有効だ。', wrong: ['同じModelで同じPromptを繰り返せば独立Reviewになる。', 'Second Opinionは必ず正しいので一次情報は不要だ。', 'Reviewでは最初の結論を変更してはいけない。'], explanation: '本文は単なる繰り返しではなく、異なる観点と一次情報による独立性を重視している。', merged: true
  },
  {
    date: '2026-09-01', day: 3, title: 'AI導入を利用量ではなく「成果」で測る', subtitle: '席数やTokenだけにとらわれず、手戻りを含むTask全体の価値で評価する。', minutes: 30,
    immersionTitle: '安いModelでも、手戻りが多ければ高くつく',
    ja: ['AI導入では利用回数やToken消費の多さを成果と混同しやすい。しかし実際に重要なのは、業務がどれだけ完了し、人間の手戻りがどれだけ減ったかである。', '安いModelでも再試行や修正が多ければTask全体のCostは上がりかねない。逆に単価が高くても一度で妥当な成果を出せれば総Costは低くなる場合がある。', 'KPIを利用量にとらわれず成果へ絞り、調査の終了条件もあらかじめ決める。Gatewayが横断的な制御を引き受けることで、評価とGovernanceを一緒に進めやすくなる。'],
    zh: ['AI 导入时容易把使用次数或 Token 消耗误当成果，真正重要的是业务完成情况和返工是否减少。', '便宜模型若重复尝试和修正很多，Task 总成本也可能更高；高单价模型若一次完成，反而可能更便宜。', '因此 KPI 应从使用量转向成果，并预先决定调查结束条件；由 Gateway 等基础层承担横向控制。'],
    notes: ['「にとらわれず」表示不受某指标或想法束缚。', '「打ち切る」用于明确终止调查、探索或流程。', '「かねない」可用于成本、Risk等不良结果。'],
    vocab: ['打ち切る', '絞る', '引き受ける', '煩雑な'], grammar: ['～にとらわれず', '～かねない', '～にとどまらず'],
    readingTitle: 'AI ROIの測り方', reading: ['AIのCostを考えるとき、Model単価だけを見ると判断を誤る。再試行、Human Review、修正時間まで含めたTask Costを見る必要がある。', '成果は「使ったかどうか」ではなく、業務時間、品質、売上など目的に近い指標で測るべきである。'],
    correct: 'AI ROIはModel単価や利用量だけでなく、Task全体のCostと業務成果で評価すべきだ。', wrong: ['最も安いModelを使えばAI ROIは必ず高くなる。', 'Token消費量が多いほどAI導入は成功している。', 'Human ReviewはAI Costに含めなくてよい。'], explanation: '本文は単価中心の評価を否定し、手戻りを含む総Costと業務成果を重視している。', merged: true
  },
  {
    date: '2026-08-31', day: 2, title: 'AI編排を読む前に、N1の「前提」を言葉にする', subtitle: '日立のAI編排記事を軸に、前日の診断文法と新しい回想表現をつなげる。', minutes: 30,
    immersionTitle: '「言わなくても分かる前提」を減らす',
    ja: ['複数のAIやToolを編排すると、個々の性能だけでなく、どの処理を誰に任せるかという前提が重要になる。運用範囲が目まぐるしく変化するほど、管轄と責任を明文化する必要がある。', '当面の運用方針を決めるときは、すべてを自動化しようとせず、ひとまず人間が確認すべき部分を残すことも有効だ。行政や企業のように責任範囲が明確な場面では、特にこの考え方が重要になる。', 'Day 1で扱った「なくしては」「くらいなら」を復習しつつ、「～てくれたものだ」「～みたいなところがある」のような回想・傾向表現も、実際の自分の経験と結び付けて使う。'],
    zh: ['编排多个 AI/Tool 时，重要的不只是单体性能，还包括谁负责哪一步的前提；变化越快越需要明确管辖与责任。', '制定眼下运维方针时，不必一开始全部自动化，可以先保留人类确认环节；在行政和企业责任边界明确的场景尤其重要。', '同时复习 Day1 文法，并把新的回忆/倾向表达与自己的经历结合起来。'],
    notes: ['「管轄」读作「かんかつ」，是当天重点错词。', '「当面」比「しばらく」更正式。', '「～てくれたものだ」不是一次性的授受，而带过去反复发生的回忆语感。'],
    vocab: ['行政', '管轄', '当面', '目まぐるしい'], grammar: ['～なくしては', '～てくれたものだ', '～みたいなところがある'],
    readingTitle: 'AI編排と責任範囲', reading: ['複数のAIを連携させる場合、性能の高いModelを集めるだけでは十分ではない。失敗したときにどのComponentが判断し、誰が責任を持つかを追跡できる必要がある。', '自動化の範囲を段階的に広げることで、問題発生時の切り分けもしやすくなる。'],
    correct: 'AI編排では性能だけでなく、責任範囲と失敗時の追跡可能性を設計することが重要だ。', wrong: ['高性能Modelを増やせば責任設計は不要だ。', 'すべての処理を最初から自動化すべきだ。', '複数AIでは人間の確認を完全に排除すべきだ。'], explanation: '本文はAI編排の価値をModel数ではなく、責任・追跡・段階導入まで含めて捉えている。', merged: true
  },
  {
    date: '2026-08-30', day: 1, title: 'N1診断を「答え」ではなく根拠から始める', subtitle: '2025年12月N1を診断基線にし、Claude Code企業展開の記事も使いながら弱点を言語化する。', minutes: 31,
    immersionTitle: '正解したかより、なぜ選んだかを確認する',
    ja: ['N1対策の初日は、2025年12月試験を診断基線として使う。大切なのはScoreだけではなく、どの問題で根拠を見逃し、どの選択肢に引かれたかを確認することである。', '企業でClaude CodeのようなCoding Agentを広げる場合も、Toolを導入しただけでは成果にならない。権限をどの部署が管轄し、Taskを誰に割り当てるかまで含めて運用する必要がある。結果が芳しくないなら、Modelを変える前に前提を見直すべきだ。', '弱点が分かったら、既知の錯題を少量ずつ間隔復習に仕込む。新しい知識を増やすことなくしては合格できないが、復習なくしては同じ失敗を繰り返す。'],
    zh: ['第一天以 2025 年12月 N1 作为诊断基线，重点不是分数本身，而是确认漏看了什么依据。', '企业推广 Claude Code 也一样，不能只看是否导入 Tool，还要明确权限管辖、任务分配；结果不理想时应先重审前提。', '明确弱点后，把错题少量放入间隔复习；新知识和复习都不可缺少。'],
    notes: ['「芳しい」重点记读音「かんばしい」，常用「芳しくない」。', '「管轄」读作「かんかつ」。', '「なくしては」强调不可缺少的必要条件。'],
    vocab: ['芳しい', '管轄', 'ひとまず', '割り当てる'], grammar: ['～なくしては', '～くらいなら', '～とするには'],
    readingTitle: '診断問題の使い方', reading: ['模試の点数は現在地を知るために役立つ。ただし同じ問題を何度も見れば答えを覚えてしまうため、点数だけでは実力の変化を測れない。', '診断後は誤答の原因を語彙、文法、根拠位置、時間配分などに分け、別の問題でも同じ判断ができるか確認する必要がある。'],
    correct: '診断後は誤答原因を分類し、別問題でも再現できる理解に変えることが重要だ。', wrong: ['同じ模試を毎日解いて点数を上げることが最重要だ。', '診断では正解数だけ確認すれば十分だ。', '一度間違えた問題は答えを覚えれば復習不要だ。'], explanation: '本文はScoreそのものより、誤答原因を分類して別問題へ転移できる理解に変えることを重視している。', merged: true
  },
]

const build = (seed: Seed): DailyLesson => ({
  date: seed.date,
  day: seed.day,
  title: seed.title,
  subtitle: seed.subtitle,
  estimatedMinutes: seed.minutes,
  immersion: { title: seed.immersionTitle, paragraphs: seed.ja, translations: seed.zh, analysis: seed.notes },
  vocabulary: seed.vocab.map((key) => v(seed.date, key)),
  grammar: seed.grammar.map((key) => g(seed.date, key)),
  reading: {
    title: seed.readingTitle,
    paragraphs: seed.reading,
    question: {
      id: `${seed.date}-q-main`,
      prompt: '筆者が最も言いたいことは何か。',
      options: [seed.wrong[0], seed.wrong[1], seed.correct, seed.wrong[2]],
      answer: 2,
      explanation: seed.explanation,
      optionNotes: ['誤り。本文の主張を単純化しすぎている。', '誤り。本文が否定、または条件を限定している内容である。', '正解。本文の主張と条件を最も正確にまとめている。', '誤り。本文ではそこまで強い結論は述べていない。'],
    },
  },
})

export const lesson: DailyLesson = { ...rawLatestLesson, day: 11 }
export const lessons: DailyLesson[] = [lesson, ...seeds.map(build)]
export const getLessonByDate = (date: string) => lessons.find((item) => item.date === date) ?? lesson

export const historyItems: HistoryItem[] = [
  { date: lesson.date, day: lesson.day, title: lesson.title, minutes: lesson.estimatedMinutes, merged: false },
  ...seeds.map((item) => ({ date: item.date, day: item.day, title: item.title, minutes: item.minutes, merged: Boolean(item.merged) })),
]

export const reviewFocusByDate: Record<string, ReviewFocus[]> = {
  '2026-08-30': [
    { type: '文法', title: '～なくしては / ～くらいなら', detail: 'Day 1诊断重点：回忆含义与接续，再自己造句。' },
    { type: '词汇', title: '芳しい・管轄', detail: '对应 2025-12 N1 文字・語彙错点，特别确认读音。' },
    { type: '读解', title: '对应原题 Q46', detail: '重新定位主张句，不只靠关键词匹配。' },
  ],
  '2026-08-31': [
    { type: '文法', title: 'なくしては / ～てくれたものだ', detail: '复习必要条件，并区分回忆感慨用法。' },
    { type: '词汇', title: '行政・管轄・当面', detail: '优先确认读音与正式语域。' },
    { type: '词汇', title: '目まぐるしい', detail: '记住「目まぐるしく変化する」搭配。' },
  ],
  '2026-09-01': [
    { type: '文法', title: '～に越したことはない', detail: '用求职或开发场景造一个新句子。' },
    { type: '词汇', title: 'ひとまず・むしゃくしゃする', detail: '分别记住“暂且先”和“烦躁”的语域。' },
    { type: '读解', title: '对应原题 Q53', detail: '确认转折后的作者判断。' },
  ],
  '2026-09-02': [
    { type: '文法', title: '～てくれたものだ', detail: '注意回忆/感慨语感，不按普通授受表达理解。' },
    { type: '词汇', title: 'ひそかに / こっそり', detail: '比较书面和口语语感。' },
    { type: '词汇', title: 'うろたえる', detail: '和「慌てる」比较使用场景。' },
  ],
  '2026-09-03': [
    { type: '文法', title: '～ならでは / ～なり', detail: '分别确认“特有价值”和“某动作后立即”的用法。' },
    { type: '词汇', title: '当面・自前', detail: '商务场景中高频，记搭配而非只记中文。' },
    { type: '读解', title: '对应原题 Q57', detail: '先找段落功能，再判断选项。' },
  ],
  '2026-09-04': [
    { type: '文法', title: 'AもAならBもBだ', detail: '记住并列评价结构，避免按条件句理解。' },
    { type: '词汇', title: '緻密・目まぐるしい', detail: '一个强调细致，一个强调变化快。' },
    { type: '读解', title: '对应原题 Q59', detail: '复习因果与作者立场。' },
  ],
  '2026-09-05': [
    { type: '文法', title: '～なくしては', detail: '按间隔复习再次主动造句。' },
    { type: '词汇', title: '芳しい・管轄', detail: '再次确认读音与搭配，连续正确后再降频。' },
    { type: '词汇', title: '割り当てる', detail: '结合Permission/Resource场景复习。' },
  ],
  '2026-09-06': [
    { type: '文法', title: '～くらいなら', detail: '做一次同知识点改写题，避免只记原答案。' },
    { type: '词汇', title: '互角・ひとまず', detail: '从句子里判断语义，不做孤立背诵。' },
    { type: '读解', title: '对应原题 Q61', detail: '注意 Evidence Boundary 与作者保留条件。' },
  ],
  '2026-09-07': [
    { type: '文法', title: '～とするには', detail: '再确认实现某目标所需条件的表达。' },
    { type: '词汇', title: 'うろたえる・当面', detail: '一个偏情绪反应，一个偏正式时间范围。' },
    { type: '读解', title: '对应原题 Q62', detail: '先判断选项是否把局部结论扩大。' },
  ],
  '2026-09-08': [
    { type: '文法', title: '～に越したことはない', detail: '用Security最佳实践重新造句。' },
    { type: '词汇', title: '自前・緻密', detail: '结合「自社で用意する」「緻密な設計」记忆。' },
    { type: '读解', title: '对应原题 Q64', detail: '确认本文主旨与细节例子之间的层级。' },
  ],
  '2026-09-09': [
    { type: '文法', title: '～ならでは / ～なり', detail: '继续按间隔复习，用新语境判断。' },
    { type: '词汇', title: '目まぐるしい', detail: '重点记「目まぐるしく変化する」等搭配。' },
    { type: '读解', title: '2025-12 N1错题回顾', detail: '今天只保留3～5项，不堆积补课。' },
  ],
}
