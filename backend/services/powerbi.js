const axios = require("axios");
const msal = require("@azure/msal-node");

class PowerBIService {
    constructor() {
        this.workspaceId = process.env.POWERBI_WORKSPACE_ID?.trim();
        this.reportId = process.env.POWERBI_REPORT_ID?.trim();
        this.tenantId = process.env.POWERBI_TENANT_ID?.trim();
        this.clientId = process.env.POWERBI_CLIENT_ID?.trim();
        this.clientSecret = process.env.POWERBI_CLIENT_SECRET?.trim();

        this.msalConfig = {
            auth: {
                clientId: this.clientId,
                authority: `https://login.microsoftonline.com/${this.tenantId}`,
                clientSecret: this.clientSecret,
            }
        };

        this.cca = new msal.ConfidentialClientApplication(this.msalConfig);

        // Cache variables
        this.tokenCache = {
            token: null,
            expires: 0
        };
        this.datasetCache = {}; // name -> id
    }

    async getAccessToken() {
        // Simple in-memory cache
        const now = Date.now();
        if (this.tokenCache.token && this.tokenCache.expires > now + 60000) {
            return this.tokenCache.token;
        }

        console.log("[PowerBI] Acquiring new access token...");
        const clientCredentialRequest = {
            scopes: ["https://analysis.windows.net/powerbi/api/.default"],
        };
        const response = await this.cca.acquireTokenByClientCredential(clientCredentialRequest);

        this.tokenCache = {
            token: response.accessToken,
            expires: response.expiresOn.getTime()
        };

        return response.accessToken;
    }

    async getDatasetIdByName(datasetName, accessToken) {
        if (this.datasetCache[datasetName]) {
            return this.datasetCache[datasetName];
        }

        try {
            const client = axios.create({ headers: { Authorization: `Bearer ${accessToken}` } });
            const datasetsRes = await client.get(`https://api.powerbi.com/v1.0/myorg/groups/${this.workspaceId}/datasets`);
            const dataset = datasetsRes.data.value.find(d => d.name === datasetName);

            if (dataset) {
                this.datasetCache[datasetName] = dataset.id;
                return dataset.id;
            }
            return null;
        } catch (error) {
            console.error("Error finding dataset:", error.message);
            return null;
        }
    }

