import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = 10034;

async function run() {
  console.log("=== Running Folder and TC Creation Flow ===");
  
  // 1. Create a folder
  let folderId = null;
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/projects/${projectId}/testcase-folders`, {
      folderName: "CPDSS-Dynamic-Folder",
      description: "Testing dynamic folder creation",
      parentId: -1
    }, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log("CREATE folder SUCCESS:", response.status, response.data);
    folderId = response.data.id;
  } catch (error) {
    console.log("CREATE folder FAILED:", error.response?.status, error.response?.data || error.message);
    return;
  }

  // 2. Create TC inside that folder with steps
  try {
    const payload = {
      summary: "Test Case with Steps inside Folder",
      name: "Test Case with Steps inside Folder",
      description: "Testing steps inside folder integration",
      projectId: projectId,
      project: { id: projectId },
      folderId: folderId,
      steps: [
        { stepDetails: "Given the user is on the login page", expectedResult: "Login page is displayed", testData: "", id: 1 },
        { stepDetails: "When the user enters valid credentials", expectedResult: "User can enter credentials", testData: "", id: 2 },
        { stepDetails: "Then the user is redirected to the dashboard", expectedResult: "Dashboard is shown", testData: "", id: 3 }
      ]
    };

    const response = await axios.post(`${baseUrl}/rest/api/latest/testcases`, payload, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log("CREATE TC SUCCESS:", response.status, response.data);
  } catch (error) {
    console.log("CREATE TC FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
