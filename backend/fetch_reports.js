require('dotenv').config();
const axios = require("axios");
const msal = require("@azure/msal-node");

const workspaceId = process.env.POWERBI_WORKSPACE_ID;
const tenantId = process.env.POWERBI_TENANT_ID;
const clientId = process.env.POWERBI_CLIENT_ID;
const clientSecret = process.env.POWERBI_CLIENT_SECRET;

const msalConfig = {
    auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret: clientSecret,
    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
    const clientCredentialRequest = {
        scopes: ["https://analysis.windows.net/powerbi/api/.default"],
    };
    const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
    return response.accessToken;
}

async function listReports() {
    try {
        const accessToken = await getAccessToken();
        console.log(`Fetching reports for Workspace: ${workspaceId}`);

        const response = await axios.get(
            `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log("Reports found:", response.data.value.length);
        if (response.data.value.length > 0) {
            console.log("First Report ID:", response.data.value[0].id);
            console.log("First Report Name:", response.data.value[0].name);
            console.log(JSON.stringify(response.data.value, null, 2));
        } else {
            console.log("No reports found in this workspace.");
        }

    } catch (error) {
        console.error("Error fetching reports:", error.response?.data || error.message);
    }
}

listReports();
