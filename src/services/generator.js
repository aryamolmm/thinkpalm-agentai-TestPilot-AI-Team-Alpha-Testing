import axios from 'axios';

const getProxyUrl = () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://127.0.0.1:3001' 
  : window.location.origin;

/**
 * Agent 1: Test Case Creation (AI Driven)
 */
export const generateTestCasesAI = async (story, apiKey, engine = 'gemini') => {
  const PROXY_URL = getProxyUrl();
  try {
    const response = await axios.post(`${PROXY_URL}/api/ai/generate`, {
      story,
      apiKey,
      type: 'testcases',
      engine
    });
    return response.data.testCases;
  } catch (error) {
    console.error('Agent 1 Error:', error);
    const backendError = error.response?.data?.error;
    throw new Error(backendError || 'Agent 1 failed to analyze the story.');
  }
};

/**
 * Agent 2: Playwright Script Generation (AI Driven)
 */
export const generatePlaywrightScriptAI = async (story, apiKey, engine = 'gemini') => {
  const PROXY_URL = getProxyUrl();
  try {
    const response = await axios.post(`${PROXY_URL}/api/ai/generate`, {
      story,
      apiKey,
      type: 'script',
      engine
    });
    return response.data.script;
  } catch (error) {
    console.error('Agent 2 Error:', error);
    throw new Error('Agent 2 failed to generate the automation script.');
  }
};

/**
 * Agent 3: Rework Failed Script
 */
export const reworkScriptAI = async (story, script, errorLog, apiKey, engine = 'gemini') => {
  const PROXY_URL = getProxyUrl();
  try {
    const response = await axios.post(`${PROXY_URL}/api/ai/rework`, {
      story,
      script,
      errorLog,
      apiKey,
      engine
    });
    return response.data.script;
  } catch (error) {
    console.error('Agent 3 Error:', error);
    throw new Error('Agent 3 failed to rework the script.');
  }
};

export const convertToCSV = (testCases) => {
  if (!testCases || testCases.length === 0) return '';
  const headers = Object.keys(testCases[0]);
  const rows = testCases.map(tc => 
    headers.map(header => `"${(tc[header] || '').toString().replace(/"/g, '""')}"`).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

export const convertToExcel = (testCases) => {
  if (!testCases || testCases.length === 0) return '';
  const headers = Object.keys(testCases[0]);
  
  let html = '<table><thead><tr>';
  headers.forEach(h => html += `<th style="background-color: #4f46e5; color: white;">${h}</th>`);
  html += '</tr></thead><tbody>';
  
  testCases.forEach(tc => {
    html += '<tr>';
    headers.forEach(h => html += `<td>${tc[h] || ''}</td>`);
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
