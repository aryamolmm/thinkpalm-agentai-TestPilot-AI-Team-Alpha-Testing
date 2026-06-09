const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'api', 'index.js');
const content = fs.readFileSync(filePath, 'utf8');

// Split into lines (preserve CRLF)
const lines = content.split('\n');
// Lines are 0-indexed internally but 1-indexed in the file view
// Handler starts at line 1904 (index 1903) and ends at line 2039 (index 2038)
const startLine = 1904 - 1; // 0-indexed
const endLine = 2039 - 1;   // 0-indexed inclusive

console.log('Lines in file:', lines.length);
console.log('Line at startLine:', lines[startLine]);
console.log('Line at endLine:', lines[endLine]);

if (!lines[startLine].includes("sync-executions")) {
  console.error('ERROR: startLine does not contain sync-executions!');
  process.exit(1);
}
if (!lines[endLine].trim().startsWith('});')) {
  console.error('ERROR: endLine does not start with });! Got:', lines[endLine]);
  process.exit(1);
}

const newHandlerLines = `app.post('/api/qmetry/sync-executions', async (req, res) => {
  const { settings, jiraKey, executions, sprintId, sprintName } = req.body;
  console.log('[sync-executions] Starting sync... jiraKey:', jiraKey, '| sprintId:', sprintId, '| count:', executions && executions.length);

  if (!settings || !settings.qmetryBaseUrl || !settings.apiToken) {
    return res.status(400).json({ error: 'Missing QMetry settings' });
  }
  if (!executions || !Array.isArray(executions) || executions.length === 0) {
    return res.status(400).json({ error: 'No executions provided' });
  }

  const url = normalizeQMetryUrl(settings.qmetryBaseUrl);
  console.log('[sync-executions] QMetry URL:', url);

  // Resolve project ID if non-numeric
  let resolvedProjectId = settings.projectId;
  const isNumericProjectId = /^\\d+$/.test(String(settings.projectId || '').trim());
  if (resolvedProjectId && !isNumericProjectId) {
    try {
      const projResponse = await axios.post(url + '/rest/api/latest/projects', {}, {
        headers: { apiKey: settings.apiToken, apikey: settings.apiToken, 'Content-Type': 'application/json' },
        timeout: 5000
      });
      const projects = projResponse.data && projResponse.data.data ? projResponse.data.data : [];
      const match = projects.find(function(p) {
        return String(p.key).toLowerCase() === String(settings.projectId).toLowerCase() ||
          String(p.name).toLowerCase() === String(settings.projectId).toLowerCase() ||
          String(p.id) === String(settings.projectId);
      });
      if (match) { resolvedProjectId = match.id; console.log('[sync-executions] Resolved project ID to:', resolvedProjectId); }
    } catch (e) {
      console.warn('[sync-executions] Could not resolve project ID:', e.message);
    }
  }

  // STRATEGY 1: QMetry Automation API — JUnit XML upload (for Automation API keys)
  var tryAutomationApiSync = async function() {
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<testsuites>\\n';
    xml += '  <testsuite name="Manual Executions" tests="' + executions.length + '">\\n';
    for (var i = 0; i < executions.length; i++) {
      var exec = executions[i];
      var n = (exec.name || exec.tcId || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      xml += '    <testcase classname="ManualTest" name="' + n + '" time="1.0">\\n';
      xml += '      <properties>\\n';
      xml += '        <property name="storykey" value="' + (jiraKey || '') + '"/>\\n';
      if (exec.qmetryId) xml += '        <property name="testcasekey" value="' + exec.qmetryId + '"/>\\n';
      xml += '      </properties>\\n';
      if (exec.status === 'Fail') {
        var c = (exec.comment || 'Manual execution failed').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xml += '      <failure message="' + c + '">Manual Execution Failed</failure>\\n';
      } else if (exec.status === 'Blocked') {
        xml += '      <failure message="Blocked: ' + (exec.comment || '') + '">Manual Execution Blocked</failure>\\n';
      } else if (exec.status === 'Skipped') {
        xml += '      <skipped/>\\n';
      }
      xml += '    </testcase>\\n';
    }
    xml += '  </testsuite>\\n</testsuites>\\n';

    var numId = parseInt(resolvedProjectId, 10);
    var cycleSummary = sprintName ? (sprintName + ' - ' + jiraKey) : ('Manual Execution Cycle - ' + jiraKey);
    var testCyclePayload = { summary: cycleSummary, project: { id: isNaN(numId) ? resolvedProjectId : numId } };
    if (sprintId) testCyclePayload.versionId = sprintId;

    console.log('[sync-executions] [S1] Requesting upload URL...');
    var initResponse = await axios.post(url + '/rest/api/automation/importresult', {
      format: 'junit', isZip: false, fields: { testCycle: testCyclePayload }
    }, { headers: { apiKey: settings.apiToken, apikey: settings.apiToken, 'Content-Type': 'application/json' } });

    var uploadUrl = initResponse.data && initResponse.data.url;
    var trackingId = initResponse.data && initResponse.data.trackingId;
    if (!uploadUrl) throw new Error('QMetry did not return a valid upload URL: ' + JSON.stringify(initResponse.data));
    await axios.put(uploadUrl, xml, { headers: { 'Content-Type': 'application/xml' } });
    console.log('[sync-executions] [S1] Sync successful. trackingId:', trackingId);
    return { trackingId: trackingId, strategy: 'automation-api' };
  };

  // STRATEGY 2: QMetry Open API — direct testexecutions (for Open API keys)
  var tryOpenApiSync = async function() {
    console.log('[sync-executions] [S2] Using Open API testexecutions endpoint...');
    var statusMap = { Pass: 'PASS', Fail: 'FAIL', Blocked: 'BLOCKED', Skipped: 'NOT_APPLICABLE', 'Not Run': 'NOT_RUN' };
    var trackingId = 'testpilot-exec-' + Date.now();
    var results = [];
    var successCount = 0;
    var failCount = 0;
    var numId = parseInt(resolvedProjectId, 10);

    for (var i = 0; i < executions.length; i++) {
      var exec = executions[i];
      var qStatus = statusMap[exec.status] || 'NOT_RUN';
      if (exec.qmetryId) {
        try {
          console.log('[sync-executions] [S2] Update execution:', exec.qmetryId, '->', qStatus);
          var r = await axios.post(url + '/rest/api/latest/testexecutions', {
            status: { name: qStatus }, comment: exec.comment || '', testcase: { key: exec.qmetryId }
          }, { headers: { apiKey: settings.apiToken, 'Content-Type': 'application/json' }, timeout: 10000 });
          results.push({ tcId: exec.tcId, qmetryId: exec.qmetryId, status: 'synced', response: r.data });
          successCount++;
        } catch (err) {
          if (err.response && (err.response.status === 401 || err.response.status === 403)) throw err;
          console.warn('[sync-executions] [S2] Execution failed for', exec.qmetryId, ':', err.message);
          results.push({ tcId: exec.tcId, qmetryId: exec.qmetryId, status: 'failed', error: err.message });
          failCount++;
        }
      } else {
        var tcBody = {
          summary: exec.name || exec.tcId || 'Test Case',
          name: exec.name || exec.tcId || 'Test Case',
          description: 'Synced from TestPilot AI. Status: ' + (exec.status || 'Not Run') + (exec.comment ? '. Notes: ' + exec.comment : ''),
          testSteps: [{ description: exec.name || exec.tcId, expectedResult: '' }]
        };
        if (jiraKey) tcBody.issueLinks = [jiraKey];
        if (resolvedProjectId) tcBody.project = { id: isNaN(numId) ? resolvedProjectId : numId };
        try {
          console.log('[sync-executions] [S2] Create TC for', exec.tcId, 'and post execution:', qStatus);
          var createRes = await axios.post(url + '/rest/api/latest/testcases', tcBody, {
            headers: { apiKey: settings.apiToken, 'Content-Type': 'application/json' }, timeout: 10000
          });
          var newKey = (createRes.data && (createRes.data.key || createRes.data.id)) || null;
          if (newKey) {
            try {
              await axios.post(url + '/rest/api/latest/testexecutions', {
                status: { name: qStatus }, comment: exec.comment || '', testcase: { key: newKey }
              }, { headers: { apiKey: settings.apiToken, 'Content-Type': 'application/json' }, timeout: 10000 });
            } catch (ee) { console.warn('[sync-executions] [S2] Exec post failed for new TC', newKey, ':', ee.message); }
          }
          results.push({ tcId: exec.tcId, qmetryId: newKey, status: 'created_and_synced' });
          successCount++;
        } catch (err) {
          if (err.response && (err.response.status === 401 || err.response.status === 403)) throw err;
          console.error('[sync-executions] [S2] TC create failed for', exec.tcId, ':', err.message);
          results.push({ tcId: exec.tcId, status: 'failed', error: (err.response && err.response.data && err.response.data.errorMessage) || err.message });
          failCount++;
        }
      }
    }
    console.log('[sync-executions] [S2] Done. success=' + successCount + ' failed=' + failCount);
    return { trackingId: trackingId, strategy: 'open-api', summary: { total: executions.length, success: successCount, failed: failCount }, results: results };
  };

  // Run Strategy 1 first; fall back to Strategy 2 if Automation API returns 401/403
  try {
    var result1 = await tryAutomationApiSync();
    return res.json(Object.assign({ success: true, message: 'Sync initiated successfully' }, result1));
  } catch (automationError) {
    var automationStatus = automationError.response && automationError.response.status;
    console.warn('[sync-executions] Automation API HTTP ' + automationStatus + ':', automationError.message);
    if (automationStatus === 401 || automationStatus === 403) {
      console.log('[sync-executions] Open API key detected — switching to Strategy 2 (Open API)...');
      try {
        var result2 = await tryOpenApiSync();
        return res.json(Object.assign({ success: true, message: 'Sync completed via Open API' }, result2));
      } catch (openApiError) {
        var oas = openApiError.response && openApiError.response.status;
        var oam = (openApiError.response && openApiError.response.data && (openApiError.response.data.errorMessage || openApiError.response.data.error)) || openApiError.message;
        console.error('[sync-executions] Open API also failed HTTP ' + oas + ':', oam);
        return res.status(oas || 401).json({ error: 'Unauthorized access. Please verify your QMetry API token in Settings.', details: openApiError.response && openApiError.response.data });
      }
    }
    var errStatus = (automationError.response && automationError.response.status) || 500;
    var errMsg = (automationError.response && automationError.response.data && (automationError.response.data.errorMessage || automationError.response.data.error)) || automationError.message;
    console.error('[sync-executions] Automation API error:', errMsg);
    return res.status(errStatus).json({ error: errMsg, details: automationError.response && automationError.response.data });
  }
});`.split('\n');

// Replace the handler lines (startLine to endLine inclusive)
lines.splice(startLine, endLine - startLine + 1, ...newHandlerLines);

const newContent = lines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: Handler replaced!');
console.log('New file size:', newContent.length, 'bytes');

// Verify
const check = newContent.indexOf("app.post('/api/qmetry/sync-executions'");
const check2 = newContent.indexOf("app.post('/api/qmetry/sync-executions'", check + 1);
console.log('First handler at char:', check);
console.log('Second handler at char:', check2, '(the duplicate at bottom of file)');
