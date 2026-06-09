import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const cycleKey = "CPDSS-TR-1";

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  // Step 1: Get all executions for the cycle
  console.log('=== Step 1: Get executions for cycle ===');
  const listRes = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions`, { headers });
  const executions = listRes.data.data;
  console.log(`Found ${executions.length} executions`);
  
  // Find CPDSS-TC-63
  const tc63 = executions.find(e => e.testCaseKey === 'CPDSS-TC-63');
  console.log('TC-63 execution:', JSON.stringify(tc63, null, 2));

  const execId = tc63?.testCaseExecutionId;
  const mapId = tc63?.testCycleTestCaseMapId;
  console.log('\nexecId:', execId, '| mapId:', mapId);

  // Step 2: Try different PUT/PATCH endpoints to update status
  console.log('\n=== Step 2: Try update endpoints ===');

  const paths = [
    { method: 'PUT', path: `/rest/api/latest/testcycles/${cycleKey}/executions/${execId}` },
    { method: 'PUT', path: `/rest/api/latest/testcycles/${cycleKey}/executions/${mapId}` },
    { method: 'PATCH', path: `/rest/api/latest/testcycles/${cycleKey}/executions/${execId}` },
    { method: 'PUT', path: `/rest/api/latest/testexecutions/${execId}` },
    { method: 'PUT', path: `/rest/api/latest/testcycles/executions/${execId}` },
  ];

  const statusPayloads = [
    { executionResult: { name: 'PASS' } },
    { status: { name: 'PASS' } },
    { executionResult: 'Pass' },
    { result: 'Pass' },
  ];

  for (const { method, path } of paths) {
    for (const payload of statusPayloads) {
      try {
        const fn = method === 'PUT' ? axios.put : axios.patch;
        const r = await fn(`${baseUrl}${path}`, payload, { headers, timeout: 6000 });
        console.log(`✅ ${method} ${path} with`, JSON.stringify(payload), '→', r.status, JSON.stringify(r.data).slice(0, 200));
        return; // Found it!
      } catch (e) {
        const status = e.response?.status;
        const msg = JSON.stringify(e.response?.data)?.slice(0, 120);
        if (status !== 404) {
          console.log(`${method} ${path} with ${JSON.stringify(payload)}: ${status} ${msg}`);
        }
      }
    }
  }
  console.log('\nNone of the direct update paths worked. Now trying the executions endpoint with the full executions list format...');

  // Step 3: Try updating via the cycle executions list endpoint  
  console.log('\n=== Step 3: POST/PUT cycle executions bulk update ===');
  const bulkPayloads = [
    { testCaseExecutionId: execId, executionResult: { name: 'PASS' } },
    [{ testCaseExecutionId: execId, executionResult: { name: 'PASS' } }],
    { data: [{ testCaseExecutionId: execId, executionResult: { name: 'PASS' } }] },
  ];
  for (const payload of bulkPayloads) {
    for (const method of ['put', 'patch', 'post']) {
      try {
        const r = await axios[method](`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions`, payload, { headers, timeout: 6000 });
        console.log(`✅ ${method.toUpperCase()} /executions with payload ${JSON.stringify(payload).slice(0, 80)} → ${r.status}`, JSON.stringify(r.data).slice(0, 200));
      } catch (e) {
        const status = e.response?.status;
        const msg = JSON.stringify(e.response?.data)?.slice(0, 120);
        if (status !== 404 && status !== 405) {
          console.log(`${method.toUpperCase()} /executions: ${status} ${msg}`);
        }
      }
    }
  }
}

run().catch(console.error);
