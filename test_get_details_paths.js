import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function run() {
  try {
    const response = await axios.get(`${baseUrl}/rest/api/latest/testcases/CPDSS-TC-24/versions/1`, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log("FULL RESPONSE:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
