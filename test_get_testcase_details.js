import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function getTCDetails(key) {
  try {
    const response = await axios.get(`${baseUrl}/rest/api/latest/testcases/${key}`, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log(`[${key}] SUCCESS:`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`[${key}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  await getTCDetails('CPDSS-TC-14');
}

run();
