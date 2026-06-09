import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const cycleKey = "CPDSS-TR-1";
// From previous discovery:
const execId = "299216172";     // testCaseExecutionId  
const mapId = 222786896;        // testCycleTestCaseMapId

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  // Try the QMetry "update execution" endpoint patterns
  const attempts = [
    // Pattern A: PUT on the cycle's execution path with mapId
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions/${mapId}`,  body: { executionResult: { name: 'PASS' } } },
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions/${mapId}`,  body: { executionResult: 'Pass' } },
    { m: 'patch', url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions/${mapId}`,  body: { executionResult: { name: 'PASS' } } },
    // Pattern B: PUT on just testcycle map id
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testcycletestcasemaps/${mapId}`,   body: { executionResult: { name: 'PASS' } } },
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testcycletestcasemaps/${mapId}`,   body: { status: { name: 'PASS' } } },
    // Pattern C: Using execId (testCaseExecutionId)
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testexecutions/${execId}`,         body: { executionResult: { name: 'PASS' } } },
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testexecutions/${execId}`,         body: { result: 'Pass' } },
    { m: 'patch', url: `${baseUrl}/rest/api/latest/testexecutions/${execId}`,         body: { executionResult: { name: 'PASS' } } },
    // Pattern D: testcases executions 
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testcases/CPDSS-TC-63/executions/${execId}`, body: { executionResult: { name: 'PASS' } } },
    // Pattern E: cycle execution update with tcKey
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/CPDSS-TC-63/executions`, body: { executionResult: { name: 'PASS' } } },
    { m: 'post',  url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/CPDSS-TC-63/executions`, body: { executionResult: { name: 'PASS' } } },
    // Pattern F: PUT cycle with execution list
    { m: 'put',   url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}`, body: { executions: [{ testCaseExecutionId: execId, executionResult: { name: 'PASS' } }] } },
  ];

  for (const { m, url, body } of attempts) {
    try {
      const r = await axios[m](url, body, { headers, timeout: 6000 });
      console.log(`✅ ${m.toUpperCase()} ${url.replace(baseUrl, '')} → ${r.status}`, JSON.stringify(r.data).slice(0, 200));
    } catch (e) {
      const s = e.response?.status;
      const d = JSON.stringify(e.response?.data || e.message)?.slice(0, 150);
      console.log(`❌ ${m.toUpperCase()} ${url.replace(baseUrl, '')} → ${s}: ${d}`);
    }
  }
}

run().catch(console.error);
