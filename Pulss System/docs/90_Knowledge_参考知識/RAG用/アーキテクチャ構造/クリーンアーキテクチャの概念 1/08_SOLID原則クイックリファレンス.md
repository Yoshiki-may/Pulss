# SOLID原則 クイックリファレンス

## 📌 この文書について
SOLID原則をすぐに参照できる形にまとめたクイックリファレンス

---

## 🎯 SOLID原則 一覧

### S - SRP: Single Responsibility Principle

**日本語**: 単一責任の原則

**定義**:
> モジュールは、1つのアクターに対してのみ責任を負うべき

**別の表現**:
> モジュールを変更する理由は1つだけであるべき

#### ❌ よくある誤解
「モジュールは1つのことだけをすべき」
→ これは関数レベルの原則

#### ✅ 正しい理解
「モジュールは1つのアクター（変更を望む人々のグループ）に対してのみ責任」

#### 実例

**悪い例**:
```
Employee クラス
├─ calculatePay()    （CFO/財務チームが変更を要求）
├─ reportHours()     （COO/人事チームが変更を要求）
└─ save()            （CTO/DBAチームが変更を要求）

3つのアクター → SRP違反
```

**良い例**:
```
PayCalculator
└─ calculatePay()    （財務チームのみ）

HourReporter
└─ reportHours()     （人事チームのみ）

EmployeeSaver
└─ save()            （DBAチームのみ）

各クラスは1つのアクターにのみ責任
```

#### チェック方法
```
質問: 「このクラスを変更する理由は何か？」
答えが複数 → SRP違反
答えが1つ → SRP準拠
```

#### 適用レベル
- クラス/モジュール（本来の適用先）
- コンポーネント（CCP: 閉鎖性共通の原則）
- アーキテクチャ（変更の軸）

---

### O - OCP: Open-Closed Principle

**日本語**: オープン・クローズドの原則

**定義**:
> ソフトウェアは、拡張に対して開いており、修正に対して閉じているべき

**意味**:
- **拡張に開いている**: 新しい振る舞いを追加できる
- **修正に閉じている**: 既存のコードを変更する必要がない

#### 実現方法

**ポリモーフィズムの活用**:
```
【Before（OCP違反）】
財務データ → 計算ロジック → HTML生成

PDF対応のために計算ロジックを修正
↓
既存のHTML生成に影響

【After（OCP準拠）】
財務データ → 計算ロジック → Presenterインターフェース
                                ↑          ↑
                         HTMLPresenter  PDFPresenter
                         
新しいPresenterを追加するだけ
計算ロジックは無修正
```

#### 方向の制御
```
低レベル（詳細） → 高レベル（ビジネスルール）

依存の向き: 保護すべきものに向かう
```

#### チェック方法
```
質問: 「新機能追加時に既存コードを修正するか？」
Yes → OCP違反
No → OCP準拠
```

#### 適用の鍵
- インターフェースに依存
- 抽象に依存
- DIPと組み合わせる

---

### L - LSP: Liskov Substitution Principle

**日本語**: リスコフの置換原則

**定義**:
> 派生型（サブタイプ）は、その基本型（ベースタイプ）と置換可能であるべき

**Barbara Liskovの定義**（1988）:
型Sのオブジェクトを型Tのオブジェクトで置き換えても、
プログラムPの振る舞いが変わらないなら、
SはTのサブタイプである

#### 古典的な例: 正方形・長方形問題

```java
Rectangle r = new Square();  // Square extends Rectangle
r.setWidth(5);
r.setHeight(4);
assert r.getArea() == 20;  // 失敗！（Squareなら16）

Square は Rectangle と置換できない
→ LSP違反
```

#### 教訓
```
is-a 関係だけでは不十分
振る舞いこそが重要

数学的には Square is-a Rectangle
プログラム的には違う
```

#### アーキテクチャレベルでの適用

**RESTサービスの例**:
```
すべてのサービスが同じインターフェース契約を守る
  ↓
どのサービスに接続しても同じように動作
  ↓
サービスを置き換えても問題なし
```

#### チェック方法
```
質問: 「基底型への参照を派生型で置き換えても動作するか？」
No → LSP違反
Yes → LSP準拠
```

---

### I - ISP: Interface Segregation Principle

**日本語**: インターフェイス分離の原則

**定義**:
> クライアントは、使用しないメソッドへの依存を強制されるべきではない

#### 問題のシナリオ

```java
interface AllInOne {
  methodA();  // クライアント1が使用
  methodB();  // クライアント2が使用
  methodC();  // クライアント3が使用
}

class Client1 implements AllInOne {
  methodA() { ... }  // 使う
  methodB() { throw new UnsupportedOperationException(); }  // 使わない
  methodC() { throw new UnsupportedOperationException(); }  // 使わない
}

methodB が変更
  ↓
Client1 も再コンパイル・再デプロイ必要
  ↓
ISP違反
```

