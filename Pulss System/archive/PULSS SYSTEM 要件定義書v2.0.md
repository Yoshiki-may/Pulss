# PULSS SYSTEM 要件定義書（MVP+）v2.0

※旧称「パルスチャット連携クライアント管理ダッシュボード」拡張版

対象読者:

- フロントエンドエンジニア（React / Next.js / TypeScript）
    
- バックエンドエンジニア（Python / FastAPI想定）
    
- 将来のAIエージェント実装担当
    

---

## 0. この版での追加・変更ポイント（サマリ）

v1.0（パルスチャット連携クライアント管理ダッシュボード）からの主な拡張:

1. **ディレクターボード / タスク管理機能の追加**
    
    - クライアントごとの「導入タスク（オンボーディング）」のテンプレ自動生成
        
    - 「運用中タスク」管理画面
        
    - Yamちゃん視点の**ディレクター一元管理ボード**（複数案件の進捗とリスクが一目で分かる）
        
2. **フェーズ管理の強化**
    
    - 「ヒアリング → 提案 → 見積 → 契約 → キックオフ → 運用中」までの進捗ステータスをクライアント単位で管理
        
    - 導入フェーズ用のタブ / 運用フェーズ用のタブでUIを分離
        
3. **タスク期限・アラート・通知**
    
    - 契約後1週間以内に完了すべき初期タスクのチェックリスト
        
    - 3日/7日経過・期限超過時の**色付け（赤）＋通知**（将来Slack連携）
        
4. **要件定義ボット「パルスくん」との連携強化**
    
    - クライアント自身が回答する**深掘りヒアリングチャット**（業種/プロダクト/強み/ターゲット/ゴール/こだわり 等）
        
    - その結果を構造化レポートとして**クライアント詳細画面に表示**（v1.0の pulse_responses を拡張）
        
5. **AI提案・サジェスト機能の土台**
    
    - 「次回撮影前の事前連絡文」「トレンドを踏まえた新企画案」などを生成する**AIサジェストAPI**（まずはドラフト生成）
        
    - 「しばらくコンタクトを取っていないクライアント」の検知ロジックのための**連絡履歴/最終接点日時**の管理
        
6. **RAG / PULSS専用AI向けデータ構造の準備**
    
    - 過去提案資料・実績・ナレッジを紐づける**KnowledgeDocument**メタデータ
        
    - 将来の「企画案の自動生成」「台本自動生成」への土台
        

---

## 1. システム概要

### 1.1 目的（アップデート）

- 営業・ディレクターの**ヒアリング力をテンプレ化**し、  
    誰が担当しても一定以上のヒアリングができる状態を作る。
    
- パルスチャット（要件定義ボット「パルスくん」）で集めた情報を  
    **ダッシュボードで一元管理**し、「提案/運用の起点データ」として活用する。
    
- 契約後〜運用開始以降の**ディレクター業務（タスク・進捗・顧客コミュニケーション）を可視化**し、  
    抜け漏れを防ぎ、山ちゃんに集中している「危機管理・アイデア出し」を分散できる状態を作る。
    
- 将来的に、PULSSのナレッジとAIエージェントを組み合わせることで  
    **高品質な戦略・企画・台本案の自動ドラフト生成**を目指す。
    

### 1.2 対象範囲（MVP+）

**MVP+で実装する範囲**

1. クライアント管理ダッシュボード（社内用）
    
    - クライアント一覧（成約前／成約済み）
        
    - クライアント詳細（基本情報＋パルス要件レポート＋フェーズ＋タスク）
        
2. パルスチャット連携（v1.0強化版）
    
    - 会社IDに紐づくパルスチャットURL発行
        
    - パルス回答の受信（n8n経由）と要件レポート表示
        
3. ディレクターボード
    
    - 案件ごとの**フェーズ進捗**と**タスク状態**を俯瞰できるボード
        
    - Yamちゃんが各案件に**タスクを追加**できるUI
        
