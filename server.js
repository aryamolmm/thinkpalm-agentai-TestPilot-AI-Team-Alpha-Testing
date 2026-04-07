import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { exec } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

  const urlMatch = baseUrl.match(/https?:\/\/[^/]+/);
  const url = urlMatch ? urlMatch[0] : baseUrl.replace(/\/$/, '');
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

// Endpoint to run a Playwright test script
app.post('/api/test/run', async (req, res) => {
  const { script, id } = req.body;
  if (!script) return res.status(400).json({ error: 'No script provided' });

  try {
    const testsDir = join(process.cwd(), 'tests');
    try { await mkdir(testsDir, { recursive: true }); } catch (e) {}

    const testPath = join(testsDir, `${id}_test.spec.ts`);
    await writeFile(testPath, script);

    console.log(`🏃 Running Playwright test: ${testPath}`);

    // Set a timeout for the test to prevent hanging
    exec(`npx playwright test "${testPath}" --reporter=list`, (err, stdout, stderr) => {
      res.json({
        success: !err,
        output: stdout,
        error: err ? stderr || err.message : null
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Jira CORS Proxy & Test Runner at http://localhost:${PORT}`);
});

// For production deployment: serve frontend static files
const __dirname = join(process.cwd(), 'dist');
app.use(express.static(__dirname));

// Fallback for React Router (Single Page App)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
