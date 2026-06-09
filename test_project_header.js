import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function createTestCase(name, payload, projectHeader) {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/testcases`, payload, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'project': projectHeader,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    console.log(`[${name}] SUCCESS:`, response.status, response.data);
  } catch (error) {
    console.log(`[${name}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  console.log("Testing with project key 'CPDSS' in project header...");
  await createTestCase("Key CPDSS", {
    summary: "Test Case with project header CPDSS",
    description: "Description H",
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  }, "CPDSS");

  console.log("\nTesting with project ID '10034' in project header...");
  await createTestCase("ID 10034", {
    summary: "Test Case with project header 10034",
    description: "Description I",
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  }, "10034");

  console.log("\nTesting with project key 'CPDSS' in payload and header...");
  await createTestCase("Both CPDSS", {
    summary: "Test Case with project header and payload CPDSS",
    description: "Description J",
    project: {
      id: "CPDSS"
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  }, "CPDSS");

  console.log("\nTesting with project ID 10034 in payload and header...");
  await createTestCase("Both 10034", {
    summary: "Test Case with project header and payload 10034",
    description: "Description K",
    project: {
      id: 10034
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  }, "10034");
}

run();
