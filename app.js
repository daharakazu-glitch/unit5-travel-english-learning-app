// Antigravity Unit 5 Listening 2 Part 1 & Part 2 Specialized Learning Engine
let currentPartIndex = 0;
let currentTab = 'dictation'; // Default to dictation
let speechRate = 1.0;
let currentAudio = null;
let currentRecognition = null;
let dictationViewMode = 'exercise'; // 'exercise' or 'paragraph'

// Progress & Storage
const STORAGE_KEY = 'unit5_l2_progress';
let appState = {
  theme: 'light',
  dictationAnswers: {},
  scores: {}
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appState = Object.assign({}, appState, JSON.parse(saved));
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

// Audio Engine: Native Neural Audio (MP3) priority with Web Speech API fallback
function playAudioFile(src, onEnd = null) {
  stopAllAudio();
  if (!src) {
    if (onEnd) onEnd();
    return;
  }

  const audio = new Audio(src);
  currentAudio = audio;
  audio.playbackRate = speechRate;
  
  audio.onended = () => {
    currentAudio = null;
    updatePlayAllBtnUI(false);
    document.querySelectorAll('.reader-sentence, .sentence-item').forEach(el => el.classList.remove('active-speaking', 'speaking'));
    if (onEnd) onEnd();
  };

  audio.onerror = () => {
    console.warn('Audio play error, falling back to synthesis:', src);
    currentAudio = null;
    updatePlayAllBtnUI(false);
    if (onEnd) onEnd();
  };

  audio.play().catch(err => {
    console.warn('Audio playback error:', err);
    currentAudio = null;
    updatePlayAllBtnUI(false);
    if (onEnd) onEnd();
  });
  updatePlayAllBtnUI(true);
}

function stopAllAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  updatePlayAllBtnUI(false);
  document.querySelectorAll('.reader-sentence, .sentence-item').forEach(el => el.classList.remove('active-speaking', 'speaking'));
}

function speakFallback(text, onEnd = null) {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = speechRate;
  utterance.onend = () => { if (onEnd) onEnd(); };
  utterance.onerror = () => { if (onEnd) onEnd(); };
  window.speechSynthesis.speak(utterance);
}

function updatePlayAllBtnUI(isPlaying) {
  const btn = document.getElementById('btn-play-all');
  if (!btn) return;
  if (isPlaying) {
    btn.innerHTML = '<span>⏸</span> 一時停止';
    btn.classList.add('btn-primary');
  } else {
    btn.innerHTML = '<span>▶</span> 全文ネイティブ音声再生';
    btn.classList.remove('btn-primary');
  }
}

// Similarity Scoring
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  const w1 = s1.split(/\s+/);
  const w2 = s2.split(/\s+/);
  let matches = 0;
  w1.forEach(w => { if (w2.includes(w)) matches++; });
  const wordScore = (matches / Math.max(w1.length, w2.length)) * 100;

  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
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
  setTimeout(() => { toast.classList.remove('show'); }, 2800);
}

// Lifecycle
document.addEventListener('DOMContentLoaded', () => {
  loadState();
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
    if (currentAudio) currentAudio.playbackRate = speechRate;
  });

  document.getElementById('btn-play-all').addEventListener('click', () => {
    const part = UNIT5_DATA.parts[currentPartIndex];
    if (currentAudio) {
      stopAllAudio();
    } else {
      playAudioFile(part.audioFull);
    }
  });

  document.getElementById('btn-stop-all').addEventListener('click', stopAllAudio);
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
    el.innerHTML = `🎯 正答: ${answeredDicts}問 | 発音平均: ${avgScore > 0 ? avgScore + '点' : '--'}`;
  }
}

