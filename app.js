// Antigravity Unit 5 Travel English Learning Engine
let currentPartIndex = 0;
let currentTab = 'text';
let speechRate = 1.0;
let isPlayingAll = false;
let currentSentencePlayingIndex = -1;
let currentRecognition = null;

// Progress & Storage
const STORAGE_KEY = 'unit5_english_app_progress';
let appState = {
  theme: 'light',
  dictationAnswers: {},
  scores: {},
  completedParts: {}
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = Object.assign({}, appState, parsed);
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
  updateStatsHeader();
}

// Speech Synthesis Setup
let englishVoice = null;
function initVoices() {
  if (!('speechSynthesis' in window)) return;
  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    englishVoice = voices.find(v => (v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.startsWith('en')) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen'))) 
      || voices.find(v => v.lang.startsWith('en')) 
      || null;
  };
  setVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = setVoice;
  }
}

function speakText(text, onEnd = null) {
  if (!('speechSynthesis' in window)) {
    showToast('お使いのブラウザは音声合成に対応していません');
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const clean = text.replace(/\([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚]\)/g, '')
                    .replace(/\(.*?\)/g, '')
                    .replace(/\/\//g, '')
                    .replace(/\//g, '');
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'en-US';
  utterance.rate = speechRate;
  if (englishVoice) utterance.voice = englishVoice;
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };
  window.speechSynthesis.speak(utterance);
}

function stopAllSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isPlayingAll = false;
  currentSentencePlayingIndex = -1;
  updatePlayAllBtnUI();
  document.querySelectorAll('.sentence-item').forEach(el => el.classList.remove('speaking'));
}

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  const w1 = s1.split(/\s+/);
  const w2 = s2.split(/\s+/);
  
  let matches = 0;
  w1.forEach(w => {
    if (w2.includes(w)) matches++;
  });
  const wordScore = (matches / Math.max(w1.length, w2.length)) * 100;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  const editDistance = track[s2.length][s1.length];
  const charScore = Math.max(0, (1 - editDistance / Math.max(s1.length, s2.length)) * 100);

  return Math.round(wordScore * 0.6 + charScore * 0.4);
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initVoices();
  applyTheme();
  renderPartNav();
  renderCurrentPart();
  updateStatsHeader();

  document.getElementById('theme-toggle').addEventListener('click', () => {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
  });

  document.getElementById('speed-select').addEventListener('change', (e) => {
    speechRate = parseFloat(e.target.value);
  });

  document.getElementById('btn-play-all').addEventListener('click', togglePlayAll);
  document.getElementById('btn-stop-all').addEventListener('click', stopAllSpeech);
});

function applyTheme() {
  document.documentElement.setAttribute('data-theme', appState.theme);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = appState.theme === 'dark' ? '☀️' : '🌙';
  }
}

function updateStatsHeader() {
  const answeredDicts = Object.keys(appState.dictationAnswers).length;
  const scoreKeys = Object.keys(appState.scores);
  let avgScore = 0;
  if (scoreKeys.length > 0) {
    const total = scoreKeys.reduce((acc, k) => acc + appState.scores[k], 0);
    avgScore = Math.round(total / scoreKeys.length);
  }
  const el = document.getElementById('header-stats');
  if (el) {
    el.innerHTML = `🎯 記録: 正答 ${answeredDicts}問 | 発音平均: ${avgScore > 0 ? avgScore + '点' : '--'}`;
  }
}

function renderPartNav() {
  const container = document.getElementById('part-nav-inner');
  container.innerHTML = '';
  UNIT5_DATA.parts.forEach((part, idx) => {
    const btn = document.createElement('button');
    btn.className = `part-chip ${idx === currentPartIndex ? 'active' : ''}`;
    const catClass = part.category === 'Listening' ? 'badge-listening' : 'badge-reading';
    btn.innerHTML = `<span class="badge-cat ${catClass}">${part.category}</span> ${part.title.replace('Part ', 'P')}`;
    btn.addEventListener('click', () => {
      stopAllSpeech();
      currentPartIndex = idx;
      renderPartNav();
      renderCurrentPart();
    });
    container.appendChild(btn);
  });
}

