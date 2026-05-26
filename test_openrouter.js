import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY || 'sk-or-v1-test'; // Or retrieve from .env

async function test() {
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "deepseek/deepseek-chat",
      messages: [{ role: 'user', content: 'Say hello' }],
      temperature: 0.1,
      max_tokens: 50
    }, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`, 
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://testpilot-ai.vercel.app', 
        'X-Title': 'TestPilot AI'
      }
    });
    console.log('SUCCESS:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('ERROR status:', error.response?.status);
    console.error('ERROR data:', JSON.stringify(error.response?.data, null, 2));
    console.error('ERROR message:', error.message);
  }
}

test();
