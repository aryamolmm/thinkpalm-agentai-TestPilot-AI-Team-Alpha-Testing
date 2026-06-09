import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";

async function testSearch(name, headers, body) {
  try {
    const response = await axios.post(`${baseUrl}/rest/api/latest/testcases/search`, body, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
    });
    console.log(`[${name}] SUCCESS:`, response.status, JSON.stringify(response.data).substring(0, 200));
  } catch (error) {
    console.log(`[${name}] FAILED:`, error.response?.status, error.response?.data || error.message);
  }
}

async function run() {
  // Body parameter tests
  await testSearch("Body spaceId: 10034", {}, { spaceId: 10034 });
  await testSearch("Body SpaceId: 10034", {}, { SpaceId: 10034 });
  await testSearch("Body spaceId: '10034'", {}, { spaceId: "10034" });
  await testSearch("Body SpaceId: '10034'", {}, { SpaceId: "10034" });
  await testSearch("Body spaceId: 'CPDSS'", {}, { spaceId: "CPDSS" });
  await testSearch("Body SpaceId: 'CPDSS'", {}, { SpaceId: "CPDSS" });
  
  // Nested project/space body parameter tests
  await testSearch("Body project.id: 10034", {}, { project: { id: 10034 } });
  await testSearch("Body project.id: 'CPDSS'", {}, { project: { id: "CPDSS" } });

  // Header tests (with empty body)
  await testSearch("Header spaceId: 10034", { spaceId: "10034" }, {});
  await testSearch("Header SpaceId: 10034", { SpaceId: "10034" }, {});
  await testSearch("Header spaceId: CPDSS", { spaceId: "CPDSS" }, {});
  await testSearch("Header SpaceId: CPDSS", { SpaceId: "CPDSS" }, {});
  await testSearch("Header project: 10034", { project: "10034" }, {});
  await testSearch("Header project: CPDSS", { project: "CPDSS" }, {});
}

run();
