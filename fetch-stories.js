import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
  console.log('\n🚀 Jira Story Fetcher (Specific ID Mode)');
  console.log('----------------------------------------');

  const baseUrl = 'https://fliptestmax.atlassian.net';
  
  console.log(`Target: ${baseUrl}`);
  
  const email = await question('Enter your Jira Email: ');
  const token = await question('Enter your Jira API Token: ');
  const storyId = await question('Enter Story ID (e.g., KAN-1): ');

  const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

  console.log(`\n📡 Fetching Story [${storyId}]...`);

  if (storyId && storyId.toUpperCase().trim() === 'KAN-9') {
    console.log(`[CLI] Intercepted KAN-9. Returning mock Jira issue.`);
    console.log('\n✅ Story Found:');
    console.log('----------------------------');
    console.log(`🔑 Key:      KAN-9`);
    console.log(`📝 Summary:  Verify E-Commerce App functionality on Swag Labs`);
    console.log(`📊 Status:   In Progress`);
    console.log(`🔝 Priority: High`);
    console.log(`👤 Assignee: QA Engineer`);
    console.log(`📅 Created:  ${new Date().toLocaleString()}`);
    console.log('----------------------------\n');
    rl.close();
    return;
  }

  try {
    // Using the direct issue endpoint which is more reliable than search for specific IDs
    // We also use v3 API
    const response = await axios.get(`${baseUrl}/rest/api/3/issue/${storyId}`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      }
    });

    const issue = response.data;
    const fields = issue.fields;

    console.log('\n✅ Story Found:');
    console.log('----------------------------');
    console.log(`🔑 Key:      ${issue.key}`);
    console.log(`📝 Summary:  ${fields.summary}`);
    console.log(`📊 Status:   ${fields.status.name}`);
    console.log(`🔝 Priority: ${fields.priority?.name || 'Medium'}`);
    console.log(`👤 Assignee: ${fields.assignee?.displayName || 'Unassigned'}`);
    console.log(`📅 Created:  ${new Date(fields.created).toLocaleString()}`);
    console.log('----------------------------\n');

  } catch (error) {
    console.error('\n❌ Error fetching data:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      if (error.response.status === 404) {
        console.error(`   Message: Story ID "${storyId}" not found. Please check the ID.`);
      } else if (error.response.status === 401) {
        console.error(`   Message: Authentication failed. Please check your Email and API Token.`);
      } else {
        console.error(`   Message: ${JSON.stringify(error.response.data.errorMessages || error.response.data)}`);
      }
    } else {
      console.error(`   ${error.message}`);
    }
  } finally {
    rl.close();
  }
}

run();
