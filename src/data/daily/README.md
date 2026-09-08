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