4. タスク管理
    
    - 契約後に自動生成される「導入タスク」チェックリスト
        
    - 運用フェーズでの「運用タスク」追加・完了管理
        
    - 期限・ステータスによる色分けと簡易通知
        
5. 通知（MVP）
    
    - 「パルス回答が登録された」Slack通知（v1踏襲）
        
    - 「導入タスクが期限超過」したクライアントの**ハイライト表示＋シンプル通知**  
        （Slack連携は任意・まずは画面上のアラートでもOK）
        

**将来機能（この要件では概要のみ）**

- KPIダッシュボード（数値管理）
    
- コンテンツ管理・クリエイティブ資産管理
    
- AIによる企画案・台本の自動生成（PULSS専用AI）
    
- 自動リサーチエージェント（Deep Researchの全自動化）
    
- 人員アサインロジック（メンバーのトンマナ・スキル × 案件特性）
    

---

## 2. 非機能要件（ざっくり、v1.0踏襲）

- 同時利用: 社内ユーザー 50名＋クライアント500名想定
    
- 応答時間: 一般的な画面操作で 2秒以内目安
    
- 通信: 全てHTTPS/TLS
    
- 認証: MVPでは社内ログインのみ（ID/PW）。将来RBACを導入予定。
    
- インフラ想定:
    
    - AWS EC2 / Lightsail
        
        - Front: Next.js
            
        - Back: FastAPI
            
        - n8n: 別コンテナ or 別サーバ
            
    - DB: RDS(PostgreSQL) などRDB
        

---

## 3. 全体アーキテクチャ（アップデート版）

`[ブラウザ]    └→ [Next.js Frontend]           └→ [FastAPI Backend] ──→ [DB (PostgreSQL)]                                    └→ [オブジェクトストレージ(S3等) - 資料PDFなど]  [パルスチャットUI（GPTs / フォーム）]     ↓ POST [n8n Webhook]     └→ LLMで要約・構造化         └→ Backend /api/pulse-responses へPOST  [AIサジェスト系（将来）]   Backend ─→ LLM API (OpenAIなど)           └→ 提案ドラフトを DB (ai_suggestions) に保存  [Slack]   Backend ─→ Slack Webhook            └→ パルス回答登録 / タスク期限超過などを通知`

---

## 4. 画面要件

### 4.1 画面一覧

1. ログイン画面（簡易）
    
2. メインダッシュボード
    
    - 左ペイン：クライアント一覧
        
    - 右ペイン：クライアント詳細（タブ切り替え: 概要 / 導入タスク / 運用タスク / AI提案）
        
3. ディレクターボード（全案件のフェーズ / タスク状況一覧）
    
4. 通知インジケータ（ヘッダー右上等に簡易表示）
    

以降は 2 と 3 を中心に定義。

---

### 4.2 メインダッシュボード レイアウト

#### 4.2.1 左ペイン：クライアント一覧

**表示要素**

- ステータスタブ:
    
    - 「成約前」「成約済み」
        
- フィルタ:
    
    - 業種（Select / Tag）
        
    - フェーズ（ヒアリング / 提案 / 見積 / 契約 / キックオフ / 運用中）
        
- 検索:
    
    - 会社名 / メモ 部分一致
        
- クライアントリスト（スクロール可能）
    
    - 行項目:
        
        - 会社名
            
        - 業種
            
        - ステータスアイコン（成約前/成約済）
            
        - フェーズバッジ（例: 「提案中」「運用中」）
            
        - パルス要件レポート有無（アイコン）
            
        - 導入タスク完了率（%バー or アイコン）
            
        - アラートアイコン（タスク期限超過 / 長期間連絡なし 等）
            

**ユーザーアクション**

- 行クリック → 右ペインに詳細表示
    
- 「＋新規クライアント」ボタン → モーダル／右ペインで編集フォーム
    

---

#### 4.2.2 右ペイン：クライアント詳細（タブ構成）

##### 1) 概要タブ

**上部: 基本情報**

- 会社名
    
- 業種
    
