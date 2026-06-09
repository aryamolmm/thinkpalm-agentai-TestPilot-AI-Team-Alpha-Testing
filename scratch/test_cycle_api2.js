import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034";
const cycleKey = "CPDSS-TR-1";
const cycleId = "4AVVTlPjHVvY1m";

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  // 1. GET testcycle details
  console.log('\n=== 1. GET full testcycle details ===');
  try {
    const r = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}`, { headers, timeout: 8000 });
    console.log('Full cycle data:', JSON.stringify(r.data, null, 2));
  } catch (e) { console.log('Failed:', e.response?.status, e.response?.data); }

  // 2. Try to get testcases linked to cycle
  console.log('\n=== 2. GET testcases in cycle ===');
  try {
    const r = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases`, { headers, timeout: 8000 });
    console.log('Testcases in cycle:', r.status, JSON.stringify(r.data).slice(0, 800));
  } catch (e) { console.log('Failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 300)); }

  // 3. Try POST search executions for cycle
  console.log('\n=== 3. POST search executions for cycle ===');
  try {
    const r = await axios.post(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions`, {}, { headers, timeout: 8000 });
    console.log('Executions:', r.status, JSON.stringify(r.data).slice(0, 800));
  } catch (e) { console.log('Failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 300)); }

  // 4. Try to query executions using project testrun endpoints
  console.log('\n=== 4. POST testcycles filter ===');
  try {
    const r = await axios.post(`${baseUrl}/rest/api/latest/testcycles/search`, {
      query: `key = "${cycleKey}"`
    }, { headers, timeout: 8000 });
    console.log('Search by key:', r.status, JSON.stringify(r.data).slice(0, 800));
  } catch (e) { console.log('Failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 300)); }

  // 5. Try execution list via testcycle id
  console.log('\n=== 5. GET testcycle id executions ===');
  const paths = [
    `/rest/api/latest/testcycles/${cycleId}/testexecutions`,
    `/rest/api/latest/executions?testCycleId=${cycleId}`,
    `/rest/api/latest/testexecutions?testCycleKey=${cycleKey}`,
    `/rest/api/latest/testcycles/${cycleKey}/executions`,
  ];
  for (const path of paths) {
    try {
      const r = await axios.get(`${baseUrl}${path}`, { headers, timeout: 6000 });
      console.log(`GET ${path}: ${r.status}`, JSON.stringify(r.data).slice(0, 500));
    } catch (e) { console.log(`GET ${path}: ${e.response?.status} - ${JSON.stringify(e.response?.data)?.slice(0, 150)}`); }
  }

  // 6. Try to find what PUT endpoint testexecution has
  console.log('\n=== 6. Try to update testexecution directly ===');
  // First get the test case CPDSS-TC-63 details
  try {
    const r = await axios.get(`${baseUrl}/rest/api/latest/testcases/CPDSS-TC-63`, { headers, timeout: 8000 });
    console.log('TC-63 details:', JSON.stringify(r.data).slice(0, 600));
  } catch (e) { console.log('GET TC-63 failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 300)); }

  // 7. Try execution endpoint for the testcase within this cycle
  console.log('\n=== 7. Try execution update for TC in cycle ===');
  try {
    // According to QMetry docs: PUT /testcycles/{cycleKey}/testexecutions/{tcKey}
    const r = await axios.put(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/CPDSS-TC-63`, {
      status: { name: 'PASS' }
    }, { headers, timeout: 8000 });
    console.log('PUT cycle/tc:', r.status, JSON.stringify(r.data).slice(0, 500));
  } catch (e) { console.log('PUT cycle/tc failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 300)); }
}

run();
