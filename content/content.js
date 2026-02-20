let currentBox = null;
let currentQuestion = '';
let currentAnswer = '';

console.log('答题助手 content script 已加载');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request.action);

  if (request.action === 'getSelectedText') {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    sendResponse({ text: text });
    return false;
  }

  if (request.action === 'triggerSearch') {
    console.log('执行搜索');
    performSearch();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'triggerSearchWithText') {
    console.log('使用指定文本搜索:', request.text);
    performSearchWithText(request.text);
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'showAnswer') {
    console.log('显示答案');
    showAnswerAtSelection(request.answer);
    sendResponse({ success: true });
    return false;
  }

  return false;
});

function performSearch() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  console.log('选中文本:', selectedText);

  if (!selectedText) {
    showNotification('请先选择问题文本', 'warning');
    return;
  }

  performSearchWithText(selectedText);
}

function performSearchWithText(text) {
  currentQuestion = text;

  const selection = window.getSelection();
  let position;

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    position = {
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 10,
      width: rect.width
    };
  } else {
    position = {
      x: window.scrollX + 100,
      y: window.scrollY + 100,
      width: 300
    };
  }

  console.log('答案位置:', position);

  showLoading(position);

  chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName', 'systemPrompt'], (config) => {
    console.log('配置:', config);

    if (!config.apiUrl || !config.apiKey) {
      hideBox();
      showError('请先配置 API 地址和密钥', position);
      return;
    }

    chrome.runtime.sendMessage({
      action: 'searchAnswer',
      question: text,
      config: config
    }, (response) => {
      console.log('搜索响应:', response);
      hideBox();

      if (response.success) {
        currentAnswer = response.answer;
        showAnswer(response.answer, position);
      } else {
        showError(response.error || '搜索失败', position);
      }
    });
  });
}

function showLoading(position) {
  hideBox();
  currentBox = createBox(`
    <div class="answer-assistant-header">
      <span class="answer-assistant-title">答题助手</span>
      <button class="answer-assistant-close" data-close="true">×</button>
    </div>
    <div class="answer-assistant-content">
      <div class="answer-assistant-loading">
        <div class="answer-assistant-spinner"></div>
        <span>正在搜索答案...</span>
      </div>
    </div>
  `, position);
}

function showAnswer(answer, position) {
  hideBox();
  currentBox = createBox(`
    <div class="answer-assistant-header">
      <span class="answer-assistant-title">答题助手</span>
      <div class="answer-assistant-header-actions">
        <button class="answer-assistant-action-btn" data-action="copy" title="复制答案">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button class="answer-assistant-action-btn" data-action="regenerate" title="重新生成">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23,4 23,10 17,10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button class="answer-assistant-close" data-close="true">×</button>
      </div>
    </div>
    <div class="answer-assistant-content">
      <div class="answer-assistant-answer">${formatAnswer(answer)}</div>
    </div>
  `, position);

  setupBoxActions();
}

function showAnswerAtSelection(answer) {
  const selection = window.getSelection();
  let position;

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    position = {
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 10,
      width: rect.width
    };
  } else {
    position = {
      x: window.scrollX + 100,
      y: window.scrollY + 100,
      width: 300
    };
  }

  showAnswer(answer, position);
}

function showError(error, position) {
  hideBox();
  currentBox = createBox(`
    <div class="answer-assistant-header">
      <span class="answer-assistant-title">答题助手</span>
      <button class="answer-assistant-close" data-close="true">×</button>
    </div>
    <div class="answer-assistant-content">
      <div class="answer-assistant-error">${error}</div>
    </div>
  `, position);
}

function createBox(html, position) {
  const box = document.createElement('div');
  box.className = 'answer-assistant-container';
  box.id = 'answer-assistant-box';
  box.innerHTML = html;
  box.style.left = position.x + 'px';
  box.style.top = position.y + 'px';
  document.body.appendChild(box);

  const closeBtn = box.querySelector('[data-close="true"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideBox);
  }

  ensureBoxInViewport(box);

  return box;
}

function ensureBoxInViewport(box) {
  const boxRect = box.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (boxRect.right > viewportWidth) {
    const newLeft = viewportWidth - boxRect.width - 20;
    box.style.left = Math.max(10, newLeft + window.scrollX) + 'px';
  }

  if (boxRect.bottom > viewportHeight) {
    const newTop = boxRect.top - boxRect.height - 20;
    box.style.top = Math.max(10, newTop + window.scrollY) + 'px';
  }
}

function setupBoxActions() {
  if (!currentBox) return;

  const copyBtn = currentBox.querySelector('[data-action="copy"]');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (currentAnswer) {
        navigator.clipboard.writeText(currentAnswer).then(() => {
          showNotification('已复制到剪贴板', 'success');
        }).catch(() => {
          showNotification('复制失败', 'error');
        });
      }
    });
  }

  const regenerateBtn = currentBox.querySelector('[data-action="regenerate"]');
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', () => {
      if (currentQuestion) {
        performSearchWithText(currentQuestion);
      }
    });
  }
}

function hideBox() {
  if (currentBox) {
    currentBox.remove();
    currentBox = null;
  }
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

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'answer-assistant-notification answer-assistant-notification-' + type;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

document.addEventListener('click', (event) => {
  if (currentBox && !currentBox.contains(event.target)) {
    hideBox();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideBox();
  }
});
