import { useRef, useState } from 'react'
import { backupSummary, createProgressBackup, importBrowserLearningRecords, MAX_BACKUP_BYTES, parseProgressBackup, readBrowserLearningRecords, type ProgressBackup as Backup } from '../lib/progressBackup'
import { tokyoDate } from '../lib/progress'
import '../progress-backup.css'

export default function ProgressBackup() {
  const [preview, setPreview] = useState<Backup | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const selection = useRef(0)
  const summary = preview ? backupSummary(preview.records) : null
  const exportRecords = () => {
    try {
      const backup = createProgressBackup(readBrowserLearningRecords())
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2) + '\n'], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = `n1-learning-records-${tokyoDate()}.json`; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setError(''); setMessage('学習記録をファイルに保存しました。ファイルは端末内で大切に保管してください。')
    } catch (error) { setMessage(''); setError(error instanceof Error ? error.message : '学習記録を保存できませんでした。') }
  }
  const chooseFile = async (file: File | undefined) => {
    const token = ++selection.current
    setPreview(null); setError(''); setMessage('')
    if (!file) return
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('2 MB以下の学習記録ファイルを選んでください。')
      const parsed = parseProgressBackup(await file.text())
      if (token === selection.current) setPreview(parsed)
    } catch (error) { if (token === selection.current) setError(error instanceof Error ? error.message : 'ファイルを読み込めませんでした。') }
  }
  const importRecords = () => {
    if (!preview) return
    try {
      importBrowserLearningRecords(preview)
      setPreview(null); if (input.current) input.current.value = ''
      setError(''); setMessage('学習記録を取り込みました。現在の記録を残し、足りない記録と回答履歴を追加しました。')
    } catch (error) { setMessage(''); setError(error instanceof Error ? error.message : '学習記録を取り込めませんでした。') }
  }
  return <section className="progress-backup" aria-labelledby="progress-backup-title">
    <h2 id="progress-backup-title">学習記録のバックアップ</h2>
    <p>語彙・文法・読解・読了・直播ノートの記録を、この端末内のJSONファイルに保存できます。ファイルや学習記録をサーバーへ送信しません。</p>
    <div className="progress-backup-actions">
      <button className="secondary-btn" onClick={exportRecords}>学習記録をエクスポート</button>
      <label className="progress-backup-file">学習記録ファイルを選択<input ref={input} type="file" accept=".json,application/json" aria-label="学習記録ファイルを選択" onChange={event => void chooseFile(event.target.files?.[0])} /></label>
    </div>
    {preview && summary ? <div className="progress-backup-preview">
      <h3>取り込み内容を確認</h3>
      <p>語彙 {summary.vocabulary} 件 · 文法 {summary.grammar} 件 · 読解回答 {summary.answers} 件（履歴 {summary.attempts} 件） · 読了 {summary.completed} 日 · 直播ノート {summary.live} 組</p>
      <p>現在のマーク・回答・表示テーマを優先し、まだない記録と回答履歴を追加します。元の記録は削除しません。</p>
      <div className="progress-backup-actions"><button className="primary-btn" onClick={importRecords}>確認して取り込む</button><button className="secondary-btn" onClick={() => { ++selection.current; setPreview(null); if (input.current) input.current.value = '' }}>キャンセル</button></div>
    </div> : null}
    {error ? <p className="progress-backup-error" role="alert">{error}</p> : message ? <p role="status">{message}</p> : null}
  </section>
}