    async getEmbedConfig() {
        console.log("[PowerBI] ========================================");
        console.log("[PowerBI] Fetching Embed Config...");
        console.log("[PowerBI] Workspace ID:", this.workspaceId);
        console.log("[PowerBI] Report ID:", this.reportId);
        console.log("[PowerBI] Tenant ID:", this.tenantId);
        console.log("[PowerBI] Client ID:", this.clientId);
        console.log("[PowerBI] ========================================");

        const startTime = Date.now();
        let accessToken;
        try {
            console.log("[PowerBI] Step 1: Acquiring access token...");
            accessToken = await this.getAccessToken();
            console.log("[PowerBI] ✅ Access token acquired");

            // Run these in parallel to save time
            console.log("[PowerBI] Step 2: Fetching report details and dataset...");
            const [reportResponse, uploadedDatasetId] = await Promise.all([
                axios.get(
                    `https://api.powerbi.com/v1.0/myorg/groups/${this.workspaceId}/reports/${this.reportId}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                ),
                this.getDatasetIdByName("User Uploaded Data", accessToken)
            ]);

            const report = reportResponse.data;

            // CRITICAL FIX: Always trust the Report's current binding. 
            // If we use uploadedDatasetId (which might be a new dataset), but the report 
            // is still bound to the OLD dataset (rebind failed or hasn't run), the token will be invalid.
            const finalDatasetId = report.datasetId;

            console.log(`[PowerBI] ✅ Report fetched: ${report.name}`);
            console.log(`[PowerBI] Report is bound to Dataset: ${report.datasetId}`);
            if (uploadedDatasetId && uploadedDatasetId !== report.datasetId) {
                console.warn(`[PowerBI] ⚠️  MISMATCH DETECTED: Report thinks it uses ${report.datasetId}, but 'User Uploaded Data' ID is ${uploadedDatasetId}.`);
                console.warn(`[PowerBI] Using Report's binding (${report.datasetId}) to ensure stability.`);
            }

            // 3. Get Embed Token (Include dataset for Q&A support and ReadWrite for editing)
            console.log("[PowerBI] Step 3: Generating embed token with EDIT permissions...");
            const tokenResponse = await axios.post(
                `https://api.powerbi.com/v1.0/myorg/groups/${this.workspaceId}/reports/${this.reportId}/GenerateToken`,
                {
                    accessLevel: "Edit",
                    datasets: [{ id: finalDatasetId }],
                    allowSaveAs: true
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            console.log(`[PowerBI] ✅ Embed token generated with EDIT permissions (expires: ${tokenResponse.data.expiration})`);
            console.log(`[PowerBI] ✅ Config fetched in ${Date.now() - startTime}ms`);
            console.log("[PowerBI] ========================================");

            return {
                reportId: report.id,
                reportName: report.name,
                embedUrl: report.embedUrl,
                qnaEmbedUrl: `https://app.powerbi.com/qnaEmbed?groupId=${this.workspaceId}`,
                embedToken: tokenResponse.data.token,
                expiry: tokenResponse.data.expiration,
                datasetId: finalDatasetId
            };
        } catch (error) {
            console.error("[PowerBI] ❌ Failed to get embed config:");
            console.error("[PowerBI] Error details:", error.response?.data || error.message);
            console.error("[PowerBI] Status:", error.response?.status);

            if (error.response?.status === 404) {
                console.error("[PowerBI] 404 detected. Starting deep diagnostic...");
                let diagnosticMsg = "";

                try {
                    // 1. Check if we can see the Workspace at all
                    console.log("[PowerBI] Checking access to workspaces...");
                    const groupsRes = await axios.get(
                        `https://api.powerbi.com/v1.0/myorg/groups`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                    const groups = groupsRes.data.value;
                    const targetGroup = groups.find(g => g.id === this.workspaceId);

                    if (!targetGroup) {
                        diagnosticMsg += `\n❌ CRITICAL PERMISSION ERROR:\n` +
                            `The Service Principal is NOT a member of the configured Workspace (${this.workspaceId}).\n` +
                            `It expects to be in workspace: ${this.workspaceId}\n` +
                            `But it only has access to: ${groups.length > 0 ? groups.map(g => g.name).join(", ") : "NO WORKSPACES"}.\n\n` +
                            `SOLUTION: Go to Power BI -> Workspace -> 'Manage Access' -> Add Service Principal as Admin/Member.`;
                    } else {
                        diagnosticMsg += `\n✅ Access to Workspace '${targetGroup.name}' is CONFIRMED.\n`;

                        // 2. If we have access, why no reports?
                        const reportsRes = await axios.get(
                            `https://api.powerbi.com/v1.0/myorg/groups/${this.workspaceId}/reports`,
                            { headers: { Authorization: `Bearer ${accessToken}` } }
                        );
                        const reports = reportsRes.data.value;

                        if (reports.length === 0) {
                            // Enhanced Diagnostic: Check datasets too
                            const dsRes = await axios.get(
                                `https://api.powerbi.com/v1.0/myorg/groups/${this.workspaceId}/datasets`,
                                { headers: { Authorization: `Bearer ${accessToken}` } }
                            );
                            const datasets = dsRes.data.value;

                            diagnosticMsg += `\n⚠️ BUT the workspace is EMPTY (0 reports found via generic list).\n` +
                                `Datasets visible: ${datasets.length} ` + (datasets.length > 0 ? `(${datasets.map(d => d.name).join(', ')})` : '(None)') + `.\n`;

                            // Deep search removed to prevent 404s
                            diagnosticMsg += `\nDid you verify the Report ID '${this.reportId}'?\nMake sure you have published the report to THIS workspace, not 'My Workspace'.`;

                            diagnosticMsg += `\nDid you verify the Report ID '${this.reportId}'?\nMake sure you have published the report to THIS workspace, not 'My Workspace'.`;
                        } else {
                            const foundReport = reports.find(r => r.id === this.reportId);
                            if (foundReport) {
                                diagnosticMsg += `\n✅ Report found! ID matches. This 404 is very strange (possibly dataset issue?).`;
                            } else {
                                diagnosticMsg += `\n❌ Report ID MISMATCH:\n` +
                                    `Configured ID: ${this.reportId}\n` +
                                    `Available Reports:\n${reports.map(r => `- ${r.name} (${r.id})`).join("\n")}`;
                            }
                        }
                    }

                } catch (diagErr) {
                    diagnosticMsg += `\nDiagnostic failed: ${diagErr.message}`;
                }

                const errorMsg = `** CONNECTION FAILED (Analysis Mode) **\n${diagnosticMsg}`;
                console.error("[PowerBI]", errorMsg);
                throw new Error(errorMsg);
            }

            if (error.response?.status === 401) {
                const errorMsg = `Authentication Failed (401).\n` +
                    `There are two likely causes:\n` +
                    `1. **Invalid Client Secret**: Double check the secret in your .env file.\n` +
                    `2. **Tenant Settings**: Go to Power BI Admin Portal -> Tenant Settings -> Developer settings -> 'Allow service principals to use Power BI APIs'. ENABLE it.\n` +
                    `3. **Wrong Tenant ID**: Ensure the Tenant ID matches your Azure setup.`;
                console.error("[PowerBI]", errorMsg);
                throw new Error(errorMsg);
            }

            if (error.response?.status === 403) {
                const errorMsg = `Access Denied (403).\n\n` +
                    `The Service Principal does not have access to this workspace.\n` +
                    `Please add the Service Principal (${this.clientId}) to the workspace as a Member or Admin.\n\n` +
                    `Steps:\n` +
                    `1. Go to https://app.powerbi.com\n` +
                    `2. Open workspace settings\n` +
                    `3. Add the Service Principal with proper permissions`;
                console.error("[PowerBI]", errorMsg);
                throw new Error(errorMsg);
            }

            throw new Error(error.response?.data?.error?.message || error.message);
        }
    }

    async pushDataToPowerBI(datasetName, tableName, data) {
        console.log(`[PowerBI] ========================================`);
        console.log(`[PowerBI] Pushing ${data.length} rows to ${datasetName}...`);

        try {
            const accessToken = await this.getAccessToken();
            const client = axios.create({
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const datasetsUrl = `https://api.powerbi.com/v1.0/myorg/groups/${this.workspaceId}/datasets`;

            // 1. Identify OLD dataset (to delete later) to avoid "dead" report binding
            console.log("[PowerBI] Step 1: Identifying old dataset to clean up LATER...");
            const datasetsRes = await client.get(datasetsUrl);
            const oldDatasets = datasetsRes.data.value.filter(d => d.name === datasetName);
            console.log(`[PowerBI] Found ${oldDatasets.length} old dataset(s) with name '${datasetName}'`);

            // 2. CREATE brand new dataset FIRST (Zero Downtime Strategy)
            console.log("[PowerBI] Step 2: Creating NEW dataset with fresh schema...");

            // Define schema based on first row of NEW data
            const columns = Object.keys(data[0] || {}).map(key => ({
                name: key,
                dataType: typeof data[0][key] === 'number' ? 'Double' : 'String'
            }));

            const createRes = await client.post(datasetsUrl, {
                name: datasetName,
                defaultMode: "Push",
                tables: [{
                    name: tableName,
                    columns: columns
                }]
            });
            const newDataset = createRes.data;
            console.log(`[PowerBI] ✅ New dataset created: ${newDataset.id}`);

            this.datasetCache[datasetName] = newDataset.id;

            // 3. Add NEW data to the brand new dataset
            console.log("[PowerBI] Step 3: Pushing rows to new dataset...");
            await client.post(`${datasetsUrl}/${newDataset.id}/tables/${tableName}/rows`, {
                rows: data
            });
            console.log("[PowerBI] ✅ Data pushed successfully");

            // 4. REBIND the Power BI report to use the new dataset
            console.log("[PowerBI] Step 4: Rebinding report to new dataset...");
            await client.post(
                `https://api.powerbi.com/v1.0/myorg/groups/${this.workspaceId}/reports/${this.reportId}/Rebind`,
                { datasetId: newDataset.id },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            console.log(`[PowerBI] ✅ Report rebound to new dataset: ${newDataset.id}`);

            // 5. DELETE old datasets (Cleanup)
            console.log("[PowerBI] Step 5: Cleaning up old datasets...");
            for (const oldDs of oldDatasets) {
                // Don't delete the one we just created!
                if (oldDs.id !== newDataset.id) {
                    try {
                        await client.delete(`${datasetsUrl}/${oldDs.id}`);
                        console.log(`[PowerBI] 🗑️  Deleted old dataset: ${oldDs.id}`);
                    } catch (e) {
                        console.warn(`[PowerBI] Cleanup warning: ${e.message}`);
                    }
                }
            }

            console.log("[PowerBI] ✅ Process Complete. Report ID remains STATIC.");
            console.log("[PowerBI] ========================================");
            return { success: true, message: "Data refreshed successfully" };

        } catch (error) {
            console.error("[PowerBI] ❌ Push failed:", error.response?.data || error.message);
            console.error("[PowerBI] ========================================");
            return { success: false, message: error.message };
        }
    }
}

module.exports = new PowerBIService();
