import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034"; // numeric projectId resolved from projects.json

async function testEndpoint(method, path, body = null) {
  try {
    const url = `${baseUrl}/${path.replace(/^\/+/, '')}`;
    const response = await axios({
      method,
      url,
      data: body,
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    console.log(`[${method} ${path}] SUCCESS:`, response.status, JSON.stringify(response.data).substring(0, 1000));
  } catch (error) {
    console.log(`[${method} ${path}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  const endpoints = [
    { method: 'GET', path: `/rest/api/latest/projects/${projectId}/testcycles` },
    { method: 'GET', path: `/rest/api/latest/projects/${projectId}/testcycles/search` },
    { method: 'POST', path: `/rest/api/latest/projects/${projectId}/testcycles/search`, body: {} },
    { method: 'GET', path: `/rest/api/latest/testcycles` },
    { method: 'GET', path: `/rest/api/latest/testcycles/search` },
    { method: 'POST', path: `/rest/api/latest/testcycles/search`, body: {} },
    { method: 'GET', path: `/rest/api/latest/projects/${projectId}/test-cycles` },
    { method: 'GET', path: `/rest/api/latest/projects/${projectId}/test-cycles/search` },
    { method: 'POST', path: `/rest/api/latest/projects/${projectId}/test-cycles/search`, body: {} }
  ];

  for (const ep of endpoints) {
    await testEndpoint(ep.method, ep.path, ep.body);
  }
}

run();
