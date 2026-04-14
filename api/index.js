import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { exec } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Proxy endpoint to fetch Jira stories
app.post('/api/jira/fetch', async (req, res) => {
  const { baseUrl, email, token, storyId } = req.body;
  if (!baseUrl || !email || !token || !storyId) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }

  // === Jira Logic ===

  let url = baseUrl.trim();
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, '');
  const authHeader = Buffer.from(`${email}:${token}`).toString('base64');
  try {
    const response = await axios.get(`${url}/rest/api/3/issue/${storyId}`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { error: error.message });
  }
});

// Endpoint for AI-driven generation
app.post('/api/ai/generate', async (req, res) => {
  const { story, apiKey, type, engine = 'gemini' } = req.body;
  
  const prompt = type === 'script' 
    ? `[AGENT 2: AUTOMATION SPECIALIST]
       Write a complete Playwright TypeScript automation script for Jira Story: "${story.summary}".
       Description: ${story.description || 'No description'}.
       The script MUST be production-ready and include Happy Path, Negative, and Edge cases.
       Return ONLY the TypeScript code block.`
    : `[AGENT 1: BDD ANALYST]
       Analyze this Requirement/Story: "${story.summary}".
       Description: ${story.description || 'No description'}.
       Generate 8 diverse test cases (Happy Path, Negative, Edge, Boundary) in Strict BDD / Gherkin format.
       Format: JSON array of objects.
       Columns required: "TC_ID" (e.g. TC-01), "Scenario_Name", "Type" (e.g. Happy Path), and "Gherkin" (The Given/When/Then text).
       Return ONLY the valid JSON array without markdown wrapping.`;

  try {
    let text = '';
    if (engine === 'groq') {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      text = response.data.choices[0].message.content;
    } else {
      if (!apiKey) throw new Error('Gemini API Key is required');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    }

    if (type === 'script') {
        text = text.replace(/```typescript|```ts|```|typescript/g, '').trim();
        res.json({ script: text });
    } else {
        const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const jsonText = jsonMatch ? jsonMatch[0] : text.replace(/```json|```|json/g, '').trim();
        res.json({ testCases: JSON.parse(jsonText.trim()) });
    }
  } catch (error) {
    let errorMessage = error.response?.data?.error?.message || error.message;
    console.error('AI Error:', errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// [AGENT 3: REWORK AGENT]
app.post('/api/ai/rework', async (req, res) => {
  const { story, script, errorLog, apiKey, engine = 'gemini' } = req.body;
  
  const prompt = `[AGENT 3: DEBUG & REWORK SPECIALIST]
    The following Playwright script failed.
    STORY: ${story.summary}
    SCRIPT: ${script}
    ERROR LOG: ${errorLog}
    Return ONLY the corrected TypeScript code block.`;

  try {
    let text = '';
    if (engine === 'groq') {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      text = response.data.choices[0].message.content;
    } else {
      if (!apiKey) throw new Error('Gemini API Key is required');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    }
    res.json({ script: text.replace(/```typescript|```ts|```|typescript/g, '').trim() });
  } catch (error) {
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

// Endpoint to run a Playwright test script
app.post('/api/test/run', async (req, res) => {
  const { script, id } = req.body;
  if (!script) return res.status(400).json({ error: 'No script provided' });
  try {
    const testsDir = join(tmpdir(), 'tests');
    try { await mkdir(testsDir, { recursive: true }); } catch (e) {}
    const testPath = join(testsDir, `${id}_test.spec.ts`);
    await writeFile(testPath, script);
    exec(`npx playwright test "${testPath}" --reporter=list`, (err, stdout, stderr) => {
      res.json({ success: !err, output: stdout, error: err ? stderr || err.message : null });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Hybrid AI & Jira Proxy Running at http://localhost:${PORT}`);
  });
}

export default app;
