import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034";
const folderId = 2523888;

async function testGet(name, path) {
  try {
    const response = await axios.get(`${baseUrl}/${path.replace(/^\/+/, '')}`, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log(`[${name}] SUCCESS:`, response.status, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`[${name}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  await testGet("Folder details", `/rest/api/latest/projects/${projectId}/testcase-folders/${folderId}`);
  await testGet("Folder testcases 1", `/rest/api/latest/projects/${projectId}/testcase-folders/${folderId}/testcases`);
  await testGet("Folder testcases 2", `/rest/api/latest/projects/${projectId}/testcase-folders/${folderId}/testcase`);
}

run();
