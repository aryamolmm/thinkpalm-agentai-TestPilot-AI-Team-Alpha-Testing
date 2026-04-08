import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { exec } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

// Endpoint for AI-driven generation using Gemini 1.5 Pro
app.post('/api/ai/generate', async (req, res) => {
  const { story, apiKey, type } = req.body;
  if (!apiKey || !story) return res.status(400).json({ error: 'Missing story or AI Key' });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = type === 'script' 
    ? `Write a complete Playwright TypeScript automation script for this Jira Story: "${story.summary}". 
       Description: ${story.description}. 
       The script should include Happy Path, Negative scenarios, and Edge cases. 
       Return ONLY the TypeScript code block, no markdown or text.`
    : `Generate 8 diverse test cases for this Jira Story: "${story.summary}". 
       Description: ${story.description}. 
       Include: Happy Path, Negative, Edge case, Boundary, Error handling, and Real-user mistakes.
       Use exactly these CSV columns: Work Key,Summary,Assignee,Reporter,Step Summary,Expected Result,Version,Folder,TestCase Type,Created By,Created On,Updated By,Updated On,Story Linkages,Is Shareable Step.
       Return a JSON array of objects representing these test cases. NO text or markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```typescript|```|json/g, '').trim();
    
    if (type === 'script') {
        res.json({ script: text });
    } else {
        res.json({ testCases: JSON.parse(text) });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to run a Playwright test script
app.post('/api/test/run', async (req, res) => {
  const { script, id } = req.body;
  if (!script) return res.status(400).json({ error: 'No script provided' });
  try {
    const testsDir = join(process.cwd(), 'tests');
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
    console.log(`🚀 AI-Enabled Jira Proxy & Test Runner at http://localhost:${PORT}`);
  });
}
export default app;
