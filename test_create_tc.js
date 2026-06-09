import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function createTestCase(name, payload) {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/testcases`, payload, {
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
  // Test A: Using name, project ID as string "CPDSS"
  await createTestCase("A: name + project CPDSS", {
    name: "Test Case A",
    description: "Description A",
    project: {
      id: "CPDSS"
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test B: Using summary, project ID as string "CPDSS"
  await createTestCase("B: summary + project CPDSS", {
    summary: "Test Case B",
    description: "Description B",
    project: {
      id: "CPDSS"
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test C: Using both name and summary, project ID as string "CPDSS"
  await createTestCase("C: name/summary + project CPDSS", {
    name: "Test Case C",
    summary: "Test Case C",
    description: "Description C",
    project: {
      id: "CPDSS"
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test D: Using name, project ID as number 10034
  await createTestCase("D: name + project 10034", {
    name: "Test Case D",
    description: "Description D",
    project: {
      id: 10034
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test E: Using summary, project ID as number 10034
  await createTestCase("E: summary + project 10034", {
    summary: "Test Case E",
    description: "Description E",
    project: {
      id: 10034
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test F: Using both name and summary, project ID as number 10034
  await createTestCase("F: name/summary + project 10034", {
    name: "Test Case F",
    summary: "Test Case F",
    description: "Description F",
    project: {
      id: 10034
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });

  // Test G: Using both, and project ID as string "10034"
  await createTestCase("G: name/summary + project '10034'", {
    name: "Test Case G",
    summary: "Test Case G",
    description: "Description G",
    project: {
      id: "10034"
    },
    testSteps: [
      { description: "Step 1", expectedResult: "Result 1" }
    ]
  });
}

run();
