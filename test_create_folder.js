import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034"; // CPDSS numeric ID

async function run() {
  console.log("=== Testing Creating QMetry Folder ===");
  
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/projects/${projectId}/testcase-folders`, {
      folderName: "CPDSS-1",
      description: "Folder for Jira Story CPDSS-1"
    }, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log("CREATE folder SUCCESS:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("CREATE folder FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
