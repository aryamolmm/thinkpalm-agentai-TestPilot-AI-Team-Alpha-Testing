import axios from 'axios';

const baseUrl = "https://aryammurali996.atlassian.net";
const email = "aryammurali996@gmail.com";
const token = "<YOUR_JIRA_API_TOKEN>";
const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

async function run() {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/3/search/jql`, {
      jql: "project = CPDSS AND issuetype in (Story, Bug, Task)",
      maxResults: 50,
      fields: ["summary", "status", "sprint", "customfield_10020"]
    }, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log("SUCCESS! Issues found:", response.data.issues.length);
    for (const issue of response.data.issues) {
      console.log(`Issue key: ${issue.key}`);
      const fields = issue.fields;
      console.log("  summary:", fields.summary);
      console.log("  sprint field value:", fields.sprint);
      console.log("  customfield_10020 value:", fields.customfield_10020);
    }
  } catch (error) {
    console.error("FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
