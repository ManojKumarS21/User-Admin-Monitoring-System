"use client";

import React, { useEffect, useState } from "react";
import { PowerBIEmbed } from "powerbi-client-react";
import { models, Report, Qna, Embed } from "powerbi-client";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

// Extend window type for debugging
declare global {
    interface Window {
        report?: Report;
        qna?: Qna;
    }
}

const PowerBIReport = () => {
    const [config, setConfig] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [embedStatus, setEmbedStatus] = useState<string>("Initializing...");

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                console.log("🔵 [PowerBI] Fetching embed configuration...");
                setEmbedStatus("Fetching configuration from server...");
                setLoading(true);
                setError(null);

                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/embed-config`;
                console.log("🔵 [PowerBI] API URL:", url);

                // Add timestamp to prevent caching
                const timestamp = Date.now();
                const response = await fetch(`${url}?t=${timestamp}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });

                console.log("🔵 [PowerBI] Server response:", {
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log("✅ [PowerBI] Configuration received successfully:", {
                    reportId: data.reportId,
                    datasetId: data.datasetId,
                    hasToken: !!data.embedToken,
                    tokenExpires: data.embedToken ? "has expiration" : "no token"
                });

                setConfig(data);
                setLoading(false);
            } catch (err: any) {
                console.error("❌ [PowerBI] Failed to fetch config:", err);
                setError(`Configuration Error: ${err.message}`);
                setLoading(false);
            }
        };

        fetchConfig();
    }, []); // Empty dependency to run once on mount

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[3rem] min-h-[500px] border-none">
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-primary/20 blur-3xl animate-pulse" />
                    <Loader2 className="w-16 h-16 text-brand-primary animate-spin relative z-10" />
                </div>
                <p className="text-slate-400 mt-8 font-black tracking-[0.2em] uppercase text-[10px]">{embedStatus}</p>
                <div className="flex items-center gap-2 mt-4 text-slate-600">
                    <div className="w-1 h-1 bg-slate-700 rounded-full" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Secure Handshake in Progress</p>
                    <div className="w-1 h-1 bg-slate-700 rounded-full" />
                </div>
            </div>
        );
    }

    if (error) {
        const isPermissionError = error.toLowerCase().includes("reshare permissions");

        return (
            <div className="flex flex-col items-center text-center p-12 glass-card border-red-500/20 rounded-[3rem] h-full justify-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-glow shadow-red-500/5">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h4 className="text-white text-2xl font-black mb-3 tracking-tight">Integration Conflict</h4>
                <p className="text-slate-400 text-xs max-w-md leading-relaxed mb-8 font-mono bg-black/40 p-5 rounded-2xl border border-white/5 break-all">
                    {error}
                </p>

                {isPermissionError ? (
                    <div className="bg-brand-primary/5 p-8 rounded-3xl border border-brand-primary/10 max-w-lg mb-8">
                        <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">Protocol Resolution:</p>
                        <ol className="text-left text-slate-300 text-[11px] space-y-3 list-decimal list-inside font-medium leading-relaxed">
                            <li>Access <a href="https://app.powerbi.com" target="_blank" className="text-brand-primary underline underline-offset-4 pointer-events-auto">Power BI Portal</a></li>
                            <li>Navigate to **Workspace Settings** &rarr; **Manage Access**</li>
                            <li>Elevate `Service Principal` permissions to **Member**</li>
                            <li>Validate **API Access** in Tenant Admin settings</li>
                        </ol>
                    </div>
                ) : (
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 bg-red-500/5 px-6 py-2.5 rounded-full border border-red-500/10 mb-8 backdrop-blur-md">
                        Check Backend Logs & Azure Credentials
                    </div>
                )}

                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-premium"
                >
                    Retry Handshake
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-[3.2rem] overflow-hidden bg-background-main h-[600px] relative group flex flex-col border-none">
            {/* Control Bar - Sleek Glassy Overlay */}
            <div className="flex items-center justify-between px-8 py-4 bg-white/[0.02] backdrop-blur-md border-b border-border-subtle absolute top-0 left-0 w-full z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-brand-primary animate-ping opacity-40" />
                    </div>
                    <span className="text-[10px] text-brand-accent bg-brand-accent/10 px-4 py-1.5 rounded-full border border-brand-accent/20 font-black uppercase tracking-widest">
                        Interactive Mode Enabled
                    </span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    AI-Powered Analytics Stream
                </div>
            </div>

            <div className="flex-1 relative pt-[60px]">
                <PowerBIEmbed
                    key="report"
                    embedConfig={{
                        type: "report",
                        id: config.reportId,
                        embedUrl: config.embedUrl,
                        accessToken: config.embedToken,
                        tokenType: models.TokenType.Embed,
                        permissions: models.Permissions.All,
                        viewMode: models.ViewMode.Edit,
                        settings: {
                            panes: {
                                filters: { expanded: false, visible: true },
                                pageNavigation: { visible: true },
                                fields: { visible: true },
                                visualizations: { visible: true },
                            },
                            background: models.BackgroundType.Transparent,
                            navContentPaneEnabled: true,
                            filterPaneEnabled: true,
                            layoutType: models.LayoutType.Custom,
                            customLayout: {
                                displayOption: models.DisplayOption.FitToPage
                            },
                            bars: {
                                actionBar: { visible: true },
                            }
                        },
                    }}
                    eventHandlers={
                        new Map([
                            ['loaded', () => {
                                console.log('✅ [PowerBI] Report loaded successfully');
                                setEmbedStatus("Report ready");
                            }],
                            ['rendered', () => {
                                console.log('✅ [PowerBI] Report rendered successfully');
                                setEmbedStatus("Report fully rendered");
                            }],
                            ['error', (event: any) => {
                                console.error('❌ [PowerBI] Report error:', event.detail);
                                setError(`Report Error: ${JSON.stringify(event.detail)}`);
                            }],
                        ])
                    }
                    cssClassName="w-full h-full opacity-90 hover:opacity-100 transition-opacity duration-700"
                    getEmbeddedComponent={(embeddedReport: Embed) => {
                        window.report = embeddedReport as Report;
                    }}
                />

            </div>
        </div>
    );
};

export default PowerBIReport;
