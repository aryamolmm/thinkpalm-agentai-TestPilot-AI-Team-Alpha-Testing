import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function createTestCase(name, headers, payload) {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/testcases`, payload, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
    });
    console.log(`[${name}] SUCCESS:`, response.status, response.data);
  } catch (error) {
    console.log(`[${name}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  // Test 1: Header 'scope': 'default'
  await createTestCase("Header scope: default", { 'scope': 'default' }, {
    summary: "Test Case scope default",
    description: "Desc",
    project: { id: 10034 }
  });

  // Test 2: Header 'scope': '10034'
  await createTestCase("Header scope: 10034", { 'scope': '10034' }, {
    summary: "Test Case scope 10034",
    description: "Desc",
    project: { id: 10034 }
  });

  // Test 3: Header 'scope': 'CPDSS'
  await createTestCase("Header scope: CPDSS", { 'scope': 'CPDSS' }, {
    summary: "Test Case scope CPDSS",
    description: "Desc",
    project: { id: 10034 }
  });

  // Test 4: Header 'spaceId': '10034'
  await createTestCase("Header spaceId: 10034", { 'spaceId': '10034' }, {
    summary: "Test Case spaceId header 10034",
    description: "Desc",
    project: { id: 10034 }
  });

  // Test 5: Payload field 'spaceId': 10034
  await createTestCase("Payload spaceId: 10034", {}, {
    summary: "Test Case spaceId payload 10034",
    description: "Desc",
    spaceId: 10034
  });

  // Test 6: Payload field 'spaceId': 'CPDSS'
  await createTestCase("Payload spaceId: CPDSS", {}, {
    summary: "Test Case spaceId payload CPDSS",
    description: "Desc",
    spaceId: "CPDSS"
  });

  // Test 7: Header 'project': 'CPDSS' and payload 'project': { 'key': 'CPDSS' }
  await createTestCase("Header/Payload project key CPDSS", { 'project': 'CPDSS' }, {
    summary: "Test Case both key CPDSS",
    description: "Desc",
    project: { key: "CPDSS" }
  });

  // Test 8: Header 'project': '10034' and payload 'project': { 'key': 'CPDSS' }
  await createTestCase("Header project ID 10034, Payload key CPDSS", { 'project': '10034' }, {
    summary: "Test Case project 10034 key CPDSS",
    description: "Desc",
    project: { key: "CPDSS" }
  });

  // Test 9: Header 'project': 'CPDSS' and no project in payload
  await createTestCase("Header project key CPDSS, no payload project", { 'project': 'CPDSS' }, {
    summary: "Test Case header key CPDSS",
    description: "Desc"
  });
}

run();
