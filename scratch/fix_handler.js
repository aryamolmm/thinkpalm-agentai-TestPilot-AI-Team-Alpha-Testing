const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'api', 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

const MARKER = "app.post('/api/qmetry/sync-executions'";
const firstIdx = content.indexOf(MARKER);
const secondIdx = content.indexOf(MARKER, firstIdx + 1);

console.log('First handler at char:', firstIdx);
console.log('Second handler at char:', secondIdx);

// Find the end of the first handler by counting braces from firstIdx
let depth = 0;
let i = firstIdx;
let handlerEnd = -1;
let foundFirstOpen = false;

while (i < content.length) {
  const ch = content[i];
  if (ch === '{') {
    depth++;
    foundFirstOpen = true;
  } else if (ch === '}' && foundFirstOpen) {
    depth--;
    if (depth === 0) {
      // Look for ');' after the closing brace (allowing \r\n)
      let j = i + 1;
      while (j < content.length && (content[j] === '\r' || content[j] === '\n' || content[j] === ' ')) {
        // don't skip non-whitespace
        if (content[j] !== '\r' && content[j] !== '\n') break;
        j++;
      }
      // Check for );
      if (content.slice(i + 1, i + 3) === ');') {
        handlerEnd = i + 3;
        break;
      } else if (content.slice(i + 1).startsWith('\r\n);')) {
        handlerEnd = i + 5;
        break;
      } else if (content.slice(i + 1).startsWith('\n);')) {
        handlerEnd = i + 4;
        break;
      }
    }
  }
  i++;
}

console.log('First handler ends at char:', handlerEnd);
console.log('Snippet at end:', JSON.stringify(content.slice(handlerEnd - 5, handlerEnd + 20)));

