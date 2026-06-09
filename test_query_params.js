import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function createTestCase(name, urlPath, payload) {
  try {
    const response = await axios.post(`${baseUrl}/${urlPath.replace(/^\/+/, '')}`, payload, {
      headers: {
        'apiKey': token,
        'apikey': token,
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
  // Test 1: Query param projectId=10034
  await createTestCase("Query param projectId=10034", "/rest/api/latest/testcases?projectId=10034", {
    summary: "Test Case with Query Param projectId",
    description: "Desc Q1",
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test 2: Query param projectKey=CPDSS
  await createTestCase("Query param projectKey=CPDSS", "/rest/api/latest/testcases?projectKey=CPDSS", {
    summary: "Test Case with Query Param projectKey",
    description: "Desc Q2",
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test 3: Query param project=10034
  await createTestCase("Query param project=10034", "/rest/api/latest/testcases?project=10034", {
    summary: "Test Case with Query Param project",
    description: "Desc Q3",
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test 4: Query param project=CPDSS
  await createTestCase("Query param project=CPDSS", "/rest/api/latest/testcases?project=CPDSS", {
    summary: "Test Case with Query Param project key",
    description: "Desc Q4",
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });
}

run();
