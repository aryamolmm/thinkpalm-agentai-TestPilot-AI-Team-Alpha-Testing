import axios from 'axios';

const getProxyUrl = () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://127.0.0.1:3001' 
  : window.location.origin;

/**
 * QA Engine 1: Test Spec Creation (AI Driven)
 */
export const generateTestCasesAI = async (story, apiKey, engine = 'gemini', typesList = 'happy, negative, edge', testFormat = 'bdd') => {
  const PROXY_URL = getProxyUrl();
  const userMemory = localStorage.getItem('testpilot_ai_memory') || '';
  
  try {
    const response = await axios.post(`${PROXY_URL}/api/ai/generate`, {
      story,
      apiKey,
      type: 'testcases',
      engine,
      userMemory,
      typesList,
      testFormat
    });
    return response.data.testCases;
  } catch (error) {
    console.error('Agent 1 Error:', error);
    const backendError = error.response?.data?.error;
    const message = typeof backendError === 'object' ? (backendError.message || JSON.stringify(backendError)) : (backendError || error.message);
    throw new Error(message || 'QA Engine failed to parse Jira story.');
  }
};

/**
 * QA Engine 2: Automation Code Forging (AI Driven)
 */
export const generateAutomationScriptAI = async (story, apiKey, engine = 'gemini', tool = 'playwright', language = 'typescript', framework = 'none', mappingMode = 'ai', testCases = []) => {
  const PROXY_URL = getProxyUrl();
  const userMemory = localStorage.getItem('testpilot_ai_memory') || '';

  try {
    const response = await axios.post(`${PROXY_URL}/api/ai/generate`, {
      story,
      apiKey,
      type: 'script',
      engine,
      userMemory,
      tool,
      language,
      framework,
      mappingMode,
      testCases   // pass the actual BDD test cases
    });
    return response.data.script;

  } catch (error) {
    console.error('Agent 2 Error:', error);
    throw new Error('QA Engine failed to generate automation script.');
  }
};


/**
 * QA Engine 2.1: Update Script from Steps (AI Driven)
 */
export const updateScriptFromStepsAI = async (story, script, steps, apiKey, engine = 'gemini', tool = 'playwright', language = 'typescript') => {
  const PROXY_URL = getProxyUrl();
  const userMemory = localStorage.getItem('testpilot_ai_memory') || '';

  try {
    const response = await axios.post(`${PROXY_URL}/api/ai/generate`, {
      story,
      apiKey,
      type: 'update_from_steps',
      engine,
      userMemory,
      tool,
      language,
      script,
      steps
    });
    return { script: response.data.script, steps: response.data.steps };
  } catch (error) {
    console.error('Agent 2.1 Error:', error);
    throw new Error('QA Engine failed to update script from steps.');
  }
};

/**
 * QA Engine 3: Self-Healing Forger
 */
export const reworkScriptAI = async (story, script, errorLog, apiKey, engine = 'gemini', tool = 'playwright', language = 'typescript') => {
  const PROXY_URL = getProxyUrl();
  const userMemory = localStorage.getItem('testpilot_ai_memory') || '';

  try {
    const response = await axios.post(`${PROXY_URL}/api/ai/rework`, {
      story,
      script,
      errorLog,
      apiKey,
      engine,
      userMemory,
      tool,
      language
    });
    return response.data.script;
  } catch (error) {
    console.error('Agent 3 Error:', error);
    throw new Error('QA Engine failed to fix script.');
  }
};