- ステータス（成約前/成約済）＋変更ボタン
    
- フェーズ（ヒアリング / 提案 / 見積 / 契約 / キックオフ / 運用中）
    
- 担当営業（sales_owner）
    
- 担当ディレクター（director_owner）
    
- SlackチャンネルURL（クリックで別タブ）
    
- メモ
    
- 最終接点日（last_contact_at）
    
- アラート表示（例: 「最終接点から14日経過」「導入タスク未完了」）
    

**中央: パルス要件レポート（読み取り専用）**

セクション例（pulse_responses拡張）:

- プロダクト / サービス概要
    
- クライアントの課題・やりたいこと
    
- 現状のSNS運用
    
- 想定ターゲット・ゴール
    
- 参考アカウント／参考動画リンク
    
- クライアントの「強み・USP」と、その理由
    
- クライアントのこだわり・ブランドストーリー（任意）
    
- その他補足（自由記述）
    

**下部: 操作**

- 「パルスURL発行」ボタン
    
    - クリック → URL生成＆コピーUI表示
        
- 「AI提案ドラフト生成」ボタン（将来）
    
    - クリック → /clients/{id}/ai-suggestions を叩いてドラフト生成
        

##### 2) 導入タスクタブ（Onboarding）

**目的**  
契約後1週間でやるべき初期タスクの抜け漏れ防止。

**表示要素**

- タスク一覧（チェックリスト形式）
    
    - 例:
        
        - アカウント情報取得（ID/パス・バイパス等）
            
        - ロゴ・ブランド素材の受領
            
        - 画像/動画の共有ドライブリンク作成＆共有
            
        - 初回撮影日／スケジュールのドラフト
            
        - KPIやゴールの最終確認
            
- 各タスク行:
    
    - チェックボックス（完了）
        
    - タスク名
        
    - 期日（契約日＋N日）
        
    - ステータス（todo / 進行中 / 完了 / ブロック中）
        
    - 担当者（営業 / ディレクター）
        
    - 遅延インジケータ（期日超過で赤）
        

**UI要件**

- 上部に**完了率バー**（例: 5/8完了 → 62%）
    
- 期日まで3日 / 当日 / 超過 で色変化
    
- Yamちゃんが**任意タスクを追加**できる「＋タスク追加」ボタン
    

##### 3) 運用タスクタブ（Operations）

**目的**  
運用フェーズでの日々のタスク・「注意喚起タスク」を管理。

**表示要素**

- タスクリスト（テーブル or カンバン）
    
    - タスク名
        
    - タイプ（例: クライアント連絡 / 投稿確認 / 撮影調整 / レポート作成 / アイデア検討）
        
    - ステータス（todo / 進行中 / 完了 / ブロック中）
        
    - 期日
        
    - 担当者（ディレクター）
        
    - 生成元（手動 / テンプレ / Yamちゃん / AI）
        

**UI要件**

- 「新規タスク追加」ボタン
    
    - Yamちゃん / ディレクターが自由にタスク追加
        
- Yamちゃんがディレクターボードから**「このクライアントにこのタスクをポンと追加」**したとき、  
    ここに新規レコードが表示される。
    
- フィルタ：
    
    - ステータス / タイプ / 期日 / 担当者
        

##### 4) AI提案タブ（ドラフトビュー、MVPは簡易）

**目的**  
将来実装されるAI提案の結果表示枠だけ先に用意しておく。

**表示要素**

- 提案一覧:
    
    - タイトル（例: 「次回撮影前の事前連絡案」）
        
    - 種類（企画 / 連絡文面 / トレンド提案）
        
    - 作成日時
        
    - ステータス（ドラフト / Yamちゃん承認 / 送信済）
        
- 詳細表示:
    
    - 本文（プレーンテキスト / Markdown）
        
    - 「コピー」ボタン
        
    - 「編集」ボタン（テキストエリアで編集 → 保存で ai_suggestions 更新）
        

---

### 4.3 ディレクターボード画面

