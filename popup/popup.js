const DEFAULT_CONFIG = {
  apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  apiKey: '',
  modelName: 'Qwen/Qwen2.5-7B-Instruct',
  systemPrompt: '你是一个专业的答题助手，请根据用户提供的问题给出准确、简洁的答案。',
  autoFill: true,
  showInPage: true
};

let currentConfig = { ...DEFAULT_CONFIG };
let currentQuestion = '';
let currentAnswer = '';
let historyList = [];

document.addEventListener('DOMContentLoaded', function() {
  initElements();
  loadConfig();
  loadHistory();
  initEventListeners();
  getLastSelectedText();
  tryFillSelectedText();
});

function initElements() {
  window.elements = {
    questionInput: document.getElementById('questionInput'),
    searchBtn: document.getElementById('searchBtn'),
    clearBtn: document.getElementById('clearBtn'),
    answerSection: document.getElementById('answerSection'),
    answerContent: document.getElementById('answerContent'),
    loadingSection: document.getElementById('loadingSection'),
    emptyState: document.getElementById('emptyState'),
    copyBtn: document.getElementById('copyBtn'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    historyBtn: document.getElementById('historyBtn'),
    mainContent: document.getElementById('mainContent'),
    settingsContent: document.getElementById('settingsContent'),
    historyContent: document.getElementById('historyContent'),
    backBtn: document.getElementById('backBtn'),
    backFromHistoryBtn: document.getElementById('backFromHistoryBtn'),
    saveConfigBtn: document.getElementById('saveConfig'),
    apiUrlInput: document.getElementById('apiUrl'),
    apiKeyInput: document.getElementById('apiKey'),
    modelNameInput: document.getElementById('modelName'),
    systemPromptInput: document.getElementById('systemPrompt'),
    autoFillCheckbox: document.getElementById('autoFill'),
    showInPageCheckbox: document.getElementById('showInPage'),
    togglePasswordBtn: document.getElementById('togglePassword'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    statusText: document.getElementById('statusText')
  };
}

function initEventListeners() {
  const {
    questionInput,
    searchBtn,
    clearBtn,
    copyBtn,
    regenerateBtn,
    settingsBtn,
    historyBtn,
    backBtn,
    backFromHistoryBtn,
    saveConfigBtn,
    togglePasswordBtn,
    clearHistoryBtn
  } = elements;

  searchBtn.addEventListener('click', searchAnswer);
  clearBtn.addEventListener('click', clearQuestion);
  copyBtn.addEventListener('click', copyAnswer);
  regenerateBtn.addEventListener('click', regenerateAnswer);
  settingsBtn.addEventListener('click', showSettings);
  historyBtn.addEventListener('click', showHistory);
  backBtn.addEventListener('click', showMain);
  backFromHistoryBtn.addEventListener('click', showMain);
  saveConfigBtn.addEventListener('click', saveConfig);
  togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  clearHistoryBtn.addEventListener('click', clearHistory);

  questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      searchAnswer();
    }
  });

  questionInput.addEventListener('input', () => {
    if (questionInput.value.trim()) {
      hideAnswer();
      showEmptyState();
    }
  });
}

function loadConfig() {
  chrome.storage.local.get(Object.keys(DEFAULT_CONFIG), (result) => {
    currentConfig = { ...DEFAULT_CONFIG, ...result };
    populateConfigFields();
  });
}

function populateConfigFields() {
  const {
    apiUrlInput,
    apiKeyInput,
    modelNameInput,
    systemPromptInput,
    autoFillCheckbox,
    showInPageCheckbox
  } = elements;

  apiUrlInput.value = currentConfig.apiUrl || '';
  apiKeyInput.value = currentConfig.apiKey || '';
  modelNameInput.value = currentConfig.modelName || '';
  systemPromptInput.value = currentConfig.systemPrompt || '';
  autoFillCheckbox.checked = currentConfig.autoFill;
  showInPageCheckbox.checked = currentConfig.showInPage;
}

function saveConfig() {
  const {
    apiUrlInput,
    apiKeyInput,
    modelNameInput,
    systemPromptInput,
    autoFillCheckbox,
    showInPageCheckbox,
    statusText
  } = elements;

  currentConfig = {
    apiUrl: apiUrlInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    modelName: modelNameInput.value.trim(),
    systemPrompt: systemPromptInput.value.trim(),
    autoFill: autoFillCheckbox.checked,
    showInPage: showInPageCheckbox.checked
  };

  chrome.storage.local.set(currentConfig, () => {
    showStatus('设置已保存', 'success');
    setTimeout(() => showStatus('就绪'), 2000);
  });
}

function togglePasswordVisibility() {
  const { apiKeyInput, togglePasswordBtn } = elements;
  const eyeOpen = togglePasswordBtn.querySelector('.eye-open');
  const eyeClosed = togglePasswordBtn.querySelector('.eye-closed');

  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    eyeOpen.style.display = 'none';
    eyeClosed.style.display = 'block';
  } else {
    apiKeyInput.type = 'password';
    eyeOpen.style.display = 'block';
    eyeClosed.style.display = 'none';
  }
}

function getLastSelectedText() {
  chrome.runtime.sendMessage({ action: 'getLastSelectedText' }, (response) => {
    if (response && response.text && !elements.questionInput.value) {
      elements.questionInput.value = response.text;
    }
  });
}

