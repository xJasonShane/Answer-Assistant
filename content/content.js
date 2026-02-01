let currentAnswerBox = null;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
  } else if (request.action === 'showAnswer') {
    showAnswerBox(request.answer, request.position);
    sendResponse({ success: true });
  } else if (request.action === 'hideAnswer') {
    hideAnswerBox();
    sendResponse({ success: true });
  } else if (request.action === 'triggerSearch') {
    searchAnswer();
    sendResponse({ success: true });
  }
});

function getSelectedText() {
  return window.getSelection().toString().trim();
}

function getSelectionPosition() {
  const selection = window.getSelection();
  if (!selection.rangeCount || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    x: rect.left + window.scrollX,
    y: rect.bottom + window.scrollY + 10,
    width: rect.width
  };
}

function createAnswerBox(answer, position) {
  const box = document.createElement('div');
  box.className = 'answer-assistant-container';
  box.id = 'answer-assistant-box';

  box.innerHTML = `
    <div class="answer-assistant-header">
      <span class="answer-assistant-title">答题助手</span>
      <button class="answer-assistant-close" onclick="document.getElementById('answer-assistant-box').remove()">×</button>
    </div>
    <div class="answer-assistant-content">
      <div class="answer-assistant-answer">${formatAnswer(answer)}</div>
    </div>
  `;

  box.style.left = position.x + 'px';
  box.style.top = position.y + 'px';

  document.body.appendChild(box);
  return box;
}

function showAnswerBox(answer, position) {
  hideAnswerBox();
  currentAnswerBox = createAnswerBox(answer, position);
}

function hideAnswerBox() {
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

async function searchAnswer() {
  const selectedText = getSelectedText();

  if (!selectedText) {
    alert('请先选择问题文本');
    return;
  }

  const position = getSelectionPosition();
  if (!position) {
    alert('无法获取选中文本位置');
    return;
  }

  hideAnswerBox();

  const loadingBox = createLoadingBox(position);
  currentAnswerBox = loadingBox;

  try {
    chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName'], function(config) {
      if (!config.apiUrl || !config.apiKey) {
        hideAnswerBox();
        showErrorBox('请先配置 API 地址和密钥', position);
        return;
      }

      chrome.runtime.sendMessage({
        action: 'searchAnswer',
        question: selectedText,
        config: config
      }, function(response) {
        hideAnswerBox();

        if (response.success) {
          showAnswerBox(response.answer, position);
        } else {
          showErrorBox('搜索失败: ' + response.error, position);
        }
      });
    });
  } catch (error) {
    hideAnswerBox();
    showErrorBox('发生错误: ' + error.message, position);
  }
}

function createLoadingBox(position) {
  const box = document.createElement('div');
  box.className = 'answer-assistant-container';
  box.id = 'answer-assistant-box';

  box.innerHTML = `
    <div class="answer-assistant-header">
      <span class="answer-assistant-title">答题助手</span>
      <button class="answer-assistant-close" onclick="document.getElementById('answer-assistant-box').remove()">×</button>
    </div>
    <div class="answer-assistant-content">
      <div class="answer-assistant-loading">
        <div class="answer-assistant-spinner"></div>
        <span>正在搜索答案...</span>
      </div>
    </div>
  `;

  box.style.left = position.x + 'px';
  box.style.top = position.y + 'px';

  document.body.appendChild(box);
  return box;
}

function showErrorBox(error, position) {
  const box = document.createElement('div');
  box.className = 'answer-assistant-container';
  box.id = 'answer-assistant-box';

  box.innerHTML = `
    <div class="answer-assistant-header">
      <span class="answer-assistant-title">答题助手</span>
      <button class="answer-assistant-close" onclick="document.getElementById('answer-assistant-box').remove()">×</button>
    </div>
    <div class="answer-assistant-content">
      <div class="answer-assistant-error">${error}</div>
    </div>
  `;

  box.style.left = position.x + 'px';
  box.style.top = position.y + 'px';

  document.body.appendChild(box);
  currentAnswerBox = box;
}

document.addEventListener('click', function(event) {
  if (currentAnswerBox && !currentAnswerBox.contains(event.target)) {
    hideAnswerBox();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    hideAnswerBox();
  }
});