function renderCurrentPart() {
  const part = UNIT5_DATA.parts[currentPartIndex];
  
  document.getElementById('hero-title').textContent = part.title;
  document.getElementById('hero-topic').textContent = part.topic;
  document.getElementById('hero-pageref').textContent = part.pageRef;
  document.getElementById('hero-desc').textContent = part.description;
  
  const catBadge = document.getElementById('hero-cat-badge');
  catBadge.textContent = part.category;
  catBadge.className = `hero-badge ${part.category === 'Listening' ? 'badge-listening' : 'badge-reading'}`;

  renderTabsForPart(part);
  renderTabContent();
}

function renderTabsForPart(part) {
  const tabsContainer = document.getElementById('tab-container');
  tabsContainer.innerHTML = '';

  const tabs = [
    { id: 'text', label: part.category === 'Listening' ? '🎧 スクリプト & 音声' : '📖 本文 & 音声', icon: '🔊' }
  ];

  if (part.dictation) {
    tabs.push({ id: 'dictation', label: '✍️ A. ディクテーション', icon: '📝' });
  }
  if (part.vocabulary) {
    tabs.push({ id: 'vocab', label: '📚 B. 単語・語彙チェック', icon: '💡' });
  }
  if (part.outline) {
    tabs.push({ id: 'outline', label: '📊 C. アウトライン（要点）', icon: '🗺️' });
  }
  if (part.qa) {
    tabs.push({ id: 'qa', label: '❓ D. 設問 Q&A', icon: '💬' });
  }
  if (part.communication) {
    tabs.push({ id: 'communication', label: '🗣️ E. コミュニケーション表現', icon: '💬' });
  }
  if (part.structure) {
    tabs.push({ id: 'structure', label: '📐 E. 構文・構造解説', icon: '🧩' });
  }
  tabs.push({ id: 'pronounce', label: '🎙️ 一文録音＆発音スタジオ', icon: '🎯' });

  if (!tabs.find(t => t.id === currentTab)) {
    currentTab = 'text';
  }

  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${tab.id === currentTab ? 'active' : ''}`;
    btn.innerHTML = `<span>${tab.icon}</span> ${tab.label}`;
    btn.addEventListener('click', () => {
      stopAllSpeech();
      currentTab = tab.id;
      renderTabsForPart(part);
      renderTabContent();
    });
    tabsContainer.appendChild(btn);
  });
}

function renderTabContent() {
  const part = UNIT5_DATA.parts[currentPartIndex];
  const container = document.getElementById('tab-content');
  container.innerHTML = '';

  switch (currentTab) {
    case 'text':
      renderTextTab(part, container);
      break;
    case 'dictation':
      renderDictationTab(part, container);
      break;
    case 'vocab':
      renderVocabTab(part, container);
      break;
    case 'outline':
      renderOutlineTab(part, container);
      break;
    case 'qa':
      renderQATab(part, container);
      break;
    case 'communication':
      renderCommunicationTab(part, container);
      break;
    case 'structure':
      renderStructureTab(part, container);
      break;
    case 'pronounce':
      renderPronounceTab(part, container);
      break;
  }
}

function renderTextTab(part, container) {
  const card = document.createElement('div');
  card.className = 'section-card';
  
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>${part.category === 'Listening' ? '🎧 会話スクリプト' : '📖 英文テキスト'}</span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-action" onclick="speakCurrentFullText()">
          <span>▶</span> 全文連続再生
        </button>
      </div>
    </div>
  `;

  const list = document.createElement('div');
  list.className = 'sentence-list';

  part.sentences.forEach((s, idx) => {
    const item = document.createElement('div');
    item.className = 'sentence-item';
    item.id = `sentence-item-${idx}`;

    item.innerHTML = `
      <div class="sentence-header">
        <span class="sentence-tag">${s.speaker ? s.speaker : s.tag ? s.tag : ('#' + (idx + 1))}</span>
        <div class="sentence-actions">
          <button class="btn-action" onclick="playSingleSentence(${JSON.stringify(s.en)}, ${idx})">
            <span>🔊</span> 再生
          </button>
          <button class="btn-action" onclick="startRecordingForSentence(${JSON.stringify(s.id)}, ${JSON.stringify(s.en)})">
            <span>🎙️</span> 発音採点
          </button>
        </div>
      </div>
      <div class="sentence-en">${s.en}</div>
      <div class="sentence-ja">${s.ja}</div>
      <div id="record-result-${s.id}"></div>
    `;
    list.appendChild(item);
  });

  card.appendChild(list);
  container.appendChild(card);
}

