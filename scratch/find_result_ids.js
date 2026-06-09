import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const cycleKey = "CPDSS-TR-1";
const mapId = 222786896;

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  // The previous POST body had executionResult.name = 'PASS' 
  // But the new exec still shows Not Executed — implying the payload format is wrong.
  // Let's try all known QMetry result name formats:
  const statusNamesToTry = [
    'PASS', 'Pass', 'pass',
    'Passed', 'PASSED', 
    'FAIL', 'Fail', 'Failed', 'FAILED',
    'IN_PROGRESS',
    'Pass_WithDeviation',
  ];

  // First, try to get the list of valid execution result options from the cycle
  console.log('=== Getting current execution list to see valid result IDs ===');
  const listRes = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions`, { headers });
  const tc63 = listRes.data.data.find(e => e.testCycleTestCaseMapId === mapId);
  console.log('Current TC-63 result:', JSON.stringify(tc63?.executionResult));
  console.log('Valid result id being used:', tc63?.executionResult?.id);
  // Not Executed id = 296709
  // Let's find Pass/Fail ids by looking at project-level results
  
  // Try project execution results
  console.log('\n=== Try project execution results ===');
  const projectId = 10034;
  const tries = [
    `/rest/api/latest/executionresults?projectId=${projectId}`,
    `/rest/api/latest/projects/${projectId}/executionresults`,
    `/rest/api/latest/testcycles/${cycleKey}/executionresults`,
  ];
  for (const path of tries) {
    try {
      const r = await axios.get(`${baseUrl}${path}`, { headers, timeout: 6000 });
      console.log(`GET ${path} → ${r.status}:`, JSON.stringify(r.data).slice(0, 600));
    } catch (e) { console.log(`GET ${path} → ${e.response?.status}: ${JSON.stringify(e.response?.data)?.slice(0, 100)}`); }
  }

  // Try with result id: Not Executed is 296709, so maybe Pass=296706, Fail=296707, etc?
  console.log('\n=== Try different result IDs ===');
  const baseResultId = 296709; // Not Executed
  for (let offset = -5; offset <= 5; offset++) {
    const resultId = baseResultId + offset;
    try {
      const postRes = await axios.post(
        `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`,
        { executionResult: { id: resultId } },
        { headers, timeout: 6000 }
      );
      // Check what it saved
      const chk = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, { headers });
      const saved = chk.data.executions?.data?.[0];
      console.log(`id=${resultId} → saved as: ${saved?.executionResult?.name} (id=${saved?.executionResult?.id})`);
    } catch (e) { console.log(`id=${resultId} → ${e.response?.status}: ${JSON.stringify(e.response?.data)?.slice(0, 100)}`); }
  }
}

run().catch(console.error);
