import axios from 'axios';

const baseUrl = "https://aryammurali996.atlassian.net";
const email = "aryammurali996@gmail.com";
const token = "<YOUR_JIRA_API_TOKEN>";
const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

async function run() {
  try {
    const response = await axios.get(`${baseUrl}/rest/agile/1.0/board`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      }
    });
    console.log("SUCCESS! Got boards:", response.data.values.length);
    for (const board of response.data.values) {
      console.log(`Board ID: ${board.id}, Name: ${board.name}, Type: ${board.type}`);
      // Get sprints for this board
      try {
        const sprintResp = await axios.get(`${baseUrl}/rest/agile/1.0/board/${board.id}/sprint`, {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Accept': 'application/json'
          }
        });
        console.log(`  Sprints:`, sprintResp.data.values.map(s => `${s.id} - ${s.name} (${s.state})`));
      } catch (err) {
        console.log(`  Failed to get sprints for board ${board.id}:`, err.message);
      }
    }
  } catch (error) {
    console.error("FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
