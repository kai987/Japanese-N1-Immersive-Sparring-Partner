import { Component, type ReactNode } from 'react'
import { reloadWithSearch } from '../lib/resourceRecovery'

/** Keep navigation and saved records usable when a lazy page cannot load. */
export class ResourceBoundary extends Component<{
  children: ReactNode
  resetKey?: string
  searchQuery?: string
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidUpdate(previous: Readonly<{ resetKey?: string }>) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }
  render() {
    if (!this.state.failed) return this.props.children
    return <section className="storage-notice resource-error" role="alert">
      <h2>この画面を読み込めませんでした</h2>
      <p>接続を確認して再読み込みしてください。サイトの更新後に開いたままのページでも、この表示になることがあります。</p>
      <p>現在の日付・学習画面と、このタブに保存できた未提出の選択を再開します。</p>
      <button className="primary-btn" onClick={() => reloadWithSearch(this.props.searchQuery)}>ページを再読み込み</button>
    </section>
  }
}
