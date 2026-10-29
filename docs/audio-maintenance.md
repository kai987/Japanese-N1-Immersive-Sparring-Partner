# 音声の手動移行・保守

通常の日次更新は [README](../README.md) の自動処理を使用します。この文書は、旧ローカル生成からの移行や、対象を確認したうえで行う保守・検証用です。自動ワーカーの時間帯・再開・公開条件は [音声同期の契約](automation/README.md#incremental-audio-follow-up) を参照してください。

## 保存先と保持するデータ

- 現行ワーカーの進捗・アップロード記録・候補音声は `~/Library/Application Support/N1 Audio/` に保存します。中断や翌日の再開に必要なため、保守時にも保持します。
- 旧手動生成のMP3は `public/audio/morioki-normal/` のローカルキャッシュです。Gitには追加しません。
- 発話・参照元・音量・長さ・SHA-256は `public/audio/manifest.json`、画面用索引は `src/data/audio-index.json`、公開先は `src/data/audio-sources.json`、未収録内容は `src/data/audio-pending.json` に記録します。
- 音声のライセンスは `public/audio/morioki-license.txt` に収録しています。マニフェストとライセンスは保持します。

公開バイトの検証と正確なコミットのPages・再生検証を完了したローカルMP3キャッシュだけが削除候補です。未公開の候補や進捗は削除しません。検証済みのクラウド音声は、ローカルMP3を削除した後も再利用します。

## 公開音声の検証

```sh
# 現在の教材に対する音声の完全性を検証
npm run audio:validate
# 新しい教材が処理待ちの間、既に公開されたスナップショットを検証
npm run audio:validate -- --snapshot
# R2とSupabase上の全公開音声のサイズ・SHA-256を検証
npm run audio:validate:remote
# 旧ローカルキャッシュのファイルも必須にして検証
npm run audio:validate -- --local
```

CIは索引と教材の対応を検証します。ビルドは公開済みのローカルMP3を出力から除外します。未収録内容や処理待ちがある場合、公開済みスナップショットの検証成功だけでは現在の全教材の音声が揃ったことにはなりません。

## 旧手動生成からの移行

この手順は通常の日次更新では実行しません。対象と保存先を確認し、自動ワーカーと同時に音声メタデータを書き換えないようにします。N1のバックグラウンド処理は、日次の時間帯や当日実行制限を変更せずに使用します。

```sh
# AivisSpeechとmorioki / ノーマル（497929760）をインストール済みのmacOSで実行
# アプリの起動と録音後の通常終了は共通ヘルパーが管理
npm run audio:generate
# 新規・変更音声は下記の公開手順を完了してから npm run build
```

生成は未生成・変更分だけを処理し、同じ発話を日付やカード順序に依存しないIDで共有します。既存音声を検証し、一時ファイルから置換するので途中停止後も再開できます。話者やモデルを変更して既存録音を置き換えません。

```sh
# 日報リポジトリでfetchした固定コミットの索引と、公開音声の全バイトを照合
npm run audio:dedupe -- --daily-repo /path/to/japan-it-ai-daily --ref FULL_SUCCESSFUL_R2_COMMIT --verify
npm run audio:stage -- /tmp/n1-audio-storage-plan.json
# 出力フォルダ内のMP3だけを Supabase n1-audio/morioki-normal/ にアップロード
# 全ファイルの公開バイトを検証した後にのみ、再生先索引を原子的に更新
npm run audio:publish -- --plan /tmp/n1-audio-storage-plan.json
npm run audio:validate:remote
```

`FULL_SUCCESSFUL_R2_COMMIT` は実際に成功を検証した上流R2ワークフローの完全なコミットSHAに置き換えます。発話全文・話者・モデル・語速が一致する音声は既存R2ファイルを共有し、残りを既存Supabaseプロジェクトの公開 `n1-audio` バケットへ配置します。ファイル名にはバイト列のSHA-256を含めるため、日報側の再生成後も参照先は変わりません。既存の日報・面接音声は移動しません。

旧手動移行では管理画面からアップロードできますが、日次の自動処理は管理ログインを使いません。秘密キーをフロントエンドやリポジトリに保存せず、一般ユーザー向けのアップロード権限も追加しません。公開先の索引更新後は、通常の検証・ビルド・Pages・実際の再生まで確認します。

## 明示的な一回限りの音声修復

利用者が対象日を指定して修復を承認した場合だけ、前景で一度実行します。通常の `audio:auto` とLaunchAgentの時間帯・当日制限は変更しません。次の例の日付と保存先は、承認された対象に合わせて指定してください。

```sh
npm run audio:repair -- --dates 2026-10-20,2026-10-21 --evidence-dir /absolute/path/to/repair-evidence
```

同じOSロックを保持し、最新mainに対象日以外の未収録音声があれば生成・アップロード前に停止します。最大2時間で中断し、既存キャッシュと公開バイトの照合を再利用します。`schedule.json` は変更せず、生成済みキャッシュも削除しません。

検証のstdout・stderr、終了情報、Playwright JSON/HTMLと失敗traceは指定した永続フォルダーに残します。鍵や環境変数はログに保存しません。音声4ファイルだけの通常push、正確なPagesコミットと実際の再生の検証を省略しません。

## 録音終了後のアプリ終了

`npm run audio:generate`、通常ワーカー、一回限りの修復は、いずれも `scripts/aivis-session.py` を通して録音します。録音バッチは日報と共通のOSロックで保護し、終了後はmacOSの通常終了APIでAivisSpeechを閉じます。画面操作に依存しないため、ロック画面でも終了要求を送れます。アプリとエンジンの終了を確認し、結果は `~/Library/Application Support/AivisSpeech Automation/last-shutdown.json` に残します。ワーカーと修復処理は進捗の `appCleanup` にも保存します。

別の録音・接続中・未保存確認待ちの場合は終了を保留します。強制終了や未保存内容の破棄は行いません。録音、アップロード証明、復旧データ、確認時間帯は保持します。手動で安全な終了だけ再試行する場合は `python3 scripts/aivis-session.py --quit-only` を使います。この操作は音声生成やリモート確認を行いません。

## ワーカーのコード更新

通常の起動時は、許可された時間帯・当日制限を確認してから、専用の `control` チェックアウトでGitHubのmainを取得します。作業ツリーがクリーンなmainで、取得したmainへ早送りでき、更新後のコミットも一致する場合だけワーカーを起動します。未公開コミット、別ブランチ、分岐や未コミット変更がある場合は、リセット・退避・削除せず停止します。利用者の開発チェックアウトは変更しません。

教材や通常のワーカーコードは、次の許可された起動時に取り込みます。LaunchAgent用の起動スクリプト・時間帯の定義はインストール時のコピーなので、それらを変更した場合は公開後に `npm run audio:worker:install` を再実行します。この更新は既存の認証ヘルパー、進捗、候補音声を保持し、当日の実行制限や確認時間帯を解除しません。
