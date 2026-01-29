chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: 'searchAnswer',
    title: '使用答题助手搜索答案',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'searchAnswer' && info.selectionText) {
    chrome.action.openPopup();
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
    const modelName = config.modelName || 'gpt-3.5-turbo';

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
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '未获取到答案';

    return answer;
  } catch (error) {
    console.error('搜索答案时出错:', error);
    throw error;
  }
}
