import axios from 'axios';

async function run() {
  try {
    const settings = {
      qmetryBaseUrl: "https://aryammurali996.atlassian.net/jira/apps/8b7b816c-2b85-4e73-ae22-aa0e6f0407ec/53926dc7-47de-4878-9fc2-5033dde60120?folderId=-1&projectId=10034&projectKey=CPDSS",
      apiToken: "<YOUR_QMETRY_API_TOKEN>",
      projectId: "CPDSS"
    };

    const payload = {
      summary: "Test Case Created via Proxy",
      name: "Test Case Created via Proxy",
      description: "Testing proxy sync",
      testSteps: [
        { description: "Step 1", expectedResult: "Result 1" }
      ],
      issueLinks: ["CPDSS-1"]
    };

    const response = await axios.post('http://127.0.0.1:3001/api/qmetry/sync', {
      settings,
      payload
    });

    console.log("PROXY SYNC SUCCESS:", response.status, response.data);
  } catch (error) {
    console.log("PROXY SYNC FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