window.playSingleSentence = function(text, idx = -1) {
  stopAllSpeech();
  if (idx >= 0) {
    const el = document.getElementById(`sentence-item-${idx}`);
    if (el) el.classList.add('speaking');
  }
  speakText(text, () => {
    if (idx >= 0) {
      const el = document.getElementById(`sentence-item-${idx}`);
      if (el) el.classList.remove('speaking');
    }
  });
};

window.speakCurrentFullText = function() {
  const part = UNIT5_DATA.parts[currentPartIndex];
  if (!part.sentences || part.sentences.length === 0) return;
  
  stopAllSpeech();
  isPlayingAll = true;
  currentSentencePlayingIndex = 0;
  updatePlayAllBtnUI();
  playNextSequence();
};

function togglePlayAll() {
  if (isPlayingAll) {
    stopAllSpeech();
  } else {
    window.speakCurrentFullText();
  }
}

function updatePlayAllBtnUI() {
  const btn = document.getElementById('btn-play-all');
  if (!btn) return;
  if (isPlayingAll) {
    btn.innerHTML = '<span>⏸</span> 一時停止';
    btn.classList.add('btn-primary');
  } else {
    btn.innerHTML = '<span>▶</span> 全文再生';
    btn.classList.remove('btn-primary');
  }
}

