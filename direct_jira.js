import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function run() {
  let baseUrl = "https://aryammurali996.atlassian.net";
  let email = "aryammurali996@gmail.com";
  let token = "<YOUR_JIRA_API_TOKEN>";

  try {
    const projectsPath = path.join(process.cwd(), 'projects.json');
    if (fs.existsSync(projectsPath)) {
      const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
      if (projects.length > 0) {
        const project = projects.find(p => p.key.toUpperCase() === 'CPDSS') || projects[0];
        baseUrl = project.jiraUrl;
        email = project.email;
        token = project.token;
        console.log(`[Diagnostic] Loaded credentials dynamically from projects.json for project: ${project.key}`);
      }
    }
  } catch (e) {
    console.warn("[Diagnostic] Failed to load projects.json dynamically, using fallback credentials.");
  }

  if (baseUrl) {
    let urlClean = baseUrl.trim();
    if (!urlClean.startsWith('http')) urlClean = `https://${urlClean}`;
    try {
      baseUrl = new URL(urlClean).origin;
    } catch (e) {
      baseUrl = urlClean.replace(/\/+$/, '');
    }
  }

  const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

  try {
    console.log("Querying myself endpoint...");
    const response = await axios.get(`${baseUrl}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    console.log("Jira myself succeeded!");
    console.log("User details:", response.data.displayName, response.data.emailAddress);
  } catch (error) {
    console.error("Jira direct call failed.");
    console.error("Status:", error.response?.status);
    console.error("Error message:", error.message);
    if (error.response?.data) {
      console.error("Error details:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

run();
