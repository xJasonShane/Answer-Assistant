document.addEventListener('DOMContentLoaded', function() {
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const modelNameInput = document.getElementById('modelName');
  const saveConfigBtn = document.getElementById('saveConfig');
  const questionText = document.getElementById('questionText');
  const searchAnswerBtn = document.getElementById('searchAnswer');
  const answerContent = document.getElementById('answerContent');
  const statusText = document.getElementById('statusText');

  function loadConfig() {
    chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName'], function(result) {
      if (result.apiUrl) apiUrlInput.value = result.apiUrl;
      if (result.apiKey) apiKeyInput.value = result.apiKey;
      if (result.modelName) modelNameInput.value = result.modelName;
    });
  }

  function saveConfig() {
    const config = {
      apiUrl: apiUrlInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      modelName: modelNameInput.value.trim()
    };

    chrome.storage.local.set(config, function() {
      statusText.textContent = '配置已保存';
      setTimeout(() => {
        statusText.textContent = '就绪';
      }, 2000);
    });
  }

  function getSelectedText() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, function(response) {
          resolve(response ? response.text : '');
        });
      });
    });
  }

  function searchAnswer() {
    const question = questionText.value.trim();

    if (!question) {
      statusText.textContent = '请输入问题内容';
      return;
    }

    chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName'], function(config) {
      if (!config.apiUrl || !config.apiKey) {
        statusText.textContent = '请先配置 API 地址和密钥';
        return;
      }

      statusText.innerHTML = '<span class="loading"></span>正在搜索答案...';
      searchAnswerBtn.disabled = true;
      answerContent.innerHTML = '<p class="placeholder">正在获取答案...</p>';

      chrome.runtime.sendMessage({
        action: 'searchAnswer',
        question: question,
        config: config
      }, function(response) {
        searchAnswerBtn.disabled = false;

        if (response.success) {
          answerContent.textContent = response.answer;
          statusText.textContent = '搜索完成';
        } else {
          answerContent.innerHTML = '<p class="placeholder">搜索失败: ' + response.error + '</p>';
          statusText.textContent = '搜索失败';
        }

        setTimeout(() => {
          statusText.textContent = '就绪';
        }, 3000);
      });
    });
  }

  saveConfigBtn.addEventListener('click', saveConfig);
  searchAnswerBtn.addEventListener('click', searchAnswer);

  getSelectedText().then(text => {
    if (text) {
      questionText.value = text;
    }
  });

  loadConfig();
});
