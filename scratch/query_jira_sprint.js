import axios from 'axios';

const baseUrl = "https://aryammurali996.atlassian.net";
const email = "aryammurali996@gmail.com";
const token = "<YOUR_JIRA_API_TOKEN>";
const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

async function run() {
  try {
    const response = await axios.get(`${baseUrl}/rest/api/3/issue/CPDSS-1`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      }
    });
    console.log("SUCCESS!");
    const fields = response.data.fields;
    console.log("Keys available in fields:");
    console.log(Object.keys(fields).join(', '));
    // Look for custom fields containing array/objects or containing "sprint"
    for (const key of Object.keys(fields)) {
      const val = fields[key];
      if (val !== null && (key.includes('customfield') || key === 'sprint' || String(key).toLowerCase().includes('sprint'))) {
        console.log(`Field ${key}:`, typeof val === 'object' ? JSON.stringify(val).substring(0, 300) : val);
      }
    }
  } catch (error) {
    console.error("FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