#### 解決策

```java
interface InterfaceA { methodA(); }
interface InterfaceB { methodB(); }
interface InterfaceC { methodC(); }

class Client1 implements InterfaceA {
  methodA() { ... }  // これだけでOK
}

methodB が変更されても Client1 は影響を受けない
```

#### アーキテクチャレベル

```
システムS が 大きなフレームワークF に依存
  ↓
F の使わない部分が変更
  ↓
S も影響を受ける（再デプロイなど）
  ↓
ISP違反

解決:
必要な機能のみのインターフェースに依存
```

#### チェック方法
```
質問: 「使わないメソッド/機能に依存しているか？」
Yes → ISP違反
No → ISP準拠
```

---

### D - DIP: Dependency Inversion Principle

**日本語Menu 依存関係逆転の原則

**定義**:
> 上位レベルのモジュールは下位レベルのモジュールに依存すべきではない。
> どちらも抽象に依存すべきである。

**追加**:
> 抽象は詳細に依存すべきではない。
> 詳細が抽象に依存すべきである。

#### 従来の依存（DIP以前）

```
高レベル方針
  ↓ 依存
低レベル詳細

例:
ビジネスロジック → データベース
ビジネスロジック → UI
```

#### DIP適用後

```
高レベル方針
  ↓ 定義
インターフェース（抽象）
  ↑ 実装
低レベル詳細

例:
ビジネスロジック → RepositoryInterface ← MySQLRepository
ビジネスロジック → PresenterInterface ← WebPresenter
```

#### 実践ルール

**避けるべきこと**:
1. ❌ 具象クラスへの依存
2. ❌ 具象クラスの継承
3. ❌ 具象関数のオーバーライド
4. ❌ 具象の名前に言及

**すべきこと**:
1. ✅ インターフェースに依存
2. ✅ 抽象クラスに依存
3. ✅ Factoryで具象を生成

#### Abstract Factory パターン

```
【高レベル】
Application
  ↓ 使う
ServiceInterface
  
【低レベル】  
ConcreteServiceImpl
  ↑ 生成
ServiceFactory ← ConcreteServiceFactory

依存の向き: すべて高レベルに向かう
```

#### チェック方法
```
import文を確認:

Entities/Use Cases から:
□ 具象クラスをimportしていないか？
□ インターフェースのみimport？

詳細（Controllers, Repositories実装）から:
□ 抽象（Interface）をimportしているか？
```

---

## 🎯 SOLID原則の統合的適用

### 依存関係の設計

```
【ステップ1: SRPで分離】
アクターごとにクラスを分ける

【ステップ2: OCPで拡張性】
インターフェースを定義
拡張に開く

【ステップ3: LSPで置換性】
インターフェースの契約を守る
派生型が基底型と置換可能に

【ステップ4: ISPで最小化】
大きなインターフェースを分割
必要なものだけに依存

【ステップ5: DIPで逆転】
依存を抽象に
高レベルに向ける

結果: クリーンで柔軟なアーキテクチャ
```

---

## 🔧 実践パターン集

### パターン1: Repository パターン（DIP + ISP）

```java
// Use Case層で定義（高レベル）
interface UserRepository {
  User findById(UserId id);
  void save(User user);
}

// Infrastructure層で実装（低レベル）
class MySQLUserRepository implements UserRepository {
  public User findById(UserId id) {
    // SQLの詳細
  }
  
  public void save(User user) {
    // SQLの詳細
  }
}

// Use Case（高レベル）
class RegisterUserUseCase {
  UserRepository repository;  // インターフェースに依存
  
  public void execute(...) {
    // repository使用、MySQLかどうかは知らない
  }
}

依存: MySQLUserRepository → UserRepository ← RegisterUserUseCase
DIP適用: 高レベルが低レベルに依存していない
ISP適用: 必要なメソッドのみのインターフェース
```

---

### パターン2: Strategy パターン（OCP + LSP）

```java
// 戦略のインターフェース
interface PaymentStrategy {
  void pay(Money amount);
}

// 具象戦略
class CreditCardPayment implements PaymentStrategy {
  public void pay(Money amount) { ... }
}

class PayPalPayment implements PaymentStrategy {
  public void pay(Money amount) { ... }
}

// 使用側
class OrderProcessor {
  public void process(Order order, PaymentStrategy strategy) {
    // ...
    strategy.pay(order.getTotal());  // どの実装かは知らない
  }
}

OCP: 新しい支払い方法を追加しても、OrderProcessorは無修正
LSP: どの PaymentStrategy 実装でも置換可能
```

---

