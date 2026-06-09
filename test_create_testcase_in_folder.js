import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034";
const folderId = 2523888; // Already created folder ID

async function tryCreateTestCase(name, extraPayload) {
  try {
    const payload = {
      summary: `Test Case in Folder (${name})`,
      name: `Test Case in Folder (${name})`,
      description: "Testing folder integration",
      project: { id: 10034 },
      testSteps: [
        { description: "Step 1", expectedResult: "Result 1" }
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
  // Test A: folderId as root property
  await tryCreateTestCase("folderId root", { folderId });

  // Test B: folder object
  await tryCreateTestCase("folder object", { folder: { id: folderId } });
}

run();
