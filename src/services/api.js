
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : window.location.origin;
  }
  return 'http://localhost:3001';
};

export const getExecutionBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('testpilot_execution_server_url') || 'http://localhost:3001';
  }
  return 'http://localhost:3001';
};

export const API_URLS = {
  get AGENT_RUN() { return `${getExecutionBaseUrl()}/api/agent/super/run`; },
  get EXECUTION_RESULTS() { return `${getExecutionBaseUrl()}/api/execution-results`; },
  get EXECUTE_TEST() { return `${getExecutionBaseUrl()}/api/execute-test`; },
  get CLEAR_RESULTS() { return `${getExecutionBaseUrl()}/api/execution-results/clear`; },
  get AGENT_EXECUTE() { return `${getExecutionBaseUrl()}/api/agent-execute`; },
  get STOP_EXECUTION() { return `${getExecutionBaseUrl()}/api/stop-execution`; },
  AGENT_STREAM: (id) => `${getExecutionBaseUrl()}/api/agent-stream/${id}`,
  RECORDINGS: (src) => `${getExecutionBaseUrl()}/recordings/${src}`
};
