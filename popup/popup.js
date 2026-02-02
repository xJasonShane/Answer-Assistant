document.addEventListener('DOMContentLoaded', function() {
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const modelNameInput = document.getElementById('modelName');
  const shortcutKeyInput = document.getElementById('shortcutKey');
  const directOutputCheckbox = document.getElementById('directOutput');
  const autoUpdateCheckbox = document.getElementById('autoUpdate');
  const saveConfigBtn = document.getElementById('saveConfig');
  const statusText = document.getElementById('statusText');

  function loadConfig() {
    chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName', 'directOutput', 'autoUpdate'], function(result) {
      apiUrlInput.value = result.apiUrl || 'https://api.siliconflow.cn/v1/chat/completions';
      apiKeyInput.value = result.apiKey || '';
      modelNameInput.value = result.modelName || 'Qwen/Qwen2.5-7B-Instruct';
      if (result.directOutput !== undefined) directOutputCheckbox.checked = result.directOutput;
      if (result.autoUpdate !== undefined) autoUpdateCheckbox.checked = result.autoUpdate;
    });

    chrome.commands.getAll(function(commands) {
      const shortcut = commands['search-answer']?.shortcut || 'Ctrl+Shift+Q';
      shortcutKeyInput.value = shortcut;
    });
  }

  function saveConfig() {
    const config = {
      apiUrl: apiUrlInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      modelName: modelNameInput.value.trim(),
      directOutput: directOutputCheckbox.checked,
      autoUpdate: autoUpdateCheckbox.checked
    };

    chrome.storage.local.set(config, function() {
      statusText.textContent = '配置已保存';
      setTimeout(() => {
        statusText.textContent = '就绪';
      }, 2000);
    });
  }

  saveConfigBtn.addEventListener('click', saveConfig);
  loadConfig();
});
