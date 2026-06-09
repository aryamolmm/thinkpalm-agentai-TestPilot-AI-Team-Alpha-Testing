import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function testGet(path, params = {}) {
  try {
    const response = await axios.get(`${baseUrl}/${path.replace(/^\/+/, '')}`, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json',
        'project': '10034'
      },
      params,
      timeout: 10000
    });
    console.log(`[GET ${path}] SUCCESS:`, response.status, JSON.stringify(response.data).substring(0, 800));
    return response.data;
  } catch (error) {
    console.log(`[GET ${path}] FAILED:`, error.response?.status, JSON.stringify(error.response?.data) || error.message);
    return null;
  }
}

async function testPost(path, data = {}) {
  try {
    const response = await axios.post(`${baseUrl}/${path.replace(/^\/+/, '')}`, data, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json',
        'project': '10034'
      },
      timeout: 10000
    });
    console.log(`[POST ${path}] SUCCESS:`, response.status, JSON.stringify(response.data).substring(0, 800));
    return response.data;
  } catch (error) {
    console.log(`[POST ${path}] FAILED:`, error.response?.status, JSON.stringify(error.response?.data) || error.message);
    return null;
  }
}

async function run() {
  console.log("=== Probing QMetry Folder Endpoints ===");
  // Let's test getinfo
  await testGet('/rest/admin/project/getinfo');
  
  // Let's test folders endpoints
  console.log("\n--- Testing general folder paths ---");
  await testGet('/rest/api/latest/folders');
  await testGet('/rest/api/latest/folders/tree');
  await testGet('/rest/api/latest/testcases/folders');
  await testGet('/rest/api/latest/testcases/tree');
  await testGet('/rest/api/latest/testcases/folders/tree');
  await testGet('/rest/api/latest/projects/10034/testcases/folders');
  
  // Try with query params
  console.log("\n--- Testing folder paths with scope/project/type query params ---");
  await testGet('/rest/api/latest/folders', { scope: 'testcase', projectId: '10034' });
  await testGet('/rest/api/latest/folders', { type: 'tc', projectId: '10034' });
  await testGet('/rest/api/latest/folders', { type: 'testcase', projectId: '10034' });
  await testGet('/rest/api/latest/folders', { type: 'testcase', projectId: 10034 });
  await testGet('/rest/api/latest/folders', { type: 'tc', projectId: 10034 });
  await testGet('/rest/api/latest/folders', { type: 'TC', projectId: 10034 });
  await testGet('/rest/api/latest/folders', { type: 'TC', project: 10034 });
  await testGet('/rest/api/latest/folders', { type: 'TC', project: '10034' });

  // Search folders
  console.log("\n--- Testing POST search paths ---");
  await testPost('/rest/api/latest/folders/search');
  await testPost('/rest/api/latest/testcases/folders/search');
}

run();
