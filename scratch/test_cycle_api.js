import axios from 'axios';

// Config from the project
const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034";

async function run() {
  const headers = { 'apiKey': token, 'Content-Type': 'application/json' };

  // 1. Try to search for test cycles
  console.log('\n=== 1. Search test cycles ===');
  try {
    // Try GET search
    const r1 = await axios.get(`${baseUrl}/rest/api/latest/testcycles`, { headers, params: { maxResults: 10, projectId }, timeout: 8000 });
    console.log('GET /testcycles:', r1.status, JSON.stringify(r1.data).slice(0, 500));
  } catch (e) { console.log('GET /testcycles failed:', e.response?.status, e.response?.data || e.message); }

  // 2. Try POST search
  console.log('\n=== 2. POST testcycles search ===');
  try {
    const r2 = await axios.post(`${baseUrl}/rest/api/latest/testcycles`, { projectId: parseInt(projectId) }, { headers, timeout: 8000 });
    console.log('POST /testcycles:', r2.status, JSON.stringify(r2.data).slice(0, 500));
  } catch (e) { console.log('POST /testcycles failed:', e.response?.status, e.response?.data || e.message); }

  // 3. Try to get a specific cycle by key
  console.log('\n=== 3. GET testcycle by key CPDSS-TR-1 ===');
  try {
    const r3 = await axios.get(`${baseUrl}/rest/api/latest/testcycles/CPDSS-TR-1`, { headers, timeout: 8000 });
    console.log('GET /testcycles/CPDSS-TR-1:', r3.status, JSON.stringify(r3.data).slice(0, 500));
  } catch (e) { console.log('GET /testcycles/CPDSS-TR-1 failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 200) || e.message); }

  // 4. Try to get executions for the cycle
  console.log('\n=== 4. GET testexecutions for cycle ===');
  try {
    const r4 = await axios.get(`${baseUrl}/rest/api/latest/testcycles/CPDSS-TR-1/testexecutions`, { headers, timeout: 8000 });
    console.log('GET testexecutions:', r4.status, JSON.stringify(r4.data).slice(0, 500));
  } catch (e) { console.log('GET testexecutions failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 200) || e.message); }

  // 5. Try alternate executions format  
  console.log('\n=== 5. POST testexecutions list ===');
  try {
    const r5 = await axios.post(`${baseUrl}/rest/api/latest/testexecutions`, { testCycle: { key: 'CPDSS-TR-1' } }, { headers, timeout: 8000 });
    console.log('POST testexecutions:', r5.status, JSON.stringify(r5.data).slice(0, 500));
  } catch (e) { console.log('POST testexecutions failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 200) || e.message); }

  // 6. Try GET testexecutions with params
  console.log('\n=== 6. GET testexecutions with testCycleKey param ===');
  try {
    const r6 = await axios.get(`${baseUrl}/rest/api/latest/testexecutions`, { headers, params: { testCycleKey: 'CPDSS-TR-1', maxResults: 5 }, timeout: 8000 });
    console.log('GET testexecutions:', r6.status, JSON.stringify(r6.data).slice(0, 800));
  } catch (e) { console.log('GET testexecutions failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 200) || e.message); }

  // 7. Try search endpoint for testcycles
  console.log('\n=== 7. POST /testcycles/search ===');
  try {
    const r7 = await axios.post(`${baseUrl}/rest/api/latest/testcycles/search`, { 
      fields: { project: { id: parseInt(projectId) } }, 
      maxResults: 10 
    }, { headers, timeout: 8000 });
    console.log('POST /testcycles/search:', r7.status, JSON.stringify(r7.data).slice(0, 800));
  } catch (e) { console.log('POST /testcycles/search failed:', e.response?.status, JSON.stringify(e.response?.data)?.slice(0, 200) || e.message); }
}

run();
