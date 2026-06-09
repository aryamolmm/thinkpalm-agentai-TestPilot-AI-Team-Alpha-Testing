import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function testGetInfo(name, headers) {
  try {
    const response = await axios.get(`${baseUrl}/rest/admin/project/getinfo`, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    });
    console.log(`[${name}] SUCCESS:`, response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2).substring(0, 1000));
  } catch (error) {
    console.log(`[${name}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  await testGetInfo("No extra headers", {});
  await testGetInfo("Header project: CPDSS", { 'project': 'CPDSS' });
  await testGetInfo("Header project: 10034", { 'project': '10034' });
  await testGetInfo("Header scope: default", { 'scope': 'default' });
  await testGetInfo("Header scope: default + project: CPDSS", { 'scope': 'default', 'project': 'CPDSS' });
  await testGetInfo("Header scope: default + project: 10034", { 'scope': 'default', 'project': '10034' });
}

run();
