chrome.runtime.onInstalled.addListener(function() {
  console.log('答题助手已安装');
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === 'search-answer') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'triggerSearch' }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('发送消息失败:', chrome.runtime.lastError);
          }
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'searchAnswer') {
    searchAnswer(request.question, request.config)
      .then(answer => {
        sendResponse({ success: true, answer: answer });
      })
      .catch(error => {
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

    return answer;
  } catch (error) {
    console.error('搜索答案时出错:', error);
    throw error;
  }
}
