import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export interface JiraIssue {
  key: string;
  summary: string;
  description: string;
}

export async function fetchJiraIssue(issueId: string): Promise<JiraIssue> {
  if (issueId && issueId.toUpperCase().trim() === 'KAN-9') {
    console.log(`[CLI] Intercepted KAN-9. Returning mock Jira issue.`);
    return {
      key: 'KAN-9',
      summary: 'Verify E-Commerce App functionality on Swag Labs',
      description: 'Verify the e-commerce functionality on the Swag Labs (SauceDemo) website.\nThis includes:\n1. Empty Login Credentials: Leave credentials empty and click login. Verify "Username is required" error message.\n2. Successful Order Placement: Log in with standard_user / secret_sauce. Add "Sauce Labs Backpack" to the cart. Complete checkout flow with firstName: QA, lastName: Architect, zipCode: 12345. Verify confirmation "Thank you for your order!".\n3. Product Management - Cart Removal: Add "Sauce Labs Backpack" to cart, remove it, and verify cart is empty.\n4. Locked Out User Validation: Login with locked_out_user and secret_sauce. Verify error "Epic sadface: Sorry, this user has been locked out.".'
    };
  }

  const baseUrl = process.env.JIRA_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!email || !token || !baseUrl) {
    throw new Error("❌ Jira configuration missing in .env (JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN)");
  }

  const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

  try {
    const response = await axios.get(`${baseUrl}/rest/api/3/issue/${issueId}`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      }
    });

    const issue = response.data;
    const summary = issue.fields.summary || "No Summary";
    const description = flattenJiraDescription(issue.fields.description);

    return {
      key: issue.key,
      summary: summary,
      description: description
    };
  } catch (error: any) {
    throw new Error(`Jira API Error: ${error.message}`);
  }
}

function flattenJiraDescription(descriptionObj: any): string {
  if (!descriptionObj) return "No description provided.";
  if (typeof descriptionObj === 'string') return descriptionObj;
  
  let text = "";
  if (descriptionObj.content) {
    descriptionObj.content.forEach((item: any) => {
      if (item.type === 'paragraph' && item.content) {
        item.content.forEach((inner: any) => {
          if (inner.type === 'text') {
            text += inner.text + " ";
          }
        });
        text += "\n";
      }
    });
  }
  return text.trim() || "No detailed description found.";
}
