"""One-time grammar-only synchronization from a verified IT/AI source checkout."""
from pathlib import Path
import copy,hashlib,json,re,subprocess,sys,unicodedata
import yaml
root=Path.cwd();source=Path(sys.argv[1]);source_sha=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
report=json.loads((source/'docs/grammar-history/repair-report.json').read_text())
assert report['after']==73 and report['historicalDuplicatesAfter']==0
rules=json.loads((source/'docs/grammar-history/identity-rules.json').read_text());aliases=rules['aliases']
def key(p):
    k=re.sub(r'[\s\u200b\ufeff~～〜…]','',unicodedata.normalize('NFKC',p));return aliases.get(k,k)
def sha(x):return hashlib.sha256(x).hexdigest()
def serialized(x):return json.dumps(x,ensure_ascii=False,sort_keys=True).encode()
def fm(p):return yaml.safe_load(p.read_text().split('---',2)[1])
def patch(path,old,new):
    p=root/path;s=p.read_text();assert s.count(old)==1,(path,'Unexpected patch context',s.count(old));p.write_text(s.replace(old,new))
rows=[];seen=set();before_total=0
paths=sorted((root/'src/data/daily').glob('2026-09-*.json'))
paths=[p for p in paths if '2026-09-09'<=p.stem<='2026-09-17'];assert len(paths)==9
for path in paths:
    date=path.stem;data=json.loads(path.read_text());before=copy.deepcopy(data);lesson=data['lesson'];assert lesson['date']==date
    src=fm(source/f'src/content/japanese/{date}.md');cards=src['grammar'];by={g['pattern']:g for g in cards};must=src['mustRememberGrammar']
    assert len(must)==min(5,len(cards)) and len(set(must))==len(must)
    old=lesson['grammar'];before_total+=len(old);new=[]
    for pattern in must:
        g=by[pattern];identity=key(pattern);assert identity not in seen;seen.add(identity)
        same=next((x for x in old if key(x['pattern'])==identity and x['example']==g['exampleJa']),None)
        item={'id':same['id'] if same else date+'-g-gh-'+sha((identity+'\n'+g['exampleJa']).encode())[:10],
              'pattern':pattern,'meaning':g['meaningZh'],'form':g['structure'],'register':same['register'] if same else '技術文書・日常の説明',
              'frequency':same['frequency'] if same else 4,'explanation':g['usageZh'],'example':g['exampleJa'],'translation':g['exampleZh'],
              'comparison':g.get('noteZh') or '结合接续和上下文理解该文型。','level':g['level']}
        for field in ['sourceUrl','sourceForm','sourceAnchor']:
            if field in g:item[field]=g[field]
        new.append(item)
    lesson['grammar']=new;lesson['grammarSelectionNote']=src.get('grammarSelectionNote',f'全历史查重后，本日精选{len(new)}项新语法；不足时不重复收录。')
    lesson['grammarSourceCommit']=source_sha
    protected=copy.deepcopy(data);protected['lesson'].pop('grammarSelectionNote');protected['lesson'].pop('grammarSourceCommit');protected['lesson']['grammar']=before['lesson']['grammar']
    assert protected==before,'Non-grammar lesson data changed'
    before_protected=copy.deepcopy(before);before_protected['lesson'].pop('grammar')
    rows.append({'date':date,'before':len(old),'after':len(new),'patterns':must,'protectedSha256':sha(serialized(before_protected)),'sourceFileSha256':sha((source/f'src/content/japanese/{date}.md').read_bytes())})
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
patch('src/types.ts','export interface GrammarItem {','export interface GrammarItem {\n  level?: string\n  sourceUrl?: string\n  sourceForm?: string\n  sourceAnchor?: string')
patch('src/types.ts','  grammar: GrammarItem[]','  grammar: GrammarItem[]\n  grammarSelectionNote?: string\n  grammarSourceCommit?: string')
patch('src/lib/archive.ts',"requireValid(Array.isArray(items) && items.length > 0, `${path}.${kind}`, '1件以上の配列が必要です')", """requireValid(Array.isArray(items) && (kind === 'grammar' || items.length > 0), `${path}.${kind}`, '有効な配列が必要です（語彙は1件以上）')
    if (kind === 'grammar' && items.length === 0) requireValid(typeof input.grammarSelectionNote === 'string' && input.grammarSelectionNote.trim().length >= 20, `${path}.grammarSelectionNote`, '新規文法が0件の場合は検証済みの理由が必要です')""")