export const convertToCSV = (testCases, storyKey) => {
  if (!testCases || testCases.length === 0) return '';
  
  const headers = [
    'Work Key', 'Summary', 'Description', 'Precondition', 'Status', 'Priority',
    'Assignee', 'Reporter', 'Estimated Time', 'Labels', 'Component', 'Sprint',
    'Fix Version', 'Step Summary', 'Test Data', 'Expected Result', 'Version',
    'Folder', 'TestCase Type', 'Created By', 'Created On', 'Updated By',
    'Updated On', 'Story Link', 'Is Shareable', 'Step'
  ];

  const rows = testCases.map(tc => {
    const rowObj = {
      'Work Key': tc.qmetryId || tc.TC_ID || tc['Work Key'] || '',
      'Summary': tc.Scenario_Name || tc.Summary || tc.name || '',
      'Description': tc.Description || `Type: ${tc.Type || 'BDD'}`,
      'Precondition': tc.Precondition || '',
      'Status': tc.Status || '',
      'Priority': tc.Priority || '',
      'Assignee': tc.Assignee || '',
      'Reporter': tc.Reporter || '',
      'Estimated Time': tc['Estimated Time'] || '',
      'Labels': tc.Labels || '',
      'Component': tc.Component || '',
      'Sprint': tc.Sprint || '',
      'Fix Version': tc['Fix Version'] || '',
      'Step Summary': tc.Gherkin || tc['Step Summary'] || tc.Steps || tc.Scenario || '',
      'Test Data': tc['Test Data'] || '',
      'Expected Result': tc.Expected_Result || tc['Expected Result'] || '',
      'Version': tc.Version || '1',
      'Folder': tc.Folder || (storyKey ? `/${storyKey}` : '/SauceDemo'),
      'TestCase Type': tc['TestCase Type'] || 'Manual',
      'Created By': tc['Created By'] || '',
      'Created On': tc['Created On'] || '',
      'Updated By': tc['Updated By'] || '',
      'Updated On': tc['Updated On'] || '',
      'Story Link': tc['Story Link'] || 'FALSE',
      'Is Shareable': tc['Is Shareable'] || '',
      'Step': tc.Step || ''
    };
    return headers.map(header => `"${(rowObj[header] || '').toString().replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const convertToExcel = (testCases, storyKey) => {
  if (!testCases || testCases.length === 0) return '';
  
  const headers = [
    'Work Key', 'Summary', 'Description', 'Precondition', 'Status', 'Priority',
    'Assignee', 'Reporter', 'Estimated Time', 'Labels', 'Component', 'Sprint',
    'Fix Version', 'Step Summary', 'Test Data', 'Expected Result', 'Version',
    'Folder', 'TestCase Type', 'Created By', 'Created On', 'Updated By',
    'Updated On', 'Story Link', 'Is Shareable', 'Step'
  ];
  
  let html = '<table><thead><tr>';
  headers.forEach(h => html += `<th style="background-color: #4f46e5; color: white;">${h}</th>`);
  html += '</tr></thead><tbody>';
  
  testCases.forEach(tc => {
    const rowObj = {
      'Work Key': tc.qmetryId || tc.TC_ID || tc['Work Key'] || '',
      'Summary': tc.Scenario_Name || tc.Summary || tc.name || '',
      'Description': tc.Description || `Type: ${tc.Type || 'BDD'}`,
      'Precondition': tc.Precondition || '',
      'Status': tc.Status || '',
      'Priority': tc.Priority || '',
      'Assignee': tc.Assignee || '',
      'Reporter': tc.Reporter || '',
      'Estimated Time': tc['Estimated Time'] || '',
      'Labels': tc.Labels || '',
      'Component': tc.Component || '',
      'Sprint': tc.Sprint || '',
      'Fix Version': tc['Fix Version'] || '',
      'Step Summary': tc.Gherkin || tc['Step Summary'] || tc.Steps || tc.Scenario || '',
      'Test Data': tc['Test Data'] || '',
      'Expected Result': tc.Expected_Result || tc['Expected Result'] || '',
      'Version': tc.Version || '1',
      'Folder': tc.Folder || (storyKey ? `/${storyKey}` : '/SauceDemo'),
      'TestCase Type': tc['TestCase Type'] || 'Manual',
      'Created By': tc['Created By'] || '',
      'Created On': tc['Created On'] || '',
      'Updated By': tc['Updated By'] || '',
      'Updated On': tc['Updated On'] || '',
      'Story Link': tc['Story Link'] || 'FALSE',
      'Is Shareable': tc['Is Shareable'] || '',
      'Step': tc.Step || ''
    };
    html += '<tr>';
    headers.forEach(h => html += `<td>${rowObj[h] || ''}</td>`);
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  return html;
};

export const downloadFile = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.click();
};
