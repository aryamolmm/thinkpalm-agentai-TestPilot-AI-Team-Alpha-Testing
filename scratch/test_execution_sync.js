import axios from 'axios';

const token = "<YOUR_QMETRY_API_TOKEN>";
const baseUrl = "https://qtmcloud.qmetry.com";
const projectId = "10034";

async function run() {
  // Generate a JUnit XML payload with 1 test case execution (e.g. TC-01)
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<testsuites>\n';
  xml += '  <testsuite name="Manual Executions Test" tests="1">\n';
  xml += '    <testcase classname="ManualTest" name="Successful login with valid credentials" time="1.0">\n';
  xml += '      <properties>\n';
  xml += '        <property name="storykey" value="CPDSS-1"/>\n';
  xml += '      </properties>\n';
  xml += '    </testcase>\n';
  xml += '  </testsuite>\n';
  xml += '</testsuites>\n';

  try {
    const initResponse = await axios.post(`${baseUrl}/rest/api/automation/importresult`, {
      format: 'junit',
      isZip: false,
      fields: {
        testCycle: {
          summary: 'sprint1', // Targeting the existing sprint cycle!
          project: {
            id: parseInt(projectId, 10)
          }
        }
      }
    }, {
      headers: {
        'apiKey': token,
        'apikey': token,
        'Content-Type': 'application/json'
      }
    });

    console.log("INIT SUCCESS:", initResponse.status, initResponse.data);
    const { url: uploadUrl, trackingId } = initResponse.data;

    // Upload XML payload to S3 pre-signed URL
    console.log("Uploading XML payload to S3 pre-signed URL...");
    const uploadResponse = await axios.put(uploadUrl, xml, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    console.log("UPLOAD SUCCESS:", uploadResponse.status);
    console.log("Tracking ID:", trackingId);
  } catch (error) {
    console.error("FAILED:", error.response?.status, error.response?.data || error.message);
  }
}

run();
