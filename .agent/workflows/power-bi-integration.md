---
description: How the Power BI integration works (Data Processing to Embed)
---

# Power BI Integration Workflow

This document outlines the step-by-step process of how data is uploaded, processed, and visualized using Power BI.

## 1. Data Ingestion (Backend)
- **Endpoint**: `POST /api/analytics/upload`
- **Supported Formats**: CSV, XLSX, XLS, JSON.
- **Parsing**: 
    - CSV/Excel are converted to JSON arrays.
    - JSON is parsed and flattened to a single-level object structure.

## 2. Data Sanitization & Truncation
- **Key Sanitization**: Keys are modified to contain only alphanumeric characters and underscores (required by Power BI APIs).
- **Column Limit Enforcement**: 
    - Power BI Push Datasets have a hard limit of 75 columns.
    - The system enforces a **70-column safety limit**. 
    - Objects exceeding this are automatically truncated, and a `truncated: true` flag is returned.

## 3. Azure AD Authentication
- The backend uses the `msal` library with a **Service Principal** (Client ID, Client Secret, Tenant ID).
- An access token is acquired for the scope `https://analysis.windows.net/powerbi/api/.default`.

## 4. Power BI Dataset Operations
- **Method**: Real-Time "Push" Datasets.
- **Steps**:
    1. **Type Detection**: Inspects up to 100 rows to detect `Int64`, `Double`, or `String` types.
    2. **Dataset Creation**: Creates a new temporary dataset in the Workspace.
    3. **Push Rows**: Casts data to the detected types and pushes them in bulk to the Power BI API.
    4. **Global Rebind**: Programmatically rebinds the target Report to the newly created dataset. This ensures existing visuals immediate show the new data.

## 5. Frontend Embedding
- **Endpoint**: `GET /api/analytics/embed-config`
- **Config**: Returns `reportId`, `embedUrl`, and an **Embed Token** generated specifically for that report.
- **Rendering**: 
    - Uses the `powerbi-client` React library.
    - The report is rendered in a secure iframe with "Edit" or "View" permissions.

## 6. Error Handling
- **DNS/Connection**: Backend reports connectivity issues (e.g., `ENOTFOUND`) directly to the user.
- **Schema Errors**: Detailed API error responses are logged for debugging.
