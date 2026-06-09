import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function run() {
  try {
    const response = await axios.post(`${baseUrl}/rest/admin/project/list`, {}, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    console.log("PROJECT LIST SUCCESS:", response.status, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("PROJECT LIST FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
