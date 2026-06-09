import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const cycleKey = "CPDSS-TR-1";
const mapId = 222786896; // testCycleTestCaseMapId for CPDSS-TC-63

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  // 1. Check current status
  console.log('=== Current execution status for TC-63 ===');
  const getRes = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, { headers });
  const executions = getRes.data.executions?.data || [];
  console.log('Latest execution result:', executions[0]?.executionResult?.name);
  console.log('Total executions recorded:', executions.length);

  // 2. Post a PASS update with a clean payload
  console.log('\n=== Posting PASS status ===');
  const postRes = await axios.post(
    `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`,
    { executionResult: { name: 'PASS' }, comment: 'Synced from TestPilot AI' },
    { headers }
  );
  console.log('POST status:', postRes.status); // Should be 204

  // 3. Verify the update took effect
  console.log('\n=== Verifying update ===');
  const verifyRes = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, { headers });
  const latestExec = verifyRes.data.executions?.data?.[0];
  console.log('Latest execution result after update:', latestExec?.executionResult?.name);
  console.log('Full execution:', JSON.stringify(latestExec, null, 2));

  // 4. Also get cycle-level executions list to confirm it shows PASS
  console.log('\n=== Cycle-level view for TC-63 ===');
  const cycleRes = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions`, { headers });
  const tc63 = cycleRes.data.data.find(e => e.testCycleTestCaseMapId === mapId);
  console.log('TC-63 in cycle:', tc63?.executionResult?.name);
}

run().catch(console.error);
