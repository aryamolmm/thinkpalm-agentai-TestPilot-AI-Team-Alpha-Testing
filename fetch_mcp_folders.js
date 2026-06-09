import axios from 'axios';

async function run() {
  try {
    const url = 'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/main/src/api/qmetry-test-case-folders.ts';
    const response = await axios.get(url);
    console.log("=== FILE CONTENT FIRST PART ===");
    console.log(response.data.substring(0, 3500));
  } catch (error) {
    console.error("Failed to fetch file:", error.message);
  }
}

run();
