import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034";

async function tryCreate(parentId) {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/projects/${projectId}/testcase-folders`, {
      folderName: `CPDSS-1-P-${parentId === null ? 'null' : parentId}`,
      description: "Test Folder",
      parentId: parentId
    }, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log(`[parentId: ${parentId}] SUCCESS:`, response.status, response.data);
    return response.data;
  } catch (error) {
    console.log(`[parentId: ${parentId}] FAILED:`, error.response?.status, error.response?.data || error.message);
    return null;
  }
}

async function run() {
  console.log("=== Testing folder parentId values ===");
  await tryCreate(0);
  await tryCreate(-1);
  await tryCreate(null);
  await tryCreate(1);
  await tryCreate("0");
  await tryCreate("-1");
}

run();
