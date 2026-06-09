import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const cycleKey = "CPDSS-TR-1";
const mapId = 222786896;        // testCycleTestCaseMapId for TC-63

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  console.log('Testing POST with mapId as path param (not TC key)...');
  // This is what QMetry actually wants: testCycleTestCaseMapId as the path param
  const attempts = [
    { m: 'post', url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, body: { executionResult: { name: 'PASS' } } },
    { m: 'post', url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, body: { executionResult: 'Pass' } },
    { m: 'post', url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, body: { result: 'Pass' } },
    { m: 'put',  url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, body: { executionResult: { name: 'PASS' } } },
    { m: 'put',  url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}`,            body: { executionResult: { name: 'PASS' } } },
    { m: 'post', url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}`,            body: { executionResult: { name: 'PASS' } } },
    // Try with executionResult id (296709 = Not Executed, need to find PASS id)
    // Common QMetry result ids: 1=Pass, 2=Fail, 3=Block, 4=Not Executed 
    { m: 'post', url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, body: { executionResult: { id: 1 } } },
    { m: 'post', url: `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, body: { executionResult: { id: 296706 } } },
  ];

  for (const { m, url, body } of attempts) {
    try {
      const r = await axios[m](url, body, { headers, timeout: 6000 });
      console.log(`✅ ${m.toUpperCase()} ${url.replace(baseUrl, '')} → ${r.status}`, JSON.stringify(r.data).slice(0, 300));
    } catch (e) {
      const s = e.response?.status;
      const d = JSON.stringify(e.response?.data || e.message)?.slice(0, 200);
      console.log(`❌ ${m.toUpperCase()} ${url.replace(baseUrl, '')} → ${s}: ${d}`);
    }
  }

  // Also try GET on that path to see the response shape we need to match
  console.log('\n=== GET execution details for mapId ===');
  try {
    const r = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, { headers, timeout: 6000 });
    console.log(`GET → ${r.status}`, JSON.stringify(r.data).slice(0, 600));
  } catch (e) { console.log(`GET → ${e.response?.status}:`, JSON.stringify(e.response?.data)?.slice(0, 200)); }

  // Inspect available execution result options first
  console.log('\n=== GET execution results ===');
  try {
    const r = await axios.get(`${baseUrl}/rest/api/latest/executionresults`, { headers, timeout: 6000 });
    console.log(`GET executionresults → ${r.status}`, JSON.stringify(r.data).slice(0, 800));
  } catch (e) { console.log(`GET → ${e.response?.status}:`, JSON.stringify(e.response?.data)?.slice(0, 200)); }
}

run().catch(console.error);