patch('src/App.tsx','              <div className="learning-list grammar-list">','              {lesson.grammarSelectionNote && <p className="grammar-explain" data-grammar-selection-note>{lesson.grammarSelectionNote}</p>}\n              <div className="learning-list grammar-list">')
(root/'src/data/grammar-identity-rules.json').write_text(json.dumps(rules,ensure_ascii=False,indent=2)+'\n')
gate="""import type { DailyLesson } from '../types.ts'
import rules from '../data/grammar-identity-rules.json' with { type: 'json' }
const aliases: Record<string,string> = rules.aliases
export function grammarIdentity(pattern: string) {
  const k = pattern.normalize('NFKC').replace(/[\\s\\u200b\\ufeff~～〜…]/g, '')
  if (!k) throw new Error('Empty grammar identity')
  return aliases[k] ?? k
}
export function validateMirroredGrammarHistory(lessons: DailyLesson[]) {
  const seen = new Map<string,string>()
  const dates = new Set<string>()
  for (const lesson of lessons.filter(x => x.date >= '2026-09-09').sort((a,b) => a.date.localeCompare(b.date))) {
    if (dates.has(lesson.date)) throw new Error(`${lesson.date}: duplicate mirrored date`)
    dates.add(lesson.date)
    if (!Array.isArray(lesson.grammar) || lesson.grammar.length > 5) throw new Error(`${lesson.date}: mirrored grammar must contain 0..5 items`)
    if (lesson.grammar.length < 5 && (!lesson.grammarSelectionNote || lesson.grammarSelectionNote.trim().length < 20)) throw new Error(`${lesson.date}: grammarSelectionNote is required for fewer than five items`)
    if (lesson.grammarSourceCommit !== undefined && !/^[a-f0-9]{40}$/.test(lesson.grammarSourceCommit)) throw new Error(`${lesson.date}: invalid grammarSourceCommit`)
    for (const item of lesson.grammar) {
      const identity = grammarIdentity(item.pattern)
      if (seen.has(identity)) throw new Error(`${lesson.date}: duplicate grammar ${item.pattern}; first introduced ${seen.get(identity)}`)
      seen.set(identity,lesson.date)
      if (lesson.date > '2026-09-17' || item.sourceUrl !== undefined) {
        let url: URL
        try { url = new URL(item.sourceUrl ?? '') } catch { throw new Error(`${lesson.date}: invalid grammar source URL`) }
        if (url.protocol !== 'https:' || !item.sourceForm?.trim() || !item.sourceAnchor || item.sourceAnchor.trim().length < 10) throw new Error(`${lesson.date}: missing grammar source evidence`)
      }
    }
  }
  return { dates: dates.size, grammar: seen.size }
}
"""
(root/'src/lib/grammarHistory.ts').write_text(gate)
patch('scripts/validate-content.ts',"import { mergeArchives } from '../src/lib/archive.ts'", "import { mergeArchives } from '../src/lib/archive.ts'\nimport { validateMirroredGrammarHistory } from '../src/lib/grammarHistory.ts'")
patch('scripts/validate-content.ts','  return mergeArchives(lessons, modules)',"  const catalog = mergeArchives(lessons, modules)\n  validateMirroredGrammarHistory(catalog.generated.map(entry => entry.lesson))\n  return catalog")
(root/'tests/grammar-history.test.ts').write_text("""import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { grammarIdentity, validateMirroredGrammarHistory } from '../src/lib/grammarHistory.ts'
import { validateLesson } from '../src/lib/archive.ts'
import type { DailyLesson } from '../src/types.ts'
const entries = () => readdirSync(new URL('../src/data/daily/',import.meta.url)).filter(n => n.endsWith('.json')).map(n => JSON.parse(readFileSync(new URL('../src/data/daily/'+n,import.meta.url),'utf8')).lesson as DailyLesson)
test('grammar aliases normalize without merging distinct functions', () => {
  assert.equal(grammarIdentity('～た上で'),grammarIdentity('～たうえで'))
  assert.equal(grammarIdentity('～に伴い'),grammarIdentity('～に伴って'))
  assert.notEqual(grammarIdentity('～する上で'),grammarIdentity('～した上で'))
  assert.notEqual(grammarIdentity('～にかかわらず'),grammarIdentity('～にもかかわらず'))
  assert.notEqual(grammarIdentity('～かねる'),grammarIdentity('～かねない'))
})
test('all generated historical grammar mirrors remain unique', () => {
  const result = validateMirroredGrammarHistory(entries())
  assert.ok(result.dates >= 9)
  assert.ok(result.grammar >= 10)
})
test('distant and same-day duplicates are rejected', () => {
  const data = entries(); const a = data[0]; const b = data[1]
  b.grammar = [structuredClone(a.grammar[0])]
  assert.throws(() => validateMirroredGrammarHistory(data),/duplicate grammar/)
  a.grammar.push(structuredClone(a.grammar[0]))
  assert.throws(() => validateMirroredGrammarHistory([a]),/duplicate grammar/)
})
test('zero new grammar is valid only with an explicit explanation', () => {
  const lesson = entries()[0]; lesson.grammar = []
  lesson.grammarSelectionNote = '当天原文经完整历史核对后，没有可新增且符合来源要求的语法，不使用旧语法补数。'
  validateLesson(lesson,'zero')
  validateMirroredGrammarHistory([lesson])
  delete lesson.grammarSelectionNote
  assert.throws(() => validateLesson(lesson,'zero'),/grammarSelectionNote/)
  assert.throws(() => validateMirroredGrammarHistory([lesson]),/grammarSelectionNote/)
})
test('a missing grammar array remains invalid', () => {
  const lesson = entries()[0]; delete (lesson as Partial<DailyLesson>).grammar
  assert.throws(() => validateLesson(lesson,'missing'),/grammar/)
})
""")
p=root/'src/data/daily/README.md';p.write_text(p.read_text()+"\n\n## 新词与新语法全历史查重\n\n自2026-09-09起的每日JSON为IT/AI日报必背项目镜像。词汇保持来源的N1/N2参考标注；语法取当天C-4已查重子集，0～5项，不能用历史项目补齐。少于5项必须提供`lesson.grammarSelectionNote`（至少20字符）；空数组只有附有核验后的真实原因才合法，缺失grammar字段仍然失败。可记录`lesson.grammarSourceCommit`，语法卡保留level、sourceUrl、sourceForm、sourceAnchor。2026-09-18起新语法需要可定位原文的出处信息。完整来源与当天Top5对应关系需在同步时验证，不能仅以本地语法查重代替。\n\n同一语法的表记与接续变体按`src/data/grammar-identity-rules.json`归一；不同功能不强行合并。`npm run validate:content`及生产构建会校验所有已生成镜像日期，跨日期或当日重复会阻止发布。原有独立课程、n1-source原文及错题复习不受此新项目规则删除。替换文型必须换ID，相同文型与例句的同日重跑保持ID，避免继承另一语法的掌握状态。\n")
(root/'docs').mkdir(exist_ok=True)
summary={'sourceRepository':'kai987/japan-it-ai-daily','sourceCommit':source_sha,'days':len(rows),'before':before_total,'after':len(seen),'duplicatesAfter':0,'protected':['vocabulary','immersion','reading','reviewFocus','n1-source originals','saved user state schema'],'byDate':rows}
(root/'docs/grammar-history-sync.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
