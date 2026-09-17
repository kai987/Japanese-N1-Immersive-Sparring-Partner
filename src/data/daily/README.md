# 自动同步日报数据

此目录用于每天的 N1 沉浸式陪练自动同步。Vite 会自动读取本目录下所有 `YYYY-MM-DD.json`，无需再修改 `history.ts`、日期下拉框或搜索索引。

## 文件名

`YYYY-MM-DD.json`，日期必须与 `lesson.date` 一致。

## 顶层结构

```json
{
  "lesson": { "...": "DailyLesson" },
  "reviewFocus": [
    { "type": "词汇", "title": "...", "detail": "..." },
    { "type": "文法", "title": "...", "detail": "..." },
    { "type": "读解", "title": "...", "detail": "..." }
  ],
  "merged": false
}
```

## lesson 必填结构

```json
{
  "date": "2026-09-10",
  "day": 12,
  "title": "当天主题（日文）",
  "subtitle": "当天主题说明（日文）",
  "estimatedMinutes": 30,
  "immersion": {
    "title": "沉浸阅读标题（日文）",
    "paragraphs": ["日文段落1", "日文段落2", "日文段落3"],
    "translations": ["中文1", "中文2", "中文3"],
    "analysis": ["解析1", "解析2", "解析3"]
  },
  "vocabulary": [
    {
      "id": "2026-09-10-v-001",
      "word": "語彙",
      "reading": "ごい",
      "meaning": "中文释义",
      "jlpt": "N1",
      "partOfSpeech": "名詞",
      "example": "日文例句。",
      "translation": "中文翻译。",
      "collocations": ["搭配1", "搭配2"],
      "nuance": "语感说明"
    }
  ],
  "grammar": [
    {
      "id": "2026-09-10-g-001",
      "pattern": "～にとどまらず",
      "meaning": "中文释义",
      "form": "接续",
      "register": "书面语",
      "frequency": 5,
      "explanation": "说明",
      "example": "日文例句。",
      "translation": "中文翻译。",
      "comparison": "相似表达对比"
    }
  ],
  "reading": {
    "title": "读解标题（日文）",
    "paragraphs": ["日文段落1", "日文段落2"],
    "question": {
      "id": "2026-09-10-q-main",
      "prompt": "筆者が最も言いたいことは何か。",
      "options": ["A内容", "B内容", "C内容", "D内容"],
      "answer": 2,
      "explanation": "中文解析",
      "optionNotes": ["A解析", "B解析", "C解析", "D解析"]
    }
  }
}
```

## 自动发布规则

- 2026-08-30 = Day 1；之后按自然日递增。
- 同一天只允许一个 JSON；重跑时更新当天文件，不重复创建第二份日报。
- `vocabulary[].id`、`grammar[].id`、`reading.question.id` 必须包含日期，避免不同日期的学习状态冲突。
- 网页正文保持当前结构：沉浸阅读 → N1语彙 → N1文法 → 読解 → 誤答復習。
- `reviewFocus` 使用当天推送末尾的错题复习重点；题目可以暂不显示答案，但网页中的复习说明应与推送内容一致。
- 写入 `main` 后由现有 GitHub Pages workflow 自动构建和发布。

## 検証付きインポート

Node.js 24で `npm run import:daily -- /path/to/YYYY-MM-DD.json` を実行できます。
内容が正しい場合だけ当該日を更新します。`npm run validate:content` と本番ビルドでも全教材を検証します。
`reviewFocus[].type` は既存の中国語表記に加え、日本語の `語彙`・`文法`・`読解` も受け付けます。
選択肢と `optionNotes` はそれぞれ4件、`answer` は元配列の0〜3の番号です。
画面で選択肢の順番が変わっても、JSONの配列や正解番号を書き換える必要はありません。
既存の同じIDで選択肢の意味・順番を変更すると保存回答との対応が変わるため、問題を差し替える場合は新しいIDを付けてください。


## 新词与新语法全历史查重

自2026-09-09起的每日JSON为IT/AI日报必背项目镜像。词汇保持来源的N1/N2参考标注；语法取当天C-4已查重子集，0～5项，不能用历史项目补齐。少于5项必须提供`lesson.grammarSelectionNote`（至少20字符）；空数组只有附有核验后的真实原因才合法，缺失grammar字段仍然失败。可记录`lesson.grammarSourceCommit`，语法卡保留level、sourceUrl、sourceForm、sourceAnchor。2026-09-18起新语法需要可定位原文的出处信息。完整来源与当天Top5对应关系需在同步时验证，不能仅以本地语法查重代替。

同一语法的表记与接续变体按`src/data/grammar-identity-rules.json`归一；不同功能不强行合并。`npm run validate:content`及生产构建会校验所有已生成镜像日期，跨日期或当日重复会阻止发布。原有独立课程、n1-source原文及错题复习不受此新项目规则删除。替换文型必须换ID，相同文型与例句的同日重跑保持ID，避免继承另一语法的掌握状态。