**目的**  
山ちゃんが全案件を俯瞰し、「危ない案件」「フォローが必要な案件」を一目で把握＆タスク追加できる。

**表示要素（テーブル形式の想定）**

- クライアント名
    
- フェーズ（ヒアリング / 提案 / … / 運用中）
    
- ステータス（成約前/成約済）
    
- 導入タスク完了率（%）
    
- 運用タスクの未完数
    
- 最終接点日（last_contact_at）
    
- アラート:
    
    - 導入タスク期限超過
        
    - 最終接点からX日経過
        
- 「クイックタスク追加」ボタン
    
    - 例: 「制作スケジュールの確認を依頼する」「次回撮影候補日を送る」などのプリセットも将来追加可能
        

**ユーザーアクション**

- 行クリック → 対象クライアントの詳細画面へ遷移
    
- 「クイックタスク追加」クリック → モーダルでタスク名＋期日＋担当者を入力 → 対象クライアントの運用タスクに登録
    

---

## 5. データモデリング（拡張）

### 5.1 ER 図（テキストイメージ）

`Client (1) ── (N) PulseResponse Client (1) ── (N) PulseLink Client (1) ── (N) Task Client (1) ── (N) AiSuggestion (将来) Client (1) ── (N) ContactLog (将来)  TaskTemplate (1) ── (N) Task (自動生成元)  (将来) Client (1) ── (N) KnowledgeDocument (将来) Member (1) ── (N) Task / Assignment`

---

### 5.2 テーブル定義（拡張版）

#### 5.2.1 clients テーブル（v1.0拡張）

|カラム名|型|必須|説明|
|---|---|---|---|
|id|UUID / int|✓|会社ID（主キー）|
|name|varchar|✓|会社名|
|industry|varchar|✓|業種（焼肉 / 美容 など）|
|status|varchar|✓|'pre_contract' / 'contracted'|
|phase|varchar|✓|'hearing' / 'proposal' / 'estimate' / 'contract' / 'kickoff' / 'operation' など|
|sales_owner|varchar|-|営業担当名|
|director_owner|varchar|-|ディレクター担当名|
|slack_url|varchar|-|SlackチャンネルURL|
|memo|text|-|社内メモ|
|onboarding_completed_at|timestamp|-|導入タスク完了日時|
|last_contact_at|timestamp|-|クライアントとの最終接点日時|
|created_at|timestamp|✓|作成日時|
|updated_at|timestamp|✓|更新日時|

---

#### 5.2.2 pulse_responses テーブル（要件レポート拡張）

v1.0の項目に加え、クライアントの強み・ゴールなどもカバーできるよう拡張。

|カラム名|型|必須|説明|
|---|---|---|---|
|id|UUID/int|✓|回答ID（主キー）|
|client_id|UUID/int|✓|clients.id へのFK|
|problem|text|-|クライアントの課題・要望サマリ|
|current_sns|text|-|現状SNS運用サマリ|
|target|text|-|想定ターゲット・ゴールサマリ|
|product_summary|text|-|プロダクト/サービス概要|
|strengths_usp|text|-|強み・USPとその理由|
|brand_story|text|-|ブランドストーリー / こだわり（任意）|
|reference_accounts|text(JSON)|-|参考アカウントURLリスト|
|raw_payload|json|-|元の回答データ（バックアップ）|
|submitted_at|timestamp|✓|回答日時|

※ クライアントごとに「最新1件」を主に利用（履歴は保持してもよい）

---

#### 5.2.3 pulse_links テーブル（v1.0ほぼ据え置き）

|カラム名|型|必須|説明|
|---|---|---|---|
|id|UUID/int|✓|主キー|
|client_id|UUID/int|✓|clients.id へのFK|
|token|varchar|✓|URL用トークン（ランダム文字列）|
|expires_at|timestamp|-|有効期限（MVPではnullでも可）|
|created_at|timestamp|✓|発行日時|

---

#### 5.2.4 tasks テーブル（新規）

