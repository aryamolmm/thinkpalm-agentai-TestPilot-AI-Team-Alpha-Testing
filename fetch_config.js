import axios from 'axios';

async function run() {
  try {
    const url = 'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/main/config.json';
    const response = await axios.get(url);
    console.log("=== CONFIG CONTENT ===");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    try {
      const url2 = 'https://raw.githubusercontent.com/albertor03/jira-qmetry-mcp/main/config.json.template';
      const response2 = await axios.get(url2);
      console.log("=== CONFIG TEMPLATE CONTENT ===");
      console.log(JSON.stringify(response2.data, null, 2));
    } catch (err) {
      console.error("Failed to fetch config template:", err.message);
    }
  }
}

run();