### パターン3: Facade パターン（ISP）

```java
// 大きく複雑なシステム
class ComplexSystem {
  methodA();
  methodB();
  methodC();
  methodD();
  methodE();
  // ... 100個のメソッド
}

// クライアントが本当に必要なのは一部だけ
interface SimpleFacade {
  doTask1();  // 内部でmethodA, B を呼ぶ
  doTask2();  // 内部でmethodC, D, E を呼ぶ
}

class FacadeImpl implements SimpleFacade {
  ComplexSystem system;
  
  public void doTask1() {
    system.methodA();
    system.methodB();
  }
}

ISP: クライアントは必要なメソッドのみのインターフェースに依存
```

---

### パターン4: Adapter パターン（LSP + DIP）

```java
// 既存の外部ライブラリ（変更できない）
class ThirdPartyEmailService {
  public void sendMail(String to, String subject, String body) { ... }
}

// 自分のシステムのインターフェース
interface EmailSender {
  void send(Email email);
}

// アダプター
class ThirdPartyEmailAdapter implements EmailSender {
  ThirdPartyEmailService service;
  
  public void send(Email email) {
    // Email → ThirdPartyのフォーマットに変換
    service.sendMail(email.getTo(), email.getSubject(), email.getBody());
  }
}

// Use Case
class NotifyUserUseCase {
  EmailSender emailSender;  // インターフェースに依存
  
  public void execute(...) {
    emailSender.send(email);  // 実装の詳細を知らない
  }
}

DIP: Use Case は抽象に依存、Third Partyの詳細を知らない
LSP: 任意のEmailSender実装と置換可能
```

---

## 📊 SOLID違反の典型パターンと修正

### アンチパターン1: God Object（SRP違反）

**問題**:
```java
class UserManager {
  // 認証
  boolean authenticate(String username, String password) { ... }
  
  // ユーザー管理
  void createUser(User user) { ... }
  void deleteUser(UserId id) { ... }
  
  // メール送信
  void sendWelcomeEmail(User user) { ... }
  
  // レポート生成
  Report generateUserReport() { ... }
  
  // ログ記録
  void logUserActivity(Activity activity) { ... }
}

複数のアクター、複数の責任 → SRP違反
```

**修正**:
```java
class AuthenticationService {
  boolean authenticate(...) { ... }
}

class UserRepository {
  void save(User user) { ... }
  void delete(UserId id) { ... }
}

class UserNotificationService {
  void sendWelcomeEmail(User user) { ... }
}

class UserReportGenerator {
  Report generate() { ... }
}

class UserActivityLogger {
  void log(Activity activity) { ... }
}

各クラスは1つの責任のみ
```

---

### アンチパターン2: 具象への直接依存（DIP違反）

**問題**:
```java
class OrderService {
  // 具象クラスに直接依存
  MySQLOrderRepository repository = new MySQLOrderRepository();
  
  public void processOrder(Order order) {
    repository.save(order);
  }
}

MySQLに強く依存 → DIP違反
テスト困難
DB変更が大変
```

**修正**:
```java
// インターフェース定義（高レベル）
interface OrderRepository {
  void save(Order order);
}

// Use Case（高レベル）
class ProcessOrderUseCase {
  OrderRepository repository;  // 抽象に依存
  
  public ProcessOrderUseCase(OrderRepository repository) {
    this.repository = repository;  // 注入される
  }
  
  public void execute(Order order) {
    repository.save(order);  // 実装の詳細を知らない
  }
}

// 実装（低レベル）
class MySQLOrderRepository implements OrderRepository {
  public void save(Order order) { ... }
}

// 構成（Main）
OrderRepository repo = new MySQLOrderRepository();
ProcessOrderUseCase useCase = new ProcessOrderUseCase(repo);

DIP適用: 高レベルが抽象に依存
```

---

### アンチパターン3: Fat Interface（ISP違反）

**問題**:
```java
interface UserService {
  // 認証関連
  void login(String username, String password);
  void logout();
  
  // プロフィール関連
  User getProfile(UserId id);
  void updateProfile(User user);
  
  // レポート関連
  List<User> getUsersReport(Date from, Date to);
  Statistics getStatistics();
}

LoginController が UserService に依存
  ↓
getStatistics() が変更
  ↓
LoginController も再コンパイル
  ↓
ISP違反
```

**修正**:
```java
interface AuthenticationService {
  void login(String username, String password);
  void logout();
}

interface ProfileService {
  User getProfile(UserId id);
  void updateProfile(User user);
}

interface UserReportService {
  List<User> getUsersReport(Date from, Date to);
  Statistics getStatistics();
}

// クライアントは必要なインターフェースのみに依存
class LoginController {
  AuthenticationService authService;  // これだけ
}

ISP適用: 必要な機能のみのインターフェース
```

