import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034";

async function run() {
  try {
    const response = await axios.get(`${baseUrl}/rest/api/latest/projects/${projectId}/testcase-folders`, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log("GET testcase-folders SUCCESS:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("GET testcase-folders FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
