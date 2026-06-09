import axios from 'axios';

const baseUrl = "https://aryammurali996.atlassian.net";
const email = "aryammurali996@gmail.com";
const token = "<YOUR_JIRA_API_TOKEN>";
const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

async function run() {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/3/search/jql`, {
      jql: "project = CPDSS",
      maxResults: 50,
      fields: ["*all"]
    }, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log("SUCCESS! Issues found:", response.data?.issues?.length);
    if (response.data?.issues && response.data.issues.length > 0) {
      const issue = response.data.issues[0];
      console.log("Issue key:", issue.key);
      const fields = issue.fields || {};
      for (const key of Object.keys(fields)) {
        const val = fields[key];
        if (val !== null && (key.includes('customfield') || key === 'sprint' || String(key).toLowerCase().includes('sprint'))) {
          console.log(`  ${key} (${key}):`, typeof val === 'object' ? JSON.stringify(val).substring(0, 300) : val);
        }
      }
    }
  } catch (error) {
    console.error("FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