function playNextSequence() {
  const part = UNIT5_DATA.parts[currentPartIndex];
  if (!isPlayingAll || currentSentencePlayingIndex >= part.sentences.length) {
    stopAllSpeech();
    return;
  }

  const s = part.sentences[currentSentencePlayingIndex];
  document.querySelectorAll('.sentence-item').forEach(el => el.classList.remove('speaking'));
  const el = document.getElementById(`sentence-item-${currentSentencePlayingIndex}`);
  if (el) {
    el.classList.add('speaking');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  speakText(s.en, () => {
    if (!isPlayingAll) return;
    currentSentencePlayingIndex++;
    setTimeout(playNextSequence, 400);
  });
}

function renderDictationTab(part, container) {
  if (!part.dictation) return;

  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>✍️ A. Dictation（書き取り演習）</span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-action" onclick="speakCurrentFullText()">
          <span>🔊</span> 音声を聞く
        </button>
      </div>
    </div>
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">${part.dictation.instructions}</p>
    <div id="dictation-interactive-board" class="dictation-board"></div>
    <div class="dict-controls">
      <button class="btn-primary" onclick="checkDictationAnswers('${part.id}')">
        <span>✓</span> 答え合わせをする
      </button>
      <button class="btn-secondary" onclick="toggleDictationHints('${part.id}')">
        <span>💡</span> ヒント（頭文字）を表示
      </button>
      <button class="btn-secondary" onclick="showAllDictationAnswers('${part.id}')">
        <span>👀</span> すべての正解を表示
      </button>
      <button class="btn-secondary" onclick="resetDictation('${part.id}')">
        <span>🔄</span> リセット
      </button>
      <div id="dict-score-display" style="font-weight: 700; margin-left: auto;"></div>
    </div>
  `;
  container.appendChild(card);

  const board = card.querySelector('#dictation-interactive-board');
  let rawText = part.dictation.fullTextWithBlanks;
  
  const circNums = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳','㉑','㉒','㉓','㉔','㉕','㉖','㉗','㉘','㉙','㉚'];
  
  part.dictation.blanks.forEach(b => {
    const circNum = circNums[b.num - 1] || `(${b.num})`;
    const savedVal = appState.dictationAnswers[`${part.id}_${b.num}`] || '';
    const inputHtml = `<span style="display: inline-flex; align-items: center;"><span class="dict-badge-num">${circNum}</span><input type="text" class="dict-input" id="dict-input-${part.id}-${b.num}" data-part="${part.id}" data-num="${b.num}" data-answer="${b.answer}" data-hint="${b.hint}" value="${savedVal}" placeholder="..."></span>`;
    rawText = rawText.replace(circNum, inputHtml);
  });

  board.innerHTML = rawText.replace(/\n/g, '<br>');

  const inputs = board.querySelectorAll('.dict-input');
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const pId = e.target.getAttribute('data-part');
      const num = e.target.getAttribute('data-num');
      appState.dictationAnswers[`${pId}_${num}`] = e.target.value.trim();
      saveState();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (inputs[index + 1]) inputs[index + 1].focus();
      }
    });
  });
}

window.checkDictationAnswers = function(partId) {
  const part = UNIT5_DATA.parts.find(p => p.id === partId);
  if (!part || !part.dictation) return;

  let correctCount = 0;
  part.dictation.blanks.forEach(b => {
    const input = document.getElementById(`dict-input-${partId}-${b.num}`);
    if (!input) return;
    const userVal = input.value.trim().toLowerCase().replace(/[’']/g, "'");
    const targetVal = b.answer.toLowerCase().replace(/[’']/g, "'");
    if (userVal === targetVal) {
      input.classList.remove('incorrect');
      input.classList.add('correct');
      correctCount++;
    } else {
      input.classList.remove('correct');
      input.classList.add('incorrect');
    }
  });

  const total = part.dictation.blanks.length;
  const scoreDisplay = document.getElementById('dict-score-display');
  if (scoreDisplay) {
    scoreDisplay.innerHTML = `<span style="color: ${correctCount === total ? 'var(--success)' : 'var(--primary)'}">結果: ${correctCount} / ${total} 正解 (${Math.round((correctCount/total)*100)}%)</span>`;
  }
  if (correctCount === total) {
    showToast('🎉 全問正解です！おめでとうございます！');
  } else {
    showToast(`${correctCount}問正解！ 赤い枠の単語を見直してみましょう。`);
  }
};

window.toggleDictationHints = function(partId) {
  const part = UNIT5_DATA.parts.find(p => p.id === partId);
  if (!part || !part.dictation) return;
  part.dictation.blanks.forEach(b => {
    const input = document.getElementById(`dict-input-${partId}-${b.num}`);
    if (input && !input.value) {
      input.placeholder = b.hint;
    }
  });
  showToast('💡 未入力の箇所に頭文字のヒントを表示しました');
};

window.showAllDictationAnswers = function(partId) {
  const part = UNIT5_DATA.parts.find(p => p.id === partId);
  if (!part || !part.dictation) return;
  part.dictation.blanks.forEach(b => {
    const input = document.getElementById(`dict-input-${partId}-${b.num}`);
    if (input) {
      input.value = b.answer;
      input.classList.remove('incorrect');
      input.classList.add('correct');
    }
  });
  showToast('すべての正解を表示しました');
};

window.resetDictation = function(partId) {
  const part = UNIT5_DATA.parts.find(p => p.id === partId);
  if (!part || !part.dictation) return;
  part.dictation.blanks.forEach(b => {
    const input = document.getElementById(`dict-input-${partId}-${b.num}`);
    if (input) {
      input.value = '';
      input.placeholder = '...';
      input.classList.remove('correct', 'incorrect');
      delete appState.dictationAnswers[`${partId}_${b.num}`];
    }
  });
  saveState();
  const scoreDisplay = document.getElementById('dict-score-display');
  if (scoreDisplay) scoreDisplay.innerHTML = '';
  showToast('リセットしました');
};

function renderVocabTab(part, container) {
  if (!part.vocabulary) return;

  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>📚 B. Vocabulary Check（語彙確認）</span>
      </div>
    </div>
  `;

  if (part.vocabulary.part1) {
    const subTitle = document.createElement('h3');
    subTitle.style.cssText = 'font-size: 1rem; margin-bottom: 0.75rem; color: var(--text-main);';
    subTitle.textContent = '(1) 単語の品詞と意味の確認';
    card.appendChild(subTitle);

    const grid = document.createElement('div');
    grid.className = 'exercise-grid';

    part.vocabulary.part1.forEach(v => {
      const item = document.createElement('div');
      item.className = 'exercise-item';
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 700; font-size: 1.05rem; color: var(--primary);">${v.num}. ${v.word}</span>
          <button class="btn-action" onclick="speakText(${JSON.stringify(v.word)})">
            <span>🔊</span>
          </button>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span class="hero-badge" style="background: var(--border);">${v.pos}</span>
          <span style="font-size: 0.95rem; font-weight: 500;">${v.meaning}</span>
        </div>
      `;
      grid.appendChild(item);
    });
    card.appendChild(grid);
  }

  if (part.vocabulary.part2) {
    const subTitle2 = document.createElement('h3');
    subTitle2.style.cssText = 'font-size: 1rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--text-main);';
    subTitle2.textContent = '(2) 日本文の意味になるように適語を補う問題';
    card.appendChild(subTitle2);

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '0.75rem';

    part.vocabulary.part2.forEach(p2 => {
      const item = document.createElement('div');
      item.className = 'exercise-item';
      item.innerHTML = `
        <div class="exercise-question">${p2.num}. ${p2.ja}</div>
        <div style="font-family: var(--font-mono); font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.5rem;">
          ${p2.enPattern}
        </div>
        <button class="btn-action" onclick="toggleAnswer('vocab-p2-${currentPartIndex}-${p2.num}')">
          <span>👀</span> 解答・音声を確認
        </button>
        <div id="vocab-p2-${currentPartIndex}-${p2.num}" class="answer-toggle-box" style="display: none;">
          <div class="answer-text">正解: ${p2.words.join(', ')}</div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
            <span>${p2.fullEn}</span>
            <button class="btn-action" onclick="speakText(${JSON.stringify(p2.fullEn)})">
              <span>🔊</span>
            </button>
          </div>
        </div>
      `;
      list.appendChild(item);
    });
    card.appendChild(list);
  }

  if (part.vocabulary.part2Matching) {
    const m = part.vocabulary.part2Matching;
    const subTitle3 = document.createElement('h3');
    subTitle3.style.cssText = 'font-size: 1rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--text-main);';
    subTitle3.textContent = '(2) 語句の意味のマッチング問題';
    card.appendChild(subTitle3);

    const optBox = document.createElement('div');
    optBox.style.cssText = 'background: var(--bg-main); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem;';
    m.options.forEach(o => {
      optBox.innerHTML += `<span><strong>${o.key}.</strong> ${o.label}</span>`;
    });
    card.appendChild(optBox);

    const qGrid = document.createElement('div');
    qGrid.className = 'exercise-grid';
    m.questions.forEach(q => {
      const item = document.createElement('div');
      item.className = 'exercise-item';
      item.innerHTML = `
        <div class="exercise-question">${q.num}. ${q.phrase}</div>
        <button class="btn-action" onclick="toggleAnswer('vocab-match-${q.num}')">
          <span>👀</span> 答えを表示
        </button>
        <div id="vocab-match-${q.num}" class="answer-toggle-box" style="display: none;">
          <div class="answer-text">正解: ${q.answer} (${m.options.find(o=>o.key === q.answer)?.label || ''})</div>
        </div>
      `;
      qGrid.appendChild(item);
    });
    card.appendChild(qGrid);
  }

  container.appendChild(card);
}

function renderOutlineTab(part, container) {
  if (!part.outline) return;
  const card = document.createElement('div');
  card.className = 'section-card';
  
  let itemsHtml = '';
  part.outline.items.forEach(item => {
    itemsHtml += `
      <div class="exercise-item">
        <div class="exercise-question">${item.label}</div>
        <button class="btn-action" onclick="toggleAnswer('outline-${currentPartIndex}-${item.num}')">
          <span>👀</span> 正解を確認
        </button>
        <div id="outline-${currentPartIndex}-${item.num}" class="answer-toggle-box" style="display: none;">
          <div class="answer-text">正解: ${item.answer}</div>
          ${item.note ? `<div class="answer-exp">${item.note}</div>` : ''}
        </div>
      </div>
    `;
  });

  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>📊 C. Outline（要点・構成のまとめ）</span>
      </div>
    </div>
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">${part.outline.instructions}</p>
    <div class="exercise-grid">${itemsHtml}</div>
  `;
  container.appendChild(card);
}

function renderQATab(part, container) {
  if (!part.qa) return;
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>❓ D. Q & A（内容理解の問い）</span>
      </div>
    </div>
  `;

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '1rem';

  part.qa.forEach(qa => {
    const item = document.createElement('div');
    item.className = 'exercise-item';
    
    let optHtml = '';
    if (qa.options) {
      optHtml = `<div style="margin: 0.5rem 0; display: flex; flex-direction: column; gap: 0.25rem;">` +
        qa.options.map(o => `<div style="font-size: 0.9rem;"><strong>${o.key}.</strong> ${o.text}</div>`).join('') +
        `</div>`;
    }

    item.innerHTML = `
      <div class="exercise-question" style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span>${qa.num ? qa.num + '. ' : ''}${qa.q}</span>
        <button class="btn-action" onclick="speakText(${JSON.stringify(qa.q)})">
          <span>🔊</span>
        </button>
      </div>
      ${optHtml}
      <div style="margin-top: 0.5rem;">
        <button class="btn-action" onclick="toggleAnswer('qa-${currentPartIndex}-${qa.num}')">
          <span>👀</span> 解答・解説を確認
        </button>
      </div>
      <div id="qa-${currentPartIndex}-${qa.num}" class="answer-toggle-box" style="display: none;">
        <div class="answer-text" style="display: flex; align-items: center; gap: 0.5rem;">
          <span>正解: ${qa.a}</span>
          <button class="btn-action" onclick="speakText(${JSON.stringify(qa.a)})">
            <span>🔊</span>
          </button>
        </div>
        <div class="answer-exp">${qa.explanation || ''}</div>
      </div>
    `;
    list.appendChild(item);
  });

  card.appendChild(list);
  container.appendChild(card);
}

function renderCommunicationTab(part, container) {
  if (!part.communication) return;
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>🗣️ E. Phrases for Communication（コミュニケーション表現）</span>
      </div>
    </div>
  `;

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '1rem';

  part.communication.forEach(c => {
    const item = document.createElement('div');
    item.className = 'exercise-item';
    item.innerHTML = `
      <div class="exercise-question">【場面 ${c.num}】 ${c.situation}</div>
      ${c.pattern ? `<div style="font-family: var(--font-mono); font-size: 0.9rem; margin-bottom: 0.5rem;">${c.pattern}</div>` : ''}
      <button class="btn-action" onclick="toggleAnswer('comm-${currentPartIndex}-${c.num}')">
        <span>👀</span> 表現例・音声を確認
      </button>
      <div id="comm-${currentPartIndex}-${c.num}" class="answer-toggle-box" style="display: none;">
        <div class="answer-text" style="display: flex; align-items: center; gap: 0.5rem;">
          <span>表現例: ${c.example}</span>
          <button class="btn-action" onclick="speakText(${JSON.stringify(c.example)})">
            <span>🔊</span>
          </button>
        </div>
        ${c.explanation ? `<div class="answer-exp">${c.explanation}</div>` : ''}
      </div>
    `;
    list.appendChild(item);
  });

  card.appendChild(list);
  container.appendChild(card);
}

function renderStructureTab(part, container) {
  if (!part.structure) return;
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>📐 E. Structure & Translation（構文解説と和訳）</span>
      </div>
    </div>
  `;

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '1.25rem';

  part.structure.forEach(st => {
    const item = document.createElement('div');
    item.className = 'exercise-item';
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
        <div style="font-weight: 700; font-size: 1.05rem; color: var(--primary);">${st.num}. ${st.sentenceEn}</div>
        <button class="btn-action" onclick="speakText(${JSON.stringify(st.sentenceEn)})">
          <span>🔊</span>
        </button>
      </div>
      <div style="background: var(--bg-main); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.9rem; margin-bottom: 0.75rem; border-left: 3px solid var(--accent);">
        <strong>構文ポイント:</strong> ${st.grammarPoint}
      </div>
      <button class="btn-action" onclick="toggleAnswer('struct-${currentPartIndex}-${st.num}')">
        <span>👀</span> 模範和訳を表示
      </button>
      <div id="struct-${currentPartIndex}-${st.num}" class="answer-toggle-box" style="display: none;">
        <div class="answer-text" style="color: var(--text-main); font-weight: 500;">
          <strong>模範訳:</strong> ${st.translationJa}
        </div>
      </div>
    `;
    list.appendChild(item);
  });

  card.appendChild(list);
  container.appendChild(card);
}

function renderPronounceTab(part, container) {
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>🎙️ 一文録音＆発音評価スタジオ</span>
      </div>
    </div>
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
      各文の「録音＆評価」ボタンを押してマイクに向かって発音してください。発音の正確さをAIが自動採点し、単語ごとのフィードバックを表示します。
    </p>
  `;

  const list = document.createElement('div');
  list.className = 'sentence-list';

  part.sentences.forEach((s, idx) => {
    const item = document.createElement('div');
    item.className = 'sentence-item';
    item.id = `pronounce-item-${s.id}`;

    const lastScore = appState.scores[s.id];
    let badgeHtml = '';
    if (lastScore !== undefined) {
      const cls = lastScore >= 90 ? 'score-high' : lastScore >= 70 ? 'score-mid' : 'score-low';
      badgeHtml = `<span class="score-badge ${cls}">スコア: ${lastScore}点</span>`;
    }

    item.innerHTML = `
      <div class="sentence-header">
        <span class="sentence-tag">${s.speaker ? s.speaker : s.tag ? s.tag : ('#' + (idx + 1))}</span>
        <div class="sentence-actions">
          <button class="btn-action" onclick="playSingleSentence(${JSON.stringify(s.en)})">
            <span>🔊</span> お手本音声
          </button>
          <button class="btn-action" id="btn-rec-${s.id}" onclick="startRecordingForSentence(${JSON.stringify(s.id)}, ${JSON.stringify(s.en)})">
            <span>🎙️</span> 録音＆評価
          </button>
        </div>
      </div>
      <div class="sentence-en">${s.en}</div>
      <div class="sentence-ja">${s.ja}</div>
      <div id="record-result-${s.id}" class="pronounce-feedback" style="${lastScore !== undefined ? '' : 'display: none;'}">
        ${badgeHtml}
      </div>
    `;
    list.appendChild(item);
  });

  card.appendChild(list);
  container.appendChild(card);
}

window.toggleAnswer = function(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.startRecordingForSentence = function(sentenceId, targetText) {
  const btn = document.getElementById(`btn-rec-${sentenceId}`);
  const resultBox = document.getElementById(`record-result-${sentenceId}`);
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('お使いのブラウザは音声認識APIに対応していません。Google ChromeやEdgeなどでお試しください。');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (currentRecognition) {
    currentRecognition.abort();
    currentRecognition = null;
  }

  const recognition = new SpeechRecognition();
  currentRecognition = recognition;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  if (btn) {
    btn.classList.add('recording');
    btn.innerHTML = '<span>🔴</span> 発音を聞き取り中...';
  }
  if (resultBox) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="color: var(--primary); font-size: 0.9rem;">🎙️ マイクに向かって話してください...</div>';
  }

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    const score = calculateSimilarity(spokenText, targetText);

    appState.scores[sentenceId] = score;
    saveState();

    const targetWords = targetText.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
    const spokenWords = spokenText.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().split(/\s+/);

    let wordFeedbackHtml = '';
    targetWords.forEach(w => {
      const cleanW = w.toLowerCase();
      if (spokenWords.includes(cleanW)) {
        wordFeedbackHtml += `<span class="word-match">${w}</span> `;
      } else {
        wordFeedbackHtml += `<span class="word-mismatch" title="発音が認識されませんでした">${w}</span> `;
      }
    });

    const scoreClass = score >= 90 ? 'score-high' : score >= 70 ? 'score-mid' : 'score-low';
    const scoreMsg = score >= 90 ? '🌟 Excellent! 完璧な発音です！' : score >= 70 ? '👍 Good Job! 伝わっています！' : '💪 Keep Practicing! もう一度言ってみましょう！';

    if (resultBox) {
      resultBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <span class="score-badge ${scoreClass}">スコア: ${score}点</span>
          <span style="font-size: 0.85rem; font-weight: 600;">${scoreMsg}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">認識された音声:</div>
        <div class="speech-transcript">"${spokenText}"</div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">単語ごとの正誤判定:</div>
        <div style="margin-top: 0.2rem;">${wordFeedbackHtml}</div>
      `;
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (resultBox) {
      resultBox.innerHTML = `<div style="color: var(--danger); font-size: 0.85rem;">⚠️ 音声を認識できませんでした (${event.error})。マイクへのアクセスを許可しているか確認してください。</div>`;
    }
  };

  recognition.onend = () => {
    if (btn) {
      btn.classList.remove('recording');
      btn.innerHTML = '<span>🎙️</span> 録音＆評価';
    }
    currentRecognition = null;
  };

  try {
    recognition.start();
  } catch (err) {
    console.error(err);
    if (btn) {
      btn.classList.remove('recording');
      btn.innerHTML = '<span>🎙️</span> 録音＆評価';
    }
  }
};