導入タスク / 運用タスク共通。

|カラム名|型|必須|説明|
|---|---|---|---|
|id|UUID/int|✓|タスクID|
|client_id|UUID/int|✓|clients.id FK|
|title|varchar|✓|タスク名|
|description|text|-|詳細説明|
|category|varchar|✓|'onboarding' / 'operation' / 'other'|
|status|varchar|✓|'todo' / 'in_progress' / 'done' / 'blocked'|
|due_date|date|-|期日|
|completed_at|timestamp|-|完了日時|
|assignee|varchar|-|担当者名（将来member_idに変更も可）|
|source|varchar|-|'template' / 'manual' / 'yam' / 'ai'|
|template_id|UUID/int|-|task_templates.id FK（テンプレ由来なら）|
|created_at|timestamp|✓|作成日時|
|updated_at|timestamp|✓|更新日時|

---

#### 5.2.5 task_templates テーブル（新規）

契約後に自動生成される「導入タスク」用テンプレ。

|カラム名|型|必須|説明|
|---|---|---|---|
|id|UUID/int|✓|テンプレID|
|name|varchar|✓|タスク名（例: アカウント情報取得）|
|category|varchar|✓|'onboarding' / 'operation'|
|default_offset_days|int|-|契約日から何日後を期日にするか（例: 3, 7）|
|default_assignee_role|varchar|-|'sales' / 'director' など|
|is_active|boolean|✓|有効フラグ|
|sort_order|int|-|表示順|
|created_at|timestamp|✓|作成日時|
|updated_at|timestamp|✓|更新日時|

---

#### 5.2.6 ai_suggestions テーブル（将来 / スケルトン）

|カラム名|型|必須|説明|
|---|---|---|---|
|id|UUID/int|✓|提案ID|
|client_id|UUID/int|✓|clients.id FK|
|type|varchar|✓|'next_shoot_proposal' / 'touchpoint_message' など|
|title|varchar|✓|提案タイトル|
|body|text|✓|提案本文（AI生成＋手修正）|
|status|varchar|✓|'draft' / 'approved' / 'sent'|
|created_by|varchar|✓|'ai' / 'user:{name}'|
|created_at|timestamp|✓|作成日時|
|updated_at|timestamp|✓|更新日時|

---

#### 5.2.7 contact_logs テーブル（将来 / アラート用）

|カラム名|型|必須|説明|
|---|---|---|---|
|id|UUID/int|✓|ログID|
|client_id|UUID/int|✓|clients.id FK|
|contact_at|timestamp|✓|接点日時|
|channel|varchar|✓|'line' / 'email' / 'phone' / 'meeting' など|
|summary|text|-|内容サマリ|
|created_by|varchar|-|登録者|
|created_at|timestamp|✓|作成日時|

※ MVPでは、last_contact_at を手入力 or 最小限の自動更新に留めてもよい。

---

## 6. API 要件（FastAPI 想定・拡張）

ベースURL: `/api`

### 6.1 クライアント関連（v1.0拡張）

#### 6.1.1 GET /clients

- 概要: クライアント一覧取得
    
- クエリ:
    
    - `status` (optional): 'pre_contract' / 'contracted'
        
    - `industry` (optional)
        
    - `phase` (optional)
        
    - `q` (optional): 部分一致検索
        
- レスポンス例:
    

`[   {     "id": 1,     "name": "焼肉A",     "industry": "飲食",     "status": "contracted",     "phase": "operation",     "has_pulse_response": true,     "onboarding_progress": 0.75,     "has_alert": true   } ]`

---

#### 6.1.2 POST /clients

- 概要: クライアント新規作成
    
- リクエスト:
    

`{   "name": "焼肉A",   "industry": "飲食",   "status": "pre_contract",   "phase": "hearing",   "sales_owner": "営業A",   "director_owner": "ディレクターB",   "slack_url": "https://...",   "memo": "メモ" }`

