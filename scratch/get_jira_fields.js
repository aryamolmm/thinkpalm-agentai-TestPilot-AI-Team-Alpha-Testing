import axios from 'axios';

const baseUrl = "https://aryammurali996.atlassian.net";
const email = "aryammurali996@gmail.com";
const token = "<YOUR_JIRA_API_TOKEN>";
const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

async function run() {
  try {
    const response = await axios.get(`${baseUrl}/rest/api/3/field`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      }
    });
    console.log("SUCCESS!");
    const fields = response.data.map(f => ({ id: f.id, name: f.name, custom: f.custom, schema: f.schema }));
    console.log(JSON.stringify(fields, null, 2));
  } catch (error) {
    console.error("FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
