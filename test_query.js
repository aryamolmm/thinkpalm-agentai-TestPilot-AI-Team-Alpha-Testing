import axios from 'axios';

async function run() {
  const projectKey = "CPDSS";
  const baseUrl = "https://aryammurali996.atlassian.net";
  const email = "aryammurali996@gmail.com";
  const token = "<YOUR_JIRA_API_TOKEN>";

  const authHeader = Buffer.from(`${email}:${token}`).toString('base64');
  const url = "https://aryammurali996.atlassian.net";

  try {
    console.log(`[Jira User] Fetching user details`);
    const response = await axios.get(`${url}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    console.log("Status:", response.status);
    console.log("User details:", response.data.displayName, response.data.emailAddress);
  } catch (error) {
    console.error("Direct fetch failed.");
    console.error("Status:", error.response?.status);
    console.error("Error message:", error.message);
    if (error.response?.data) {
      console.error("Error details:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

run();
