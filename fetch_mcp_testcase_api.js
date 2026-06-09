import axios from 'axios';

async function run() {
  try {
    const url = 'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/master/src/api/qmetry-test-case.ts';
    const response = await axios.get(url);
    console.log("=== FILE CONTENT TOP ===");
    console.log(response.data.substring(0, 3500));
  } catch (error) {
    console.error("Failed to fetch file:", error.message);
  }
}

run();
