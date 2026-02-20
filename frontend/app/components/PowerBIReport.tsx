"use client";

import React, { useEffect, useState } from "react";
import { PowerBIEmbed } from "powerbi-client-react";
import { models, Report, Embed } from "powerbi-client";
import { Loader2, AlertCircle } from "lucide-react";
import api from "../lib/api";

// Type for the selected data from Power BI click events
interface SelectedDataPoint {
    visualName?: string;
    dataPoints: {
        identity: { target: { column: string; table: string }; equals: any }[];
        values?: { formattedValue: string; value: any }[];
    }[];
}

const PowerBIReport = ({
    refreshKey,
    filters,
    reportId,
    mode,
    aiQuestion,
    onDataSelected
}: {
    refreshKey?: number;
    filters?: any[];
    reportId?: string;
    aiQuestion?: string;
    mode?: "report" | "qna";
    onDataSelected?: (data: SelectedDataPoint) => void;
}) => {
    const [config, setConfig] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [embedStatus, setEmbedStatus] = useState<string>("Initializing...");
    const [report, setReport] = useState<Report | null>(null);


    // 👇 State to hold the clicked data
    const [selectedData, setSelectedData] = useState<SelectedDataPoint | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                console.log("🔵 [PowerBI] Fetching embed configuration...");
                setEmbedStatus("Establishing secure handshake...");
                setLoading(true);

                // For Q&A we just need the dataset ID usually, but report embedding works too if datasets are bound
                const response = await api.get("/api/analytics/embed-config", {
                    params: {
                        t: Date.now(),
                        reportId: reportId
                    }
                });

                setConfig(response.data);
                setLoading(false);
            } catch (err: any) {
                console.error("❌ [PowerBI] Failed to fetch config:", err);
                const detailedError = err.response?.data?.error || err.response?.data?.details || err.message;
                setError(`Configuration Error: ${detailedError}`);
                setLoading(false);
            }
        };

        fetchConfig();
    }, [refreshKey, mode]); // Re-fetch/Re-init if mode changes

    useEffect(() => {
        const applyFilters = async () => {
            // Only apply filters in report mode
            if (mode === 'qna') return;

            if (filters && filters.length > 0 && report) {
                try {
                    console.log("🔵 [PowerBI] Applying filters:", filters);
                    // Ensure report is still valid and has setFilters method
                    if (typeof report.setFilters === 'function') {
                        await report.setFilters(filters);
                        console.log("✅ [PowerBI] Filters applied successfully");
                    } else {
                        console.warn("⚠️ [PowerBI] report object does not support setFilters");
                    }
                } catch (err) {
                    console.error("❌ [PowerBI] Failed to apply filters:", err);
                }
            } else if (filters && filters.length > 0 && !report) {
                console.log("🟠 [PowerBI] Filters pending - waiting for report initialization...");
            }
        };
        applyFilters();
    }, [filters, report, mode]);


    // ✅ Handler called when user clicks a data point
    const handleDataSelected = (event: any) => {
        const detail = event?.detail;

        if (!detail || !detail.dataPoints?.length) {
            console.log("ℹ️ [PowerBI] Click detected but no data point selected.");
            setSelectedData(null);
            return;
        }

        const parsed: SelectedDataPoint = {
            visualName: detail.visual?.name,
            dataPoints: detail.dataPoints.map((dp: any) => ({
                identity: dp.identity,
                values: dp.values,
            })),
        };

        console.log("🟢 [PowerBI] Data selected:", parsed);
        setSelectedData(parsed);

        // Notify parent of the selection
        if (onDataSelected) {
            onDataSelected(parsed);
        }

        // 👇 You can also extract specific values like this:
        parsed.dataPoints.forEach((dp) => {
            dp.identity.forEach((id) => {
                console.log(`Table: ${id.target.table}, Column: ${id.target.column}, Value: ${id.equals}`);
            });
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 glass-card rounded-none min-h-[500px]">
                <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{embedStatus}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center text-center p-12 glass-card border-red-500/20 rounded-none">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <h4 className="text-white text-xl font-bold mb-2">Sync Error</h4>
                <p className="text-slate-400 text-xs mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/5 text-white text-[10px] font-black uppercase rounded-xl border border-white/10">Retry</button>
            </div>
        );
    }

    const embedConfig = {
        type: mode || "report",
        id: config.reportId,
        embedUrl: config.embedUrl,
        accessToken: config.embedToken,
        tokenType: models.TokenType.Embed,
        permissions: models.Permissions.All,
        viewMode: models.ViewMode.Edit,
        question: aiQuestion, // Pass the question for Q&A mode
        datasetIds: [config.datasetId], // Q&A often requires datasetId specifically
        settings: {
            panes: {
                filters: { expanded: false, visible: true },
                pageNavigation: { visible: true },
                fields: { visible: true },
                visualizations: { visible: true },
            },
            background: models.BackgroundType.Transparent,
        },
    };

    return (
        <div className="rounded-none overflow-hidden bg-background-main h-[600px] relative group flex flex-col">
            <div className="flex-1 relative pt-0">
                <PowerBIEmbed
                    key={refreshKey ? `report-${refreshKey}-${mode}` : `report-${mode}`}
                    embedConfig={embedConfig}
                    eventHandlers={
                        new Map([
                            ["loaded", () => console.log("✅ [PowerBI] Report loaded")],
                            ["rendered", () => console.log("✅ [PowerBI] Report rendered")],
                            ["error", (event: any) => {
                                console.error("❌ [PowerBI] Error:", event.detail);
                                // Log detailed properties if they exist
                                if (event.detail && typeof event.detail === 'object') {
                                    console.error("🔍 [PowerBI] Detailed Error:", JSON.stringify(event.detail, null, 2));
                                }
                            }],

                            // ✅ This fires when user clicks a data point (bar, slice, row, etc.)
                            ["dataSelected", handleDataSelected],
                        ])
                    }
                    cssClassName="w-full h-full"
                    getEmbeddedComponent={(embeddedReport: Embed) => {
                        console.log("🔵 [PowerBI] Report instance captured");
                        setReport(embeddedReport as Report);
                        (window as any).report = embeddedReport as Report; // Keep for legacy/debug
                    }}
                />
            </div>
        </div>
    );
};

export default PowerBIReport;