---

## 🎯 SOLID原則の実践チェックリスト

### 設計時のチェック

**SRP**:
- [ ] 各クラスの責任は1つか？
- [ ] 変更する理由は1つか？
- [ ] 異なるアクターの責任が混在していないか？

**OCP**:
- [ ] 新機能追加時に既存コード修正が必要か？
- [ ] インターフェースで拡張ポイントを提供しているか？
- [ ] 保護すべき方針は保護されているか？

**LSP**:
- [ ] 派生型は基底型と置換可能か？
- [ ] インターフェースの契約を守っているか？
- [ ] クライアントが実装を意識する必要があるか？

**ISP**:
- [ ] 使わないメソッドへの依存があるか？
- [ ] インターフェースは最小限か？
- [ ] クライアントごとに専用インターフェースがあるか？

**DIP**:
- [ ] 高レベルは低レベルに依存していないか？
- [ ] 抽象に依存しているか？
- [ ] 具象クラスを直接インスタンス化していないか？

---

### コードレビュー時のチェック

#### import文の確認

**Entities/Use Cases クラス**:
```java
// NG例
import com.mysql.jdbc.*;          // DB詳細
import javax.servlet.*;           // Web詳細
import org.springframework.*;     // フレームワーク

// OK例
import java.util.*;               // 標準ライブラリ
import com.myapp.domain.*;        // 同レベルまたは内側
```

#### 依存の向きの確認

```
矢印（import）の向き:
外側 → 内側

Controllers → Use Cases → Entities
Repositories実装 → Repository Interface（Use Cases層で定義）
```

#### クラスの責任の確認

```
クラス名から責任が明確か？
- UserValidator（バリデーションのみ）
- OrderCalculator（計算のみ）
- ProductRepository（永続化のみ）

God Object（何でもやるクラス）はないか？
```

---

## 💡 SOLID原則マスターへの道

### レベル1: 知識（本を読む）
```
各原則の定義を理解
例を見て理解
```

### レベル2: 認識（違反を見つける）
```
既存のコードで違反を発見できる
「これはSRP違反だ」と気づく
```

### レベル3: 適用（新規コードで適用）
```
新しいコードでSOLIDを意識して書ける
設計時にSOLIDを考慮
```

### レベル4: リファクタリング（既存コードを改善）
```
既存コードのSOLID違反を修正できる
安全にリファクタリングできる
```

### レベル5: アーキテクチャ（システムレベルで適用）
```
アーキテクチャレベルでSOLIDを適用
コンポーネント設計でSOLIDを活用
システム全体のアーキテクチャ方針を決定
```

### レベル6: 教育（他者に教える）
```
チームメンバーに教えられる
なぜその原則が重要か説明できる
レビューで適切な指摘ができる
```

---

## 🎯 Quick Tips

### Tip 1: SOLID違反のコードの匂い

```
🚨 God Object
  → SRP違反の可能性

🚨 Switch文/if-else の連鎖
  → OCP違反の可能性
  → ポリモーフィズムで解決

🚨 型チェック（instanceof, typeof）
  → LSP違反の可能性
  → 派生型の振る舞いが異なる

🚨 大きなインターフェース
  → ISP違反の可能性
  → インターフェースを分割

🚨 new キーワードが多い
  → DIP違反の可能性
  → Factoryで抽象化
```

---

### Tip 2: リファクタリングの優先順位

```
1. DIP違反を修正（最優先）
   → アーキテクチャの基盤

2. SRP違反を修正
   → 責任の分離

3. OCP違反を修正
   → 拡張性の向上

4. ISP違反を修正
   → 依存の最小化

5. LSP違反を修正
   → 置換可能性の確保
```

---

### Tip 3: テストでSOLID準拠を確認

```
テストが書きにくい
  ↓
SOLID違反の可能性

具体的には:
- モックが作れない → DIP違反
- 1つのテストで複数の責任をテスト → SRP違反
- テストが壊れやすい → OCP違反
- 実装を知らないとテストできない → LSP違反
```

---

## 📚 さらに学ぶために

### 実践的な演習

**演習1: コードレビュー**
```
既存のコードベースを選ぶ
  ↓
SOLID違反を探す
  ↓
どう修正すべきか考える
  ↓
実際にリファクタリング（可能なら）
```

**演習2: 設計の比較**
```
同じ機能を:
- SOLID違反で実装
- SOLID準拠で実装
  ↓
両方を比較
  ↓
違いを体感
```

**演習3: アーキテクチャレビュー**
```
自分のプロジェクトで:
- 依存関係を図示
- SOLID原則でチェック
- 改善点を特定
```

---

**次に読むべきファイル**: `09_用語集.md`

