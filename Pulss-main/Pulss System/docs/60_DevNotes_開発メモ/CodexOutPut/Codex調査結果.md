# Codex調査結果（2025-12-07）

## 参照したもの
- `プロセス/今までの流れ.md`
- `Pulss system/Code/Pulss-main`（React + Vite プロジェクト全体）
- `CodexOutPut` フォルダ

## 状況サマリ
- n8n フローは「RSS → JS 整形 → LLM 要約・ラベル → HTTP POST(`/api/sns-news`)」まで設計済みだが、送信先 FastAPI バックエンドが未実装。
- AWS: Amazon Linux 2023 / t3.small 上で n8n とフロントを起動できる状態。OpenAI API は無料枠のままでレート制限に阻まれている。
- フロント（Pulss-main）はモックデータで表示する React SPA。ビルドは通るが、画面文言がすべて文字化けしており UX が破綻。実データ/API 連携も未着手。

## コード調査メモ（Pulss-main）
- React 19 + Vite 6。Tailwind CDN を index.html で直読み。依存は `react`, `react-dom`, `lucide-react` のみ。
- `services/clientService.ts` でクライアント・ニュース・スケジュールはすべてメモリ上のモック。永続化や API 呼び出しはなし。ID 生成も `Math.random()` で衝突リスクあり。
- 主要 UI（`App.tsx`, `components/**`）の日本語文字列が cp932 由来と思われる文字化け状態。アラートやラベルが読めず、プロダクト品質に達していない。
- index.html に React/Lucide の importmap が残っているが、Vite バンドルと二重管理になるため本番配信では不要。Tailwind CDN もパージされずバンドルと分離している。

## 現状の課題
1) OpenAI API: 無料枠レート制限で n8n が安定稼働できない。課金/上限設定が必須。  
2) バックエンド未実装: `/api/sns-news` ほか最低限の FastAPI エンドポイントをまだ用意していない。n8n→API→DB のパスがない。  
3) フロント文字化け: すべての UI 文言が文字化けしており、利用不能。エンコードとコピー元の修正が必要。  
4) データ永続化なし: クライアント/ニュース/スケジュールはモックのみ。再起動で消えるうえ、n8n から送信しても保存先がない。  
5) 配信方式の整理: Tailwind CDN + importmap は検証向き。Nginx 配信や環境変数化、Systemd 常駐など本番運用設計がまだ。

## 次に掘るべき確認ポイント
- エディタ/OS の保存エンコーディングを UTF-8 に統一できているかを確認（既存ファイルは文字化けしているため全面修正が必要）。
- バックエンドのデータモデル（ニュース記事、クライアント、スケジュール）を定義し、n8n から受け取る JSON 形式を確定。
- フロントと FastAPI の疎通方法（ベース URL、CORS、認証方式）を決め、環境変数で切り替えられるようにする。
