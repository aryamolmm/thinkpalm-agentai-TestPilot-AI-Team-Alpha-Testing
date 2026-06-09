import axios from 'axios';

async function run() {
  try {
    const url = 'https://api.github.com/repos/albertor03/jira-qmetry-mcp/contents/src/api';
    console.log(`Fetching file list from: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log("=== FILES IN src/api/ ===");
    response.data.forEach(file => {
      console.log(`- ${file.name} (${file.download_url})`);
    });
  } catch (error) {
    console.error("Failed to fetch folder listing:", error.message);
  }
}

run();
