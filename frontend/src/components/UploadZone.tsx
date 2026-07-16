import React, { useState, useRef } from "react";
import { Upload, FileText, Image, Presentation, Loader2, Check, AlertCircle, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DocumentItem } from "../types";

interface UploadZoneProps {
  onUploadSuccess: (doc: DocumentItem) => void;
  uploadedDocs: DocumentItem[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  accessToken?: string;
  hideList?: boolean;
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

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
    "image/webp",
    "text/plain",
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndUploadFile = async (file: File) => {
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".pptx") && !file.name.endsWith(".docx")) {
      setErrorMessage("Unsupported file type. Please upload a PDF, DOCX, PPTX, Image, or Text file.");
      setUploadState("error");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File exceeds 25MB limit.");
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setProgress(15);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate a gradual upload progress transition
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            setUploadState("parsing");
            return 80;
          }
          return prev + 15;
        });
      }, 150);

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Upload failed");
      }

      const docItem: DocumentItem = await response.json();
      onUploadSuccess(docItem);
      
      // Clean up state
      setTimeout(() => {
        setUploadState("idle");
        setProgress(0);
      }, 600);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Connection to API server failed.");
      setUploadState("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    if (mimeType.includes("pdf")) return <FileText className="w-5 h-5 text-rose-400" />;
    if (mimeType.includes("word") || filename.endsWith(".docx")) return <FileText className="w-5 h-5 text-blue-400" />;
    if (mimeType.includes("presentation") || filename.endsWith(".pptx")) return <Presentation className="w-5 h-5 text-amber-400" />;
    if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
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
            ? "border-[#c0ff52]/60 bg-[#c0ff52]/5 shadow-[0_0_20px_rgba(192,255,82,0.1)]"
            : "border-slate-800 bg-bg-surface-raised/40 hover:border-slate-700 hover:bg-bg-surface-raised/60"
        }`}
        style={{
          backgroundImage: 'radial-gradient(rgba(192, 255, 82, 0.08) 1.5px, transparent 1.5px)',
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
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-[#c0ff52] shadow-inner">
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
                    <>or <span className="text-[#c0ff52] underline font-semibold">browse local files</span></>
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
                <Loader2 className="w-10 h-10 text-[#c0ff52] animate-spin" />
                <span className="absolute text-[9px] font-mono text-[#c0ff52] font-semibold">
                  {progress}%
                </span>
              </div>
              <div className="w-full text-center">
                <p className="text-xs font-semibold text-[#c0ff52]">
                  {uploadState === "uploading" ? "Uploading Document..." : "Analyzing & Summarizing..."}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  AI is parsing context and extracting structure
                </p>
              </div>
              {/* Progress track */}
              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <motion.div
                  className="bg-[#c0ff52] h-full"
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-2 text-rose-400 p-1"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertCircle className="w-10 h-10 text-rose-500 animate-bounce" />
              <div>
                <p className="text-xs font-bold">Analysis Failed</p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 max-w-xs leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <button
                id="retry-upload-btn"
                onClick={triggerFileInput}
                className="mt-1 text-[9px] font-semibold bg-rose-950/40 border border-rose-800 px-2.5 py-1 rounded-lg text-rose-300 hover:bg-rose-900/40 transition-colors"
              >
                Choose Another File
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Uploaded Documents List */}
      {!hideList && (
        <div className="flex-1 flex flex-col gap-2 min-h-[160px]" id="uploaded-documents-list">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
            Recent Uploads
          </h3>
          {uploadedDocs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-slate-800/10 border border-slate-800/40 p-4 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                No files ingested yet. Drop files above to evaluate.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
              {uploadedDocs.map((doc) => {
                const isActive = doc.id === activeDocId;
                return (
                  <button
                    id={`doc-item-${doc.id}`}
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`flex items-center justify-between text-left p-2 rounded-lg border transition-all duration-200 ${
                      isActive
                        ? "bg-slate-800 border-sky-500 text-white shadow-md shadow-sky-500/5"
                        : "bg-slate-800/30 border-slate-700/40 text-slate-300 hover:bg-slate-850 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="flex-shrink-0 w-8 h-8 rounded bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                        {getFileIcon(doc.mimeType, doc.name)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-medium truncate pr-1 text-slate-200">
                          {doc.name}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                          {formatSize(doc.size)} • {doc.summary.fileStats?.pages || "1"} {parseInt(doc.summary.fileStats?.pages || "1") === 1 ? "page" : "pages"}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