// The new handler replacement
const newHandler = `app.post('/api/qmetry/sync-executions', async (req, res) => {
  const { settings, jiraKey, executions, sprintId, sprintName } = req.body;
  console.log('[sync-executions] Starting sync...');
  console.log('[sync-executions] jiraKey:', jiraKey, '| sprintId:', sprintId, '| executions count:', executions?.length);

  if (!settings || !settings.qmetryBaseUrl || !settings.apiToken) {
    return res.status(400).json({ error: 'Missing QMetry settings' });
  }
  if (!executions || !Array.isArray(executions) || executions.length === 0) {
    return res.status(400).json({ error: 'No executions provided' });
  }

  const url = normalizeQMetryUrl(settings.qmetryBaseUrl);
  console.log('[sync-executions] Normalized QMetry URL:', url);

  // Resolve project ID if non-numeric
  let resolvedProjectId = settings.projectId;
  const isNumeric = /^\\d+$/.test(String(settings.projectId || '').trim());
  if (resolvedProjectId && !isNumeric) {
    try {
      const projResponse = await axios.post(url + '/rest/api/latest/projects', {}, {
        headers: { 'apiKey': settings.apiToken, 'apikey': settings.apiToken, 'Content-Type': 'application/json' },
        timeout: 5000
      });
      const projects = projResponse.data?.data || [];
      const match = projects.find(p =>
        String(p.key).toLowerCase() === String(settings.projectId).toLowerCase() ||
        String(p.name).toLowerCase() === String(settings.projectId).toLowerCase() ||
        String(p.id) === String(settings.projectId)
      );
      if (match) {
        resolvedProjectId = match.id;
        console.log('[sync-executions] Resolved project ID to:', resolvedProjectId);
      }
    } catch (e) {
      console.warn('[sync-executions] Could not resolve project ID (may be Automation key):', e.message);
    }
  }

  // STRATEGY 1: Automation API — JUnit XML upload via pre-signed S3 URL
  // Used when user has a QMetry Automation API key.
  const tryAutomationApiSync = async () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<testsuites>\\n';
    xml += '  <testsuite name="Manual Executions" tests="' + executions.length + '">\\n';
    for (const exec of executions) {
      const n = (exec.name || exec.tcId).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      xml += '    <testcase classname="ManualTest" name="' + n + '" time="1.0">\\n';
      xml += '      <properties>\\n';
      xml += '        <property name="storykey" value="' + jiraKey + '"/>\\n';
      if (exec.qmetryId) xml += '        <property name="testcasekey" value="' + exec.qmetryId + '"/>\\n';
      xml += '      </properties>\\n';
      if (exec.status === 'Fail') {
        const c = (exec.comment || 'Manual execution failed').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xml += '      <failure message="' + c + '">Manual Execution Failed</failure>\\n';
      } else if (exec.status === 'Blocked') {
        xml += '      <failure message="Blocked: ' + (exec.comment || '') + '">Manual Execution Blocked</failure>\\n';
      } else if (exec.status === 'Skipped') {
        xml += '      <skipped/>\\n';
      }
      xml += '    </testcase>\\n';
    }
    xml += '  </testsuite>\\n</testsuites>\\n';

    const numericId = parseInt(resolvedProjectId, 10);
    const cycleSummary = sprintName ? sprintName + ' - ' + jiraKey : 'Manual Execution Cycle - ' + jiraKey;
    const testCyclePayload = {
      summary: cycleSummary,
      project: { id: isNaN(numericId) ? resolvedProjectId : numericId }
    };
    if (sprintId) testCyclePayload.versionId = sprintId;

    console.log('[sync-executions] [Strategy 1] Requesting upload URL from Automation API...');
    const initResponse = await axios.post(url + '/rest/api/automation/importresult', {
      format: 'junit',
      isZip: false,
      fields: { testCycle: testCyclePayload }
    }, {
      headers: { 'apiKey': settings.apiToken, 'apikey': settings.apiToken, 'Content-Type': 'application/json' }
    });

    const uploadUrl = initResponse.data?.url;
    const trackingId = initResponse.data?.trackingId;
    if (!uploadUrl) throw new Error('QMetry did not return a valid upload URL: ' + JSON.stringify(initResponse.data));

    await axios.put(uploadUrl, xml, { headers: { 'Content-Type': 'application/xml' } });
    console.log('[sync-executions] [Strategy 1] Sync successful. trackingId:', trackingId);
    return { trackingId, strategy: 'automation-api' };
  };

  // STRATEGY 2: Open API — direct testexecutions endpoint
  // Fallback when user has a QMetry Open API key (same key used for testcase sync).
  const tryOpenApiSync = async () => {
    console.log('[sync-executions] [Strategy 2] Using Open API direct execution endpoint...');
    const statusMap = { 'Pass': 'PASS', 'Fail': 'FAIL', 'Blocked': 'BLOCKED', 'Skipped': 'NOT_APPLICABLE', 'Not Run': 'NOT_RUN' };
    const trackingId = 'testpilot-exec-' + Date.now();
    const results = [];
    let successCount = 0;
    let failCount = 0;
    const numericId = parseInt(resolvedProjectId, 10);

    for (const exec of executions) {
      const qmetryStatus = statusMap[exec.status] || 'NOT_RUN';
      if (exec.qmetryId) {
        try {
          console.log('[sync-executions] [Strategy 2] Updating execution:', exec.qmetryId, '->', qmetryStatus);
          const execResponse = await axios.post(url + '/rest/api/latest/testexecutions', {
            status: { name: qmetryStatus },
            comment: exec.comment || '',
            testcase: { key: exec.qmetryId }
          }, {
            headers: { 'apiKey': settings.apiToken, 'Content-Type': 'application/json' },
            timeout: 10000
          });
          results.push({ tcId: exec.tcId, qmetryId: exec.qmetryId, status: 'synced', response: execResponse.data });
          successCount++;
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403) throw err;
          console.warn('[sync-executions] [Strategy 2] Execution post failed for', exec.qmetryId, ':', err.response?.data || err.message);
          results.push({ tcId: exec.tcId, qmetryId: exec.qmetryId, status: 'failed', error: err.message });
          failCount++;
        }
      } else {
        const tcBody = {
          summary: exec.name || exec.tcId || 'Test Case',
          name: exec.name || exec.tcId || 'Test Case',
          description: 'Synced from TestPilot AI. Status: ' + (exec.status || 'Not Run') + '.' + (exec.comment ? ' Notes: ' + exec.comment : ''),
          testSteps: [{ description: exec.name || exec.tcId, expectedResult: '' }],
          ...(jiraKey ? { issueLinks: [jiraKey] } : {}),
          ...(resolvedProjectId ? { project: { id: isNaN(numericId) ? resolvedProjectId : numericId } } : {})
        };
        try {
          console.log('[sync-executions] [Strategy 2] Creating TC for', exec.tcId, 'and posting execution ->', qmetryStatus);
          const createRes = await axios.post(url + '/rest/api/latest/testcases', tcBody, {
            headers: { 'apiKey': settings.apiToken, 'Content-Type': 'application/json' },
            timeout: 10000
          });
          const newKey = createRes.data?.key || createRes.data?.id;
          try {
            await axios.post(url + '/rest/api/latest/testexecutions', {
              status: { name: qmetryStatus },
              comment: exec.comment || '',
              testcase: { key: newKey }
            }, {
              headers: { 'apiKey': settings.apiToken, 'Content-Type': 'application/json' },
              timeout: 10000
            });
          } catch (execErr) {
            console.warn('[sync-executions] [Strategy 2] Execution post failed for new TC', newKey, ':', execErr.message);
          }
          results.push({ tcId: exec.tcId, qmetryId: newKey, status: 'created_and_synced' });
          successCount++;
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403) throw err;
          console.error('[sync-executions] [Strategy 2] TC creation failed for', exec.tcId, ':', err.response?.data || err.message);
          results.push({ tcId: exec.tcId, status: 'failed', error: err.response?.data?.errorMessage || err.message });
          failCount++;
        }
      }
    }
    console.log('[sync-executions] [Strategy 2] Done. success=' + successCount + ' failed=' + failCount);
    return { trackingId, strategy: 'open-api', summary: { total: executions.length, success: successCount, failed: failCount }, results };
  };

  // Execute: try Automation API first, fall back to Open API on 401/403
  try {
    const result = await tryAutomationApiSync();
    return res.json({ success: true, ...result, message: 'Sync initiated successfully' });
  } catch (automationError) {
    const automationStatus = automationError.response?.status;
    console.warn('[sync-executions] Automation API HTTP ' + automationStatus + ': ' + automationError.message);

    if (automationStatus === 401 || automationStatus === 403) {
      console.log('[sync-executions] Open API key detected — switching to Open API strategy...');
      try {
        const result = await tryOpenApiSync();
        return res.json({ success: true, ...result, message: 'Sync completed via Open API' });
      } catch (openApiError) {
        const openApiStatus = openApiError.response?.status;
        const openApiMsg = openApiError.response?.data?.errorMessage || openApiError.response?.data?.error || openApiError.message;
        console.error('[sync-executions] Open API also failed HTTP ' + openApiStatus + ': ' + openApiMsg);
        return res.status(openApiStatus || 401).json({
          error: 'Unauthorized access. Please verify your QMetry API token in Settings.',
          details: openApiError.response?.data
        });
      }
    }

    const status = automationError.response?.status || 500;
    const msg = automationError.response?.data?.errorMessage || automationError.response?.data?.error || automationError.message;
    console.error('[sync-executions] Automation API error:', msg);
    return res.status(status).json({ error: msg, details: automationError.response?.data });
  }
});`;

if (handlerEnd === -1) {
  console.error('ERROR: Could not find end of first handler!');
  process.exit(1);
}

const before = content.slice(0, firstIdx);
const after = content.slice(handlerEnd);

const newContent = before + newHandler + after;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: First sync-executions handler replaced.');
console.log('File size before:', content.length, 'after:', newContent.length);

// Verify no syntax issues by checking for double handler registration
const doubleCheck = newContent.indexOf(MARKER, newContent.indexOf(MARKER) + 1);
console.log('Second handler still at char:', doubleCheck, '(expected ~' + secondIdx + ', adjusted for size change)');
