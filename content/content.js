let currentAnswerBox = null;

console.log('答题助手 content script 已加载');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request.action);

  if (request.action === 'triggerSearch') {
    console.log('执行搜索');
    doSearch();
    sendResponse({ success: true });
  }

  return true;
});

function doSearch() {
  const selectedText = window.getSelection().toString().trim();
  console.log('选中文本:', selectedText);

  if (!selectedText) {
    alert('请先选择问题文本');
    return;
  }

  const selection = window.getSelection();
  if (!selection.rangeCount || selection.rangeCount === 0) {
    alert('无法获取选中文本位置');
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const position = {
    x: rect.left + window.scrollX,
    y: rect.bottom + window.scrollY + 10,
    width: rect.width
  };

  showLoading(position);

  chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName'], (config) => {
    console.log('配置:', config);

    if (!config.apiUrl || !config.apiKey) {
      hideBox();
      showError('请先配置 API 地址和密钥', position);
      return;
    }

    chrome.runtime.sendMessage({
      action: 'searchAnswer',
      question: selectedText,
      config: config
    }, (response) => {
      console.log('搜索响应:', response);
      hideBox();

      if (response.success) {
        showAnswer(response.answer, position);
      } else {
        showError(response.error || '搜索失败', position);
      }
    });
  });
}

function showLoading(position) {
  hideBox();
  currentAnswerBox = createBox(`
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
  currentAnswerBox = createBox(`
    <div class="answer-assistant-header">
      <span class="answer-assistant-title">答题助手</span>
      <button class="answer-assistant-close" data-close="true">×</button>
    </div>
    <div class="answer-assistant-content">
      <div class="answer-assistant-answer">${formatAnswer(answer)}</div>
    </div>
  `, position);
}

function showError(error, position) {
  hideBox();
  currentAnswerBox = createBox(`
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
  closeBtn.addEventListener('click', hideBox);

  return box;
}

function hideBox() {
  if (currentAnswerBox) {
    currentAnswerBox.remove();
    currentAnswerBox = null;
  }
}

function formatAnswer(answer) {
  if (!answer) return '暂无答案';

  return answer
    .replace(/\n\n/g, '</p><p>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

document.addEventListener('click', (event) => {
  if (currentAnswerBox && !currentAnswerBox.contains(event.target)) {
    hideBox();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideBox();
  }
});
