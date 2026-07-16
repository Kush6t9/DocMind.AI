import React, { useState, useRef } from "react";
import { Upload, Check, Loader2, AlertCircle, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DocumentItem } from "../types";

interface UploadZoneProps {
  onUploadSuccess: (newDoc: DocumentItem) => void;
  uploadedDocs: DocumentItem[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  accessToken?: string;
  hideList?: boolean; // configuration prop to hide document list locally
}

export default function UploadZone({
  onUploadSuccess,
  uploadedDocs,
  activeDocId,
  onSelectDoc,
  accessToken,
  hideList = false,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "parsing" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (uploadState === "idle") {
      fileInputRef.current?.click();
    }
  };

  const handleUpload = async (file: File) => {
    setUploadState("uploading");
    setProgress(10);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate incremental upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      console.log("Posting file to backend /api/upload... size:", file.size);
      const response = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.detail || "Ingestion gateway server failure");
      }

      setProgress(100);
      setUploadState("parsing");

      const data = await response.json();
      console.log("File uploaded & ingested successfully:", data);

      // Trigger callback with DocumentItem
      onUploadSuccess({
        id: data.id,
        name: data.name,
        size: file.size,
        type: file.type,
        createdAt: new Date().toISOString(),
        driveViewLink: data.driveViewLink,
        summary: data.summary,
      });

      // Clear states
      setTimeout(() => {
        setUploadState("idle");
        setProgress(0);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setUploadState("error");
      setErrorMessage(err.message || "Failed to parse document structure.");
      setTimeout(() => {
        setUploadState("idle");
      }, 5000);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col gap-5 w-full h-full" id="upload-zone-container">
      {/* Drag & Drop Main Area */}
      <div
        id="drop-zone-interactive"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-5 text-center cursor-pointer transition-all duration-300 h-36 min-h-[9rem] w-full max-w-lg mx-auto ${
          isDragActive
            ? "border-sky-400/60 bg-sky-500/5 shadow-[0_0_20px_rgba(56,189,248,0.1)]"
            : "border-slate-800 bg-bg-surface-raised/20 hover:border-slate-700 hover:bg-bg-surface-raised/40"
        }`}
        style={{
          backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.08) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      >
        <input
          id="file-upload-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.txt"
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {uploadState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-sky-400 shadow-inner">
                {accessToken ? (
                  <Check className="w-6 h-6 text-emerald-400 animate-pulse-slow" />
                ) : (
                  <Upload className="w-6 h-6 animate-pulse-slow" />
                )}
              </div>
              <div>
                <p className="text-sm md:text-base font-bold text-slate-200">
                  {accessToken ? "Save directly to Google Drive" : "Drop PDF, PPTX or Image"}
                </p>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  {accessToken ? (
                    <span className="text-emerald-400 font-medium flex items-center justify-center gap-1">
                      Drive Sync Active (click to browse)
                    </span>
                  ) : (
                    <>or <span className="text-sky-400 underline font-semibold">browse local files</span></>
                  )}
                </p>
              </div>
              <p className="text-xs text-slate-500 max-w-[200px]">
                Max payload 25MB
              </p>
            </motion.div>
          )}

          {(uploadState === "uploading" || uploadState === "parsing") && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 w-full px-2"
              onClick={(e) => e.stopPropagation()} // stop file dialog triggering on background click
            >
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
                <span className="absolute text-[9px] font-mono text-sky-400 font-semibold">
                  {progress}%
                </span>
              </div>
              <div className="w-full text-center">
                <p className="text-xs font-semibold text-sky-400">
                  {uploadState === "uploading" ? "Uploading Document..." : "Analyzing & Summarizing..."}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  AI is parsing context and extracting structure
                </p>
              </div>
              {/* Progress track */}
              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <motion.div
                  className="bg-sky-450 h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          )}

          {uploadState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 max-w-[240px] px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-455">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-455">Ingestion Aborted</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal truncate max-w-[180px]">
                  {errorMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Ingestion List (Rendered optionally) */}
      {!hideList && uploadedDocs.length > 0 && (
        <div className="flex flex-col gap-2" id="uploaded-files-list">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-sky-400" /> Library Documents
          </h4>
          <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
            {uploadedDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                  activeDocId === doc.id
                    ? "bg-sky-500/10 border-sky-400/30 text-slate-200"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-sky-450 shrink-0" />
                  <span className="text-xs font-medium truncate max-w-[160px]">
                    {doc.name}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 shrink-0">
                  {formatBytes(doc.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