// Part Navigation (Listening 2 Part 1 & Part 2)
function renderPartNav() {
  const container = document.getElementById('part-nav-inner');
  container.innerHTML = '';
  UNIT5_DATA.parts.forEach((part, idx) => {
    const btn = document.createElement('button');
    btn.className = `part-chip ${idx === currentPartIndex ? 'active' : ''}`;
    btn.innerHTML = `<span class="badge-cat">Listening 2</span> ${part.title.replace('Listening 2 ', '')}`;
    btn.addEventListener('click', () => {
      stopAllAudio();
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

  renderTabsForPart(part);
  renderTabContent();
}

function renderTabsForPart(part) {
  const tabsContainer = document.getElementById('tab-container');
  tabsContainer.innerHTML = '';

  const tabs = [
    { id: 'dictation', label: '✍️ A. ディクテーション（パラグラフ形式）', icon: '📝' },
    { id: 'vocab', label: '📚 B. 単語・語彙チェック', icon: '💡' },
    { id: 'outline', label: '📊 C. アウトライン（要点）', icon: '🗺️' },
    { id: 'qa', label: '❓ D. 設問 Q&A', icon: '💬' },
    { id: 'communication', label: '🗣️ E. コミュニケーション表現', icon: '💬' },
    { id: 'pronounce', label: '🎙️ 一文録音＆発音評価スタジオ', icon: '🎯' }
  ];

  if (!tabs.find(t => t.id === currentTab)) {
    currentTab = 'dictation';
  }

  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${tab.id === currentTab ? 'active' : ''}`;
    btn.innerHTML = `<span>${tab.icon}</span> ${tab.label}`;
    btn.addEventListener('click', () => {
      stopAllAudio();
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
    case 'pronounce':
      renderPronounceTab(part, container);
      break;
  }
}

// 1. Natural Paragraph Dictation Tab (PDF Style)
function renderDictationTab(part, container) {
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'section-card';

  card.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">
          <span>✍️ A. Dictation（自然なパラグラフ形式・PDF準拠）</span>
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
          ${part.dictation.instructions}
        </p>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn-action ${dictationViewMode === 'exercise' ? 'active' : ''}" onclick="setDictationMode('exercise')">
          <span>✏️</span> 空所穴埋めモード
        </button>
        <button class="btn-action ${dictationViewMode === 'paragraph' ? 'active' : ''}" onclick="setDictationMode('paragraph')">
          <span>📖</span> 全文正解パラグラフ（ハイライト表示）
        </button>
      </div>
    </div>
  `;

  if (dictationViewMode === 'exercise') {
    // 1-A: Exercise Mode (Natural Paragraph with Inlined Blanks)
    const paraContainer = document.createElement('div');
    paraContainer.className = 'pdf-paragraph-container';

    part.paragraphs.forEach((para) => {
      const block = document.createElement('div');
      block.className = 'pdf-paragraph-block';

      if (para.heading) {
        block.innerHTML += `<div class="pdf-header-title">${para.heading}</div>`;
      }

      const speakerLabel = `<span class="speaker-label">${para.speaker}:</span><span class="speaker-role-tag">${para.speakerRole}</span>`;
      
      let htmlText = para.textWithBlanks || '';
      const circNums = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳','㉑','㉒','㉓','㉔','㉕','㉖','㉗','㉘','㉙','㉚'];
      
      part.dictation.blanks.forEach(b => {
        const circNum = circNums[b.num - 1] || `(${b.num})`;
        const savedVal = appState.dictationAnswers[`${part.id}_${b.num}`] || '';
        const inputHtml = `<span class="dict-inline-span"><span class="dict-badge-num">${circNum}</span><input type="text" class="dict-input" id="dict-input-${part.id}-${b.num}" data-part="${part.id}" data-num="${b.num}" data-answer="${b.answer}" data-hint="${b.hint}" value="${savedVal}" placeholder="..." autocomplete="off" autocapitalize="off"></span>`;
        
        // Match both "(① )" and "(①)"
        const patternWithSpace = `(${circNum} )`;
        const patternNoSpace = `(${circNum})`;
        if (htmlText.includes(patternWithSpace)) {
          htmlText = htmlText.split(patternWithSpace).join(inputHtml);
        } else if (htmlText.includes(patternNoSpace)) {
          htmlText = htmlText.split(patternNoSpace).join(inputHtml);
        }
      });

      block.innerHTML += speakerLabel + htmlText;
      paraContainer.appendChild(block);
    });

    card.appendChild(paraContainer);

    // Control Buttons
    const ctrlBar = document.createElement('div');
    ctrlBar.className = 'dict-controls';
    ctrlBar.style.display = 'flex';
    ctrlBar.style.flexWrap = 'wrap';
    ctrlBar.style.gap = '0.75rem';
    ctrlBar.style.alignItems = 'center';
    ctrlBar.innerHTML = `
      <button class="btn-primary" onclick="checkDictationAnswers('${part.id}')">
        <span>✓</span> 答え合わせをする
      </button>
      <button class="btn-secondary" onclick="toggleDictationHints('${part.id}')">
        <span>💡</span> ヒント（頭文字）を表示
      </button>
      <button class="btn-secondary" onclick="showAllDictationAnswers('${part.id}')">
        <span>👀</span> 全ての正解を入力
      </button>
      <button class="btn-secondary" onclick="resetDictation('${part.id}')">
        <span>🔄</span> リセット
      </button>
      <button class="btn-action" onclick="setDictationMode('paragraph')">
        <span>📖</span> 全文をパラグラフで確認
      </button>
      <div id="dict-score-display" style="font-weight: 700; margin-left: auto;"></div>
    `;
    card.appendChild(ctrlBar);

    // Keyboard enter navigation & auto save
    setTimeout(() => {
      const inputs = card.querySelectorAll('.dict-input');
      inputs.forEach((inp, idx) => {
        inp.addEventListener('input', (e) => {
          const pId = e.target.getAttribute('data-part');
          const num = e.target.getAttribute('data-num');
          appState.dictationAnswers[`${pId}_${num}`] = e.target.value.trim();
          saveState();
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (inputs[idx + 1]) inputs[idx + 1].focus();
          }
        });
      });
    }, 50);

  } else {
    // 1-B: Full Natural Paragraph Reader Mode (PDF Answers highlighted inline)
    const readerContainer = document.createElement('div');
    readerContainer.className = 'full-paragraph-reader';

    part.paragraphs.forEach((para) => {
      const block = document.createElement('div');
      block.className = 'pdf-paragraph-block';

      if (para.heading) {
        block.innerHTML += `<div class="pdf-header-title">${para.heading}</div>`;
      }

      const speakerLabel = `<span class="speaker-label">${para.speaker}:</span><span class="speaker-role-tag">${para.speakerRole}</span>`;
      
      let highlightedText = para.fullText || '';
      part.dictation.blanks.forEach(b => {
        const regex = new RegExp(`\\b(${b.answer})\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, `<span class="highlight-answer">$1</span>`);
      });

      block.innerHTML += speakerLabel + `<span style="line-height: 2.1;">${highlightedText}</span>`;
      
      if (para.translationJa) {
        block.innerHTML += `<div class="paragraph-translation"><strong>【日本語訳】</strong> ${para.translationJa}</div>`;
      }

      readerContainer.appendChild(block);
    });

    card.appendChild(readerContainer);

    const backBar = document.createElement('div');
    backBar.style.display = 'flex';
    backBar.style.gap = '0.75rem';
    backBar.innerHTML = `
      <button class="btn-primary" onclick="playAudioFile('${part.audioFull}')">
        <span>▶</span> このパートのネイティブ音声を聴く
      </button>
      <button class="btn-secondary" onclick="setDictationMode('exercise')">
        <span>✏️</span> 空所穴埋めモードに戻る
      </button>
    `;
    card.appendChild(backBar);
  }

  container.appendChild(card);
}

window.setDictationMode = function(mode) {
  dictationViewMode = mode;
  renderTabContent();
};

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
    showToast('🎉 全問正解です！完璧に聞き取れました！');
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
      appState.dictationAnswers[`${partId}_${b.num}`] = b.answer;
    }
  });
  saveState();
  showToast('すべての正解を入力しました');
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
  showToast('入力内容をリセットしました');
};

// 2. Vocabulary Tab
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
    const grid = document.createElement('div');
    grid.className = 'exercise-grid';

    part.vocabulary.part1.forEach(v => {
      const item = document.createElement('div');
      item.className = 'exercise-item';
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 700; font-size: 1.05rem; color: var(--primary);">${v.num}. ${v.word}</span>
          <button class="btn-action" onclick="speakFallback('${v.word.replace(/'/g, "\\'")}')">
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

  container.appendChild(card);
}

// 3. Outline Tab
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

// 4. Q&A Tab
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

    item.innerHTML = `
      <div class="exercise-question" style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span>${qa.num ? qa.num + '. ' : ''}${qa.q}</span>
        <button class="btn-action" onclick="speakFallback('${qa.q.replace(/'/g, "\\'")}')">
          <span>🔊</span>
        </button>
      </div>
      <div style="margin-top: 0.5rem;">
        <button class="btn-action" onclick="toggleAnswer('qa-${currentPartIndex}-${qa.num}')">
          <span>👀</span> 解答・解説を確認
        </button>
      </div>
      <div id="qa-${currentPartIndex}-${qa.num}" class="answer-toggle-box" style="display: none;">
        <div class="answer-text" style="display: flex; align-items: center; gap: 0.5rem;">
          <span>正解: ${qa.a}</span>
          <button class="btn-action" onclick="speakFallback('${qa.a.replace(/'/g, "\\'")}')">
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

// 5. Communication Tab
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
          <button class="btn-action" onclick="speakFallback('${c.example.replace(/'/g, "\\'")}')">
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

// 6. Pronunciation Studio Tab (Sentence-by-Sentence with Native Neural Audio)
function renderPronounceTab(part, container) {
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>🎙️ 一文録音＆発音評価スタジオ</span>
      </div>
    </div>
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
      プロのネイティブ音声をお手本に聞きながら、マイクに向かって発音してください。発音の正確さをAIが自動採点し、単語ごとのフィードバックを表示します。
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
        <span class="sentence-tag">${s.speaker}</span>
        <div class="sentence-actions">
          <button class="btn-action" onclick="playSentenceNativeAudio('${s.audio}', '${s.id}')">
            <span>🔊</span> お手本ネイティブ音声
          </button>
          <button class="btn-action" id="btn-rec-${s.id}" onclick="startRecordingForSentence('${s.id}', '${s.en.replace(/'/g, "\\'")}')">
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

window.playSentenceNativeAudio = function(audioSrc, sentenceId) {
  document.querySelectorAll('.sentence-item').forEach(el => el.classList.remove('speaking'));
  const el = document.getElementById(`pronounce-item-${sentenceId}`);
  if (el) el.classList.add('speaking');

  playAudioFile(audioSrc, () => {
    if (el) el.classList.remove('speaking');
  });
};

window.toggleAnswer = function(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

// Recording & Speech Recognition
window.startRecordingForSentence = function(sentenceId, targetText) {
  const btn = document.getElementById(`btn-rec-${sentenceId}`);
  const resultBox = document.getElementById(`record-result-${sentenceId}`);
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('お使いのブラウザは音声認識APIに対応していません。Google Chrome等でお試しください。');
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
    btn.innerHTML = '<span>🔴</span> 聞き取り中...';
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
        wordFeedbackHtml += `<span class="word-mismatch" title="発音が不一致でした">${w}</span> `;
      }
    });

    const scoreClass = score >= 90 ? 'score-high' : score >= 70 ? 'score-mid' : 'score-low';
    const scoreMsg = score >= 90 ? '🌟 Excellent! 完璧な発音です！' : score >= 70 ? '👍 Good Job! よく伝わっています！' : '💪 Keep Practicing! もう一度言ってみましょう！';

    if (resultBox) {
      resultBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <span class="score-badge ${scoreClass}">スコア: ${score}点</span>
          <span style="font-size: 0.85rem; font-weight: 600;">${scoreMsg}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">認識された音声:</div>
        <div class="speech-transcript">"${spokenText}"</div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">単語ごとの判定:</div>
        <div style="margin-top: 0.2rem;">${wordFeedbackHtml}</div>
      `;
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (resultBox) {
      resultBox.innerHTML = `<div style="color: var(--danger); font-size: 0.85rem;">⚠️ 音声を認識できませんでした (${event.error})。マイクへのアクセスを確認してください。</div>`;
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
