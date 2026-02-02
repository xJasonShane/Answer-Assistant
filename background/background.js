chrome.runtime.onInstalled.addListener(function() {
  console.log('答题助手已安装');
});

chrome.commands.onCommand.addListener(function(command, tab) {
  console.log('收到命令:', command, '标签页:', tab);

  if (command === 'search-answer') {
    if (!tab || !tab.id) {
      console.error('无法获取当前标签页');
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          sendSearchCommand(tabs[0].id);
        }
      });
    } else {
      sendSearchCommand(tab.id);
    }
  }
});

function sendSearchCommand(tabId) {
  console.log('发送 triggerSearch 消息到标签页:', tabId);

  chrome.tabs.sendMessage(tabId, { action: 'triggerSearch' }, function(response) {
    if (chrome.runtime.lastError) {
      console.error('发送消息失败:', chrome.runtime.lastError.message);
      console.error('可能原因: content script 未加载');

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content.js']
      }, function() {
        if (chrome.runtime.lastError) {
          console.error('注入 content script 失败:', chrome.runtime.lastError.message);
        } else {
          console.log('已注入 content script，重新发送消息');
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'triggerSearch' });
          }, 100);
        }
      });
    } else {
      console.log('收到标签页响应:', response);
    }
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('收到消息:', request.action, '来自:', sender.tab?.url);

  if (request.action === 'searchAnswer') {
    searchAnswer(request.question, request.config)
      .then(answer => {
        console.log('搜索答案成功，长度:', answer.length);
        sendResponse({ success: true, answer: answer });
      })
      .catch(error => {
        console.error('搜索答案失败:', error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

async function searchAnswer(question, config) {
  try {
    const apiUrl = config.apiUrl;
    const apiKey = config.apiKey;
    const modelName = config.modelName || 'Qwen/Qwen2.5-7B-Instruct';

    console.log('开始搜索答案:', {
      apiUrl,
      modelName,
      questionLength: question.length
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的答题助手，请根据用户提供的问题给出准确、简洁的答案。'
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error?.message || errorMessage;
      } catch (e) {
        console.error('解析错误响应失败:', e);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '未获取到答案';

    console.log('API 响应成功');
    return answer;
  } catch (error) {
    console.error('搜索答案时出错:', error);
    throw error;
  }
}
