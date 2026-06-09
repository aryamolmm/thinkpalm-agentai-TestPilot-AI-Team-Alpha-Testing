import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function run() {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/testcycles/search`, {
      filter: [
        {
          field: "summary",
          operator: "equals",
          value: "sprint1"
        }
      ]
    }, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log("SUCCESS!");
    console.log("Response data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
