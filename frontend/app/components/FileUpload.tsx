"use client";

import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle2, Loader2, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
    onUploadSuccess: (data: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "csv" || ext === "xlsx" || ext === "xls" || ext === "json") {
            setFile(file);
            setStatus("idle");
        } else {
            alert("Invalid file type. Please upload CSV, Excel, or JSON.");
        }
    };

    const uploadFile = async () => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            const result = await response.json();

            setStatus("success");
            onUploadSuccess(result);
        } catch (error) {
            console.error(error);
            setStatus("error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative border-2 border-dashed rounded-[2.5rem] p-16 transition-all duration-500 group/drop ${dragActive
                    ? "border-brand-primary bg-brand-primary/5 shadow-glow"
                    : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                    } ${file ? "border-emerald-500/30 bg-emerald-500/[0.02]" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleChange}
                    accept=".csv,.xlsx,.xls,.json"
                />

                <div className="flex flex-col items-center justify-center space-y-6 pointer-events-none relative z-0">
                    <div className={`p-6 rounded-[2rem] transition-all duration-500 ${dragActive ? "bg-brand-primary shadow-glow shadow-brand-primary/40 scale-110" : "bg-white/5"
                        }`}>
                        {uploading ? (
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        ) : status === "success" ? (
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        ) : (
                            <Upload className={`w-12 h-12 transition-all duration-500 ${dragActive ? "text-white rotate-12" : "text-slate-600 group-hover/drop:text-slate-400"
                                }`} />
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-xl font-black text-white tracking-tight mb-2">
                            {file ? file.name : "Inject Data Stream"}
                        </p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{file ? `Size: ${(file.size / 1024).toFixed(1)} KB` : "CSV, Excel, JSON - Max 50MB"}</p>
                    </div>

                    {!file && (
                        <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {file && status !== "success" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="mt-8 flex justify-center gap-4"
                    >
                        <button
                            onClick={() => { setFile(null); setStatus("idle"); }}
                            className="px-6 py-3 glass border-white/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                            Reset
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                uploadFile();
                            }}
                            disabled={uploading}
                            className="px-10 py-3 bg-brand-primary hover:bg-brand-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-glow shadow-brand-primary/20 disabled:opacity-50 flex items-center gap-3 active:scale-95"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <BarChart3 className="w-4 h-4 text-white" />}
                            {uploading ? "Analyzing Workspace..." : "Initialize Dashboard"}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FileUpload;
