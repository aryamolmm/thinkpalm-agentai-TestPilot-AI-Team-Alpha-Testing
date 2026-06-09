import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function testEndpoint(method, path) {
  try {
    const url = `${baseUrl}/${path.replace(/^\/+/, '')}`;
    const response = await axios({
      method,
      url,
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    console.log(`[${method} ${path}] SUCCESS:`, response.status, JSON.stringify(response.data).substring(0, 500));
  } catch (error) {
    console.log(`[${method} ${path}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  const endpoints = [
    { method: 'GET', path: '/rest/api/latest/projects' },
    { method: 'GET', path: '/rest/api/latest/projects/list' },
    { method: 'POST', path: '/rest/api/latest/projects/list' },
    { method: 'GET', path: '/rest/api/latest/spaces' },
    { method: 'GET', path: '/rest/api/latest/space' },
    { method: 'GET', path: '/rest/api/latest/project' },
    { method: 'GET', path: '/rest/api/latest/project/list' },
    { method: 'POST', path: '/rest/api/latest/project/list' },
    { method: 'GET', path: '/rest/api/latest/projects/search' },
    { method: 'POST', path: '/rest/api/latest/projects/search' }
  ];

  for (const ep of endpoints) {
    await testEndpoint(ep.method, ep.path);
  }
}

run();
