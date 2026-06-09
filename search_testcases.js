import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function run() {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/testcases/search`, {
      filter: {}
    }, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    console.log("SEARCH SUCCESS:", response.status, JSON.stringify(response.data, null, 2));
  } catch (error) {
    try {
      // Try GET method if POST fails
      const response = await axios.get(`${baseUrl}/rest/api/latest/testcases/search`, {
        headers: {
          'apiKey': token,
          'apikey': token,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log("SEARCH SUCCESS (GET):", response.status, JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.log("SEARCH FAILED:", error.response?.status, error.response?.data || error.message);
    }
  }
}

run();
