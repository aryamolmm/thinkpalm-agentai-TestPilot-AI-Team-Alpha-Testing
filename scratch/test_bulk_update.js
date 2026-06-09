import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const cycleKey = "CPDSS-TR-1";
const mapId = 222786896; // testCycleTestCaseMapId for CPDSS-TC-63

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  // Step 1: Get valid execution result IDs from the project
  console.log('=== Step 1: Get valid execution result IDs ===');
  const projectId = 10034;
  // Try: GET /rest/api/latest/executionresults?projectId=xxx
  const resultEndpoints = [
    `/rest/api/latest/executionresults?projectKey=CPDSS`,
    `/rest/api/latest/executionresults`,
    `/rest/api/latest/projects/CPDSS/executionresults`,
    `/rest/api/latest/testresults`,
  ];
  for (const path of resultEndpoints) {
    try {
      const r = await axios.get(`${baseUrl}${path}`, { headers, timeout: 6000 });
      console.log(`GET ${path} → ${r.status}:`, JSON.stringify(r.data).slice(0, 600));
    } catch (e) { console.log(`GET ${path} → ${e.response?.status}: ${JSON.stringify(e.response?.data)?.slice(0, 100)}`); }
  }

  // Step 2: Try the BULK endpoint from Apiary docs  
  console.log('\n=== Step 2: PUT /testcycles/{key}/testcases/bulk ===');
  // Try different executionResultId values
  const resultIds = [1, 2, 3, 4, 5, 10, 100, 296706, 296707, 296708, 296709, 296710];
  for (const resultId of resultIds) {
    try {
      const r = await axios.put(
        `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/bulk`,
        { testCycleTestCaseMapIds: [mapId], executionResultId: resultId },
        { headers, timeout: 6000 }
      );
      // Check what it saved
      const chk = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions`, { headers });
      const tc63 = chk.data.data.find(e => e.testCycleTestCaseMapId === mapId);
      const saved = tc63?.executionResult;
      const changed = saved?.name !== 'Not Executed' ? '✅ CHANGED!' : '⚪';
      console.log(`${changed} resultId=${resultId} → ${r.status} → saved: ${saved?.name} (id=${saved?.id})`);
      if (saved?.name !== 'Not Executed') {
        console.log('\n🎯 WORKING! executionResultId =', resultId, '→', saved?.name);
        break;
      }
    } catch (e) {
      console.log(`resultId=${resultId} → ${e.response?.status}: ${JSON.stringify(e.response?.data)?.slice(0, 150)}`);
    }
  }
}

run().catch(console.error);