- 処理:
    
    - `status` が 'contracted' になったタイミングで、バックエンド側で  
        `task_templates` から `tasks` を自動生成（onboardingカテゴリー）。
        

---

#### 6.1.3 GET /clients/{id}

- 概要: クライアント詳細取得
    
- レスポンス例（v1.0拡張）:
    

`{   "id": 1,   "name": "焼肉A",   "industry": "飲食",   "status": "contracted",   "phase": "operation",   "sales_owner": "営業A",   "director_owner": "ディレクターB",   "slack_url": "https://...",   "memo": "メモ",   "onboarding_completed_at": null,   "last_contact_at": "2025-11-30T12:00:00",   "latest_pulse_response": {     "problem": "集客が不安定",     "current_sns": "Instagramを週3投稿",     "target": "20〜30代のカップル",     "product_summary": "焼肉コース",     "strengths_usp": "デート向きの雰囲気・個室",     "brand_story": "家族経営で30年…",     "reference_accounts": [       "https://instagram.com/xxx"     ],     "submitted_at": "2025-12-01T12:00:00"   },   "onboarding_tasks_summary": {     "total": 8,     "done": 5   } }`

---

#### 6.1.4 PUT /clients/{id}

- 概要: クライアント情報更新（ステータス・フェーズ変更含む）
    
- 特記事項:
    
    - `status` を 'pre_contract' → 'contracted' に変更したとき、
        
        - `task_templates` から `tasks` を自動生成
            
    - `phase` が 'operation' になった際に `onboarding_completed_at` の自動セットも検討
        

---

### 6.2 パルスURL関連（v1.0踏襲）

#### 6.2.1 POST /clients/{id}/pulse-link

- 概要: 指定クライアント向けのパルスURLトークンを発行
    
- 処理:
    
    - `pulse_links` にレコードを作成
        
    - URLテンプレート例: `https://pulse.example.com/form?token={token}`
        
- レスポンス:
    

`{   "url": "https://pulse.example.com/form?token=xxxxx" }`

---

### 6.3 パルス回答受信（n8n → Backend）

#### 6.3.1 POST /pulse-responses

- 概要: n8nからのサマリ結果を受信して保存
    
- リクエスト例:
    

`{   "token": "xxxxx",   "problem": "課題サマリ…",   "current_sns": "現状サマリ…",   "target": "ターゲットサマリ…",   "product_summary": "プロダクト概要…",   "strengths_usp": "強み…",   "brand_story": "ストーリー…",   "reference_accounts": [     "https://instagram.com/aaa",     "https://instagram.com/bbb"   ],   "raw_payload": {     "q1": "xxxxx",     "q2": "yyyyy"   } }`

- 処理:
    
    - `token` から `pulse_links` を検索 → `client_id` を特定
        
    - `pulse_responses` にINSERT（既存を過去レコードとして残してもよい）
        
    - クライアント詳細の `has_pulse_response` フラグ更新
        
    - Slack通知（「パルス要件レポートが登録されました」）
        

---

### 6.4 タスク関連 API（新規）

#### 6.4.1 GET /clients/{id}/tasks

- 概要: クライアント単位のタスク一覧取得
    
- クエリ:
    
    - `category` (optional): 'onboarding' / 'operation'
        
    - `status` (optional): 'todo' 等
        
- レスポンス: `Task[]`
    

#### 6.4.2 POST /clients/{id}/tasks

- 概要: クライアントに紐づくタスクを新規作成（手動追加）
    
- 用途:
    
    - Yamちゃんの「注意喚起タスク」追加
        
    - ディレクターの任意タスク追加
        

#### 6.4.3 PUT /tasks/{id}

- 概要: タスク更新（ステータス / 期日 / 担当者など）
    

---

### 6.5 ディレクターボード API（新規）

#### 6.5.1 GET /director-board/clients

- 概要: ディレクターボードで使用する集約情報取得
    
- レスポンス例:
    