function tryFillSelectedText() {
  if (!currentConfig.autoFill) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script 未就绪或权限不足');
      } else if (response && response.text && !elements.questionInput.value) {
        elements.questionInput.value = response.text;
      }
    });
  });
}

async function searchAnswer() {
  const { questionInput, searchBtn } = elements;
  const question = questionInput.value.trim();

  if (!question) {
    showStatus('请输入问题', 'error');
    return;
  }

  if (!currentConfig.apiUrl || !currentConfig.apiKey) {
    showStatus('请先配置 API', 'error');
    showSettings();
    return;
  }

  currentQuestion = question;
  searchBtn.disabled = true;
  showLoading();

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'searchAnswer',
      question: question,
      config: currentConfig
    });

    if (response.success) {
      currentAnswer = response.answer;
      showAnswer(response.answer);
      addToHistory(question, response.answer);

      if (currentConfig.showInPage) {
        showAnswerInPage(question, response.answer);
      }
    } else {
      showStatus(response.error || '搜索失败', 'error');
      showEmptyState();
    }
  } catch (error) {
    showStatus('搜索失败: ' + error.message, 'error');
    showEmptyState();
  } finally {
    searchBtn.disabled = false;
  }
}

function showAnswerInPage(question, answer) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'showAnswer',
      question: question,
      answer: answer
    }).catch(() => {});
  });
}

function regenerateAnswer() {
  if (currentQuestion) {
    elements.questionInput.value = currentQuestion;
    searchAnswer();
  }
}

function clearQuestion() {
  elements.questionInput.value = '';
  hideAnswer();
  showEmptyState();
  elements.questionInput.focus();
}

function copyAnswer() {
  if (!currentAnswer) return;

  navigator.clipboard.writeText(currentAnswer).then(() => {
    showStatus('已复制到剪贴板', 'success');
    setTimeout(() => showStatus('就绪'), 2000);
  }).catch(() => {
    showStatus('复制失败', 'error');
  });
}

function showLoading() {
  const { loadingSection, answerSection, emptyState } = elements;
  loadingSection.style.display = 'flex';
  answerSection.style.display = 'none';
  emptyState.style.display = 'none';
}

function showAnswer(answer) {
  const { loadingSection, answerSection, emptyState, answerContent } = elements;
  loadingSection.style.display = 'none';
  answerSection.style.display = 'flex';
  emptyState.style.display = 'none';
  answerContent.innerHTML = formatAnswer(answer);
}

function hideAnswer() {
  const { answerSection } = elements;
  answerSection.style.display = 'none';
}

function showEmptyState() {
  const { loadingSection, answerSection, emptyState } = elements;
  loadingSection.style.display = 'none';
  answerSection.style.display = 'none';
  emptyState.style.display = 'flex';
}

function formatAnswer(answer) {
  if (!answer) return '暂无答案';

  return answer
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function showMain() {
  const { mainContent, settingsContent, historyContent } = elements;
  mainContent.style.display = 'flex';
  settingsContent.style.display = 'none';
  historyContent.style.display = 'none';
}

function showSettings() {
  const { mainContent, settingsContent, historyContent } = elements;
  mainContent.style.display = 'none';
  settingsContent.style.display = 'flex';
  historyContent.style.display = 'none';
}

function showHistory() {
  const { mainContent, settingsContent, historyContent } = elements;
  mainContent.style.display = 'none';
  settingsContent.style.display = 'none';
  historyContent.style.display = 'flex';
  renderHistory();
}

function showStatus(text, type = '') {
  const { statusText } = elements;
  statusText.textContent = text;
  statusText.className = type;
}

function loadHistory() {
  chrome.storage.local.get(['historyList'], (result) => {
    historyList = result.historyList || [];
  });
}

function saveHistory() {
  chrome.storage.local.set({ historyList: historyList });
}

function addToHistory(question, answer) {
  const item = {
    id: Date.now(),
    question: question,
    answer: answer,
    timestamp: new Date().toISOString()
  };

  historyList.unshift(item);
  if (historyList.length > 50) {
    historyList = historyList.slice(0, 50);
  }
  saveHistory();
}

function renderHistory() {
  const { historyList: historyListEl } = elements;

  if (historyList.length === 0) {
    historyListEl.innerHTML = `
      <div class="empty-history">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        <p>暂无历史记录</p>
      </div>
    `;
    return;
  }

  historyListEl.innerHTML = historyList.map(item => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-question">${escapeHtml(item.question)}</div>
      <div class="history-meta">
        <span>${formatTime(item.timestamp)}</span>
      </div>
    </div>
  `).join('');

  historyListEl.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const historyItem = historyList.find(h => h.id === id);
      if (historyItem) {
        elements.questionInput.value = historyItem.question;
        currentQuestion = historyItem.question;
        currentAnswer = historyItem.answer;
        showAnswer(historyItem.answer);
        showMain();
      }
    });
  });
}

function clearHistory() {
  if (historyList.length === 0) return;

  if (confirm('确定要清空所有历史记录吗？')) {
    historyList = [];
    saveHistory();
    renderHistory();
    showStatus('历史记录已清空', 'success');
    setTimeout(() => showStatus('就绪'), 2000);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';

  return date.toLocaleDateString('zh-CN');
}
