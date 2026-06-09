import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const cycleKey = "CPDSS-TR-1";
const mapId = 222786896;

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  // Try every variation of payload field names and value formats
  // The goal: figure out the correct body that sets "Pass"
  const payloads = [
    // Using 'result' field (common in older QMetry)
    { result: 'Pass' },
    { result: 'PASS' },
    { result: { name: 'Pass' } },
    // Using 'testExecutionResult' 
    { testExecutionResult: { name: 'PASS' } },
    // Using 'executionResult' with exact string
    { executionResult: 'Pass' },
    // Status as string
    { status: 'Pass' },
    { status: 'PASS' },
    // Nested defaultName
    { executionResult: { defaultName: 'Pass' } },
    { executionResult: { defaultName: 'PASS' } },
    // QMetry uses 'Passed' as name?
    { executionResult: { name: 'Passed' } },
    { executionResult: { name: 'IN_PROGRESS' } },
    // Try with testResultId = actual execution id  
    { testResultId: 296706, executionResult: { name: 'PASS' } },
    // Try adding testCaseExecutionId explicitly  
    { testCaseExecutionId: '299216172', executionResult: { name: 'PASS' } },
    // Raw body with everything
    { 
      executionResult: { name: 'PASS' },
      comment: 'test',
      environment: { id: 90131 },
      testCycleTestCaseMapId: mapId
    },
  ];

  for (const payload of payloads) {
    try {
      const postRes = await axios.post(
        `${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`,
        payload,
        { headers, timeout: 6000 }
      );
      
      // Check what was actually saved
      await new Promise(r => setTimeout(r, 200));
      const chk = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/testcases/${mapId}/executions`, { headers });
      const latest = chk.data.executions?.data?.[0];
      const savedName = latest?.executionResult?.name;
      const savedId = latest?.executionResult?.id;
      
      const marker = savedName !== 'Not Executed' ? '✅ CHANGED!' : '⚪ still Not Executed';
      console.log(`${marker} Payload: ${JSON.stringify(payload).slice(0,80)} → saved: ${savedName} (id=${savedId})`);
      
      if (savedName !== 'Not Executed') {
        console.log('\n🎯 WORKING PAYLOAD FOUND:', JSON.stringify(payload, null, 2));
        return;
      }
    } catch (e) {
      console.log(`❌ payload ${JSON.stringify(payload).slice(0,60)} → ${e.response?.status}: ${JSON.stringify(e.response?.data)?.slice(0,100)}`);
    }
  }

  // Last resort: try to find the valid executionResult names from the cycle's response
  console.log('\n=== Checking full GET response for valid result options ===');
  const r = await axios.get(`${baseUrl}/rest/api/latest/testcycles/${cycleKey}/executions`, { headers });
  const tc63 = r.data.data.find(e => e.testCycleTestCaseMapId === mapId);
  console.log('Full TC-63 execution object:', JSON.stringify(tc63, null, 2));
}

run().catch(console.error);