`[   {     "client_id": 1,     "name": "焼肉A",     "phase": "operation",     "status": "contracted",     "onboarding_progress": 0.75,     "open_tasks_count": 3,     "last_contact_at": "2025-11-30T12:00:00",     "has_alert": true   } ]`

---

### 6.6 AIサジェスト API（将来・スケルトン）

#### 6.6.1 POST /clients/{id}/ai-suggestions

- 概要: 指定クライアントの情報を元にAI提案を生成
    
- 処理（将来）:
    
    - `clients`, `pulse_responses`, `tasks`, 過去の `ai_suggestions` などを参照しLLMへ投げる
        
    - 結果を `ai_suggestions` に保存
        
- レスポンス: 生成された `AiSuggestion` オブジェクト
    

---

## 7. フロント実装方針（Next.js + TypeScript）

### 7.1 ディレクトリ例（v1.0拡張）

`/src   /app or /pages     /login     /dashboard        // メインダッシュボード（クライアント詳細＋タスク）     /director-board   // ディレクターボード   /components     /layout       Sidebar.tsx       MainLayout.tsx     /clients       ClientList.tsx       ClientDetail.tsx       ClientOverview.tsx       ClientOnboardingTasks.tsx       ClientOperationTasks.tsx       ClientAiSuggestions.tsx     /tasks       TaskList.tsx       TaskRow.tsx       TaskQuickAddModal.tsx   /lib     apiClient.ts     types.ts`

### 7.2 型定義（抜粋）

`export type ClientStatus = 'pre_contract' | 'contracted'; export type ClientPhase =   | 'hearing'   | 'proposal'   | 'estimate'   | 'contract'   | 'kickoff'   | 'operation';  export interface ClientSummary {   id: number;   name: string;   industry: string;   status: ClientStatus;   phase: ClientPhase;   has_pulse_response: boolean;   onboarding_progress?: number;   has_alert?: boolean; }  export type TaskCategory = 'onboarding' | 'operation' | 'other'; export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';  export interface Task {   id: number;   client_id: number;   title: string;   description?: string;   category: TaskCategory;   status: TaskStatus;   due_date?: string;   assignee?: string;   source?: 'template' | 'manual' | 'yam' | 'ai'; }  export interface PulseResponse {   problem?: string;   current_sns?: string;   target?: string;   product_summary?: string;   strengths_usp?: string;   brand_story?: string;   reference_accounts?: string[];   submitted_at: string; }  export interface ClientDetail extends ClientSummary {   sales_owner?: string;   director_owner?: string;   slack_url?: string;   memo?: string;   onboarding_completed_at?: string;   last_contact_at?: string;   latest_pulse_response?: PulseResponse; }`

---

## 8. 実装の進め方（追加部分中心）

既存 v1.0 の STEP に以下を追加するイメージです。

1. **STEP A: task_templates / tasks テーブルの追加**
    
    - マイグレーションで新テーブル作成
        
    - 初期データとして導入タスクのテンプレ登録（SQL Seed）
        
2. **STEP B: /clients ステータス変更時の自動タスク生成**
    
    - `PUT /clients/{id}` で `status` が 'contracted' になったタイミングで
        
        - `task_templates` → `tasks` INSERT
            
3. **STEP C: タスクAPI & フロントのタスクタブ実装**
    
    - `/clients/{id}/tasks` GET/POST/PUT
        
    - `ClientOnboardingTasks`, `ClientOperationTasks` コンポーネントを作る
        
4. **STEP D: ディレクターボードAPI & 画面**
    
    - `/director-board/clients` 実装
        
    - テーブルUIで「アラートのある案件が上に来る」など簡易ソート
        
5. **STEP E: last_contact_at とアラートの最小実装**
    
    - MVPでは:
        
        - クライアント詳細画面で `last_contact_at` を編集可能にする
            
        - バックエンドで `has_alert` を「最終接点からX日以上」や「onboarding未完」などで計算
            
6. **STEP F: パルス要件レポートの項目拡張**
    
    - `pulse_responses` に新カラム追加
        
    - フロントで新しいセクションを表示
        

---