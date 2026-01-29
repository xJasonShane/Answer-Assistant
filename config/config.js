const CONFIG = {
  DEFAULT_API_URL: 'https://api.openai.com/v1/chat/completions',
  DEFAULT_MODEL: 'gpt-3.5-turbo',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1000,
  STORAGE_KEY: 'answerAssistantConfig'
};

function getDefaultConfig() {
  return {
    apiUrl: CONFIG.DEFAULT_API_URL,
    apiKey: '',
    modelName: CONFIG.DEFAULT_MODEL,
    temperature: CONFIG.DEFAULT_TEMPERATURE,
    maxTokens: CONFIG.DEFAULT_MAX_TOKENS
  };
}

function validateConfig(config) {
  if (!config.apiUrl || !config.apiKey) {
    return false;
  }
  return true;
}
