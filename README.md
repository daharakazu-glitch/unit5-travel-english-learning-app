# Unit 5: What can we learn from traveling? オンデマンド英語学習アプリ

教材PDF（教科書 pp.70-78, 199 / 本文学習ノート pp.80-97）に完全準拠した、**全問インタラクティブ演習・オンデマンド音声再生・一文録音＆発音AI自動評価機能付き**のWebアプリケーションです。

---

## 🌟 主な機能と特徴

### 1. 教材PDFの全9パート・全問題を完全網羅
- **Listening 1 Part 1** (夏休みの予定・ギャップ・イヤーの概念)
- **Listening 1 Part 2** (Caraの欧州旅行計画・ベニス・プラハ・ギリシャ)
- **Reading 1 Part 1** (ギャップ・イヤーの広がりと背景・アイルランドや米国トップ大の動向)
- **Reading 1 Part 2** (豪・NZ・英国での文化・Benのペルー体験談)
- **Reading 1 Part 3** (ギャップ・イヤーの課題・Sabinaの失敗体験と教訓)
- **Listening 2 Part 1** (トヨダ国際大学のギャップ・イヤー導入発表記者会見)
- **Listening 2 Part 2** (オープンキャンパスでの親の心配と学生の期待)
- **Reading 2 Part 1** (若いうちの旅行の是非・前半賛成論)
- **Reading 2 Part 2** (若いうちの旅行の是非・後半慎重論と筆者の結論)

### 2. あらゆる英語に音声付き（オンデマンドTTS再生）
- Web Speech API による高品質な英語ネイティブ発音の再生。
- **一文再生**: スクリプトや本文の一文をクリックして単体再生。
- **全文連続再生**: 現在読み上げられているセンテンスがリアルタイムにハイライト追従。
- **再生速度調整**: 0.75倍速、1.0倍速、1.25倍速、1.5倍速の切り替えに対応。
- 語彙リスト、設問文、選択肢、模範解答、重要表現のすべてにスピーカーアイコンを完備。

### 3. 一文録音＆発音評価スタジオ（AI発音スコアリング）
- Web Speech Recognition API による高精度なリアルタイム音声認識。
- 目標英文との**単語一致率 ＋ レーベンシュタイン距離**による0〜100点スコアリング。
- 単語単位のカラーフィードバック（一致＝緑、発音ズレ＝赤波線、未発話＝黄）。
- スコア評価バッジ（🌟 90点以上 Excellent / 👍 70〜89点 Good / 💪 69点以下 Keep Practicing）。

### 4. インタラクティブ演習＆即時答え合わせ
- **A. Dictation（書き取り）**: 空所入力、Enterキーでの移動、「答え合わせ」で瞬時に正誤ハイライト、「ヒント（頭文字）」表示、「全解答表示」、「リセット」。
- **B. Vocabulary Check（語彙）**: 品詞選択、意味確認、イディオム穴埋め＆音声確認、成句マッチング。
- **C. Outline（要点まとめ）**: フローチャートや表形式の要点穴埋め＆模範解答トグル。
- **D. Q & A / True or False**: 記述・選択問題、模範解答・解説・音声付き。
- **E. Structure & Phrases**: 構文の文法ポイント解説、和訳確認、コミュニケーション定型表現。

### 5. 学習進捗と記録の自動保存
- ブラウザの LocalStorage を利用し、入力したディクテーション解答や発音スコアを自動保存。
- ヘッダーに進捗状況（正答数、発音スコア平均）を常時表示。
- ダークモード / ライトモード対応。

---

## 🚀 使い方・起動方法

### ローカルでの起動
本アプリは純粋なHTML/CSS/JavaScriptで構築されており、外部サーバーやライブラリのインストール不要で動作します。

```bash
# クローン後、ディレクトリに移動
cd unit5-travel-english-learning-app

# 任意のブラウザで index.html を開く
open index.html  # Macの場合
```

または、VS Codeの「Live Server」拡張機能や Python のローカルサーバーでも実行可能です：
```bash
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

---

## 🛠 技術スタック
- **Frontend**: HTML5, Vanilla CSS3 (Custom Properties, Flexbox, CSS Grid, Responsive Design), Vanilla JavaScript (ES6+)
- **Audio & Speech**: Web Speech API (`SpeechSynthesis`, `SpeechSynthesisUtterance`, `SpeechRecognition` / `webkitSpeechRecognition`)
- **Data Persistence**: Web Storage API (`localStorage`)
