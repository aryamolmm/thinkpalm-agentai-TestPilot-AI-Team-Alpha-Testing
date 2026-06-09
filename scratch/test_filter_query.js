import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function testFilterQuery(filterQuery) {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/testcycles/search`, {
      filterQuery
    }, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log(`[filterQuery: "${filterQuery}"] SUCCESS:`, response.status, JSON.stringify(response.data).substring(0, 1000));
  } catch (error) {
    console.log(`[filterQuery: "${filterQuery}"] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  await testFilterQuery("sprint1");
  await testFilterQuery("summary = 'sprint1'");
  await testFilterQuery("summary ~ 'sprint1'");
  await testFilterQuery("key = 'CPDSS-TR-1'");
  await testFilterQuery("id = 1");
}

run();
