import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = 10034;
const folderId = 2523888;

async function tryCreateTestCase(name, extraPayload) {
  try {
    const payload = {
      summary: `Test Case in Folder with Steps (${name})`,
      name: `Test Case in Folder with Steps (${name})`,
      description: "Testing folder and steps integration",
      projectId: projectId,
      project: { id: projectId },
      steps: [
        { stepDetails: "Given the user is on the login page", expectedResult: "Login page is displayed", testData: "", id: 1 },
        { stepDetails: "When the user enters valid credentials", expectedResult: "User can enter credentials", testData: "", id: 2 },
        { stepDetails: "Then the user is redirected to the dashboard", expectedResult: "Dashboard is shown", testData: "", id: 3 }
      ],
      ...extraPayload
    };

    const response = await axios.post(`${baseUrl}/rest/api/latest/testcases`, payload, {
      headers: {
        'apiKey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log(`[${name}] SUCCESS:`, response.status, response.data);
  } catch (error) {
    console.log(`[${name}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  console.log("=== Testing creating testcase inside folder ===");
  await tryCreateTestCase("folderId root", { folderId });
}

run();
