import axios from 'axios';

async function run() {
  try {
    const urls = [
      'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/master/config.json',
      'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/master/src/config.json',
      'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/master/src/index.ts',
      'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/master/src/api/qmetry.ts'
    ];

    for (const url of urls) {
      try {
        console.log(`\nFetching: ${url}`);
        const response = await axios.get(url);
        console.log(`=== SUCCESS: ${url} ===`);
        console.log(typeof response.data === 'string' ? response.data.substring(0, 1000) : JSON.stringify(response.data).substring(0, 1000));
      } catch (e) {
        console.log(`Failed for ${url}: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Failed to run fetch:", error.message);
  }
}

run();
