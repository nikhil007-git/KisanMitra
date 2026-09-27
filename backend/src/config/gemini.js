const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./index');

let genAI = null;

const getGeminiClient = () => {
  const apiKey = config.gemini.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const getModel = (modelName = config.gemini.model) => {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }
  return client.getGenerativeModel({ model: modelName || 'gemini-2.0-flash' });
};

module.exports = {
  getGeminiClient,
  getModel,
};
