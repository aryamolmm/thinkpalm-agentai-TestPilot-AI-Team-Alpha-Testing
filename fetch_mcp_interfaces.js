import axios from 'axios';

async function run() {
  try {
    const url = 'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/master/src/interfaces/qmetry-test-cases.ts';
    console.log(`Fetching from: ${url}`);
    const response = await axios.get(url);
    console.log("=== FILE CONTENT ===");
    console.log(response.data);
  } catch (error) {
    console.error("Failed to fetch file:", error.message);
  }
}

run();
