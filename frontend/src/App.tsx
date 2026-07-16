import React, { useState, useEffect } from "react";
import { Sparkles, FileText, BrainCircuit, Languages, File, MessageSquare, Menu, X, HelpCircle, Activity, Database, Server, ChevronRight, LogOut, CloudLightning, ChevronLeft, Eye, Bookmark, ArrowRight, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGoogleLogin } from "@react-oauth/google";

// Types
import { DocumentItem, ChatMessage, QuizData } from "./types";

// Components
import LoginScreen from "./components/LoginScreen";
import UploadZone from "./components/UploadZone";
import DocumentSummary from "./components/DocumentSummary";
import ChatInterface from "./components/ChatInterface";
import QuizView from "./components/QuizView";
import TranslationView from "./components/TranslationView";

export default function App() {
  // Google OAuth States
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);

  // Trigger implicit Google login flow with required scopes
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;
      setAccessToken(token);
      setIsVerifyingSession(true);
      try {
        console.log("Implicit Google login success. Verifying session with backend...");
        const response = await fetch("/api/auth/session", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setGoogleUser(data.user);
          console.log("Session verified. Google user profile loaded:", data.user?.email);
        } else {
          console.error("Backend session verification failed.");
        }
      } catch (err) {
        console.error("Auth session check failed:", err);
      } finally {
        setIsVerifyingSession(false);
      }
    },
    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file",
  });

  const handleLogout = () => {
    setAccessToken(null);
    setGoogleUser(null);
    setViewMode("library");
    setActiveDocId(null);
  };

  // Application State
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem("docmind_uploaded_docs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load saved library:", e);
      return [];
    }
  });
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  
  // Save files list changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("docmind_uploaded_docs", JSON.stringify(uploadedDocs));
    } catch (e) {
      console.error("Failed to persist library changes:", e);
    }
  }, [uploadedDocs]);
  
  // Navigation modes: 'library' | 'workspace'
  const [viewMode, setViewMode] = useState<"library" | "workspace">("library");

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<"summary" | "chat" | "keypoints" | "quiz" | "flashcards" | "translate" | "simplify">("chat");

  // In-Memory Multi-Document States Cache
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [quizzesCache, setQuizzesCache] = useState<Record<string, QuizData>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Get active document
  const activeDoc = uploadedDocs.find((doc) => doc.id === activeDocId) || null;

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    const docWithDate = {
      ...newDoc,
      createdAt: newDoc.createdAt || new Date().toISOString(),
      summary: newDoc.summary || {
        title: newDoc.name,
        documentType: "Document",
        executiveSummary: "Ingestion finished. Generating synopsis details...",
        keyTakeaways: [],
        actionItems: [],
        fileStats: { pages: "1", wordCount: "0", readingTime: "1 min" }
      }
    };
    setUploadedDocs((prev) => [docWithDate, ...prev]);
    setActiveDocId(newDoc.id);
    setViewMode("workspace");
    setActiveTab("chat"); // default to chat on workspace open
  };

  const handleSelectDoc = (docId: string) => {
    setActiveDocId(docId);
    setViewMode("workspace");
    setActiveTab("chat");
  };

  const handleOpenWorkspace = (docId: string) => {
    setActiveDocId(docId);
    setViewMode("workspace");
    setActiveTab("chat");
  };

  const handleDeleteDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docId));
    if (activeDocId === docId) {
      setActiveDocId(null);
      setViewMode("library");
    }
  };

  const handleBackToLibrary = () => {
    setViewMode("library");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleExportNotes = () => {
    if (!activeDoc) return;
    const docNameWithoutExtension = activeDoc.name.substring(0, activeDoc.name.lastIndexOf('.')) || activeDoc.name;
    const notesText = `
DocMind.ai - Document Summary
====================================
Title: ${activeDoc.summary?.title || activeDoc.name}
Document Type: ${activeDoc.summary?.documentType || "Document"}
Date: ${new Date().toLocaleDateString()}

Executive Summary:
------------------
${activeDoc.summary?.executiveSummary || "N/A"}

Key Takeaways:
--------------
${activeDoc.summary?.keyTakeaways?.map((t, idx) => `${idx + 1}. ${t}`).join('\n') || "None"}

Action Items:
-------------
${activeDoc.summary?.actionItems?.map((a, idx) => `- ${a}`).join('\n') || "None"}
    `.trim();

    const blob = new Blob([notesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${docNameWithoutExtension}_notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateQuiz = async () => {
    if (!activeDocId) return;
    setIsGeneratingQuiz(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers,
        body: JSON.stringify({ fileId: activeDocId }),
      });

      if (!response.ok) {
        throw new Error("Quiz generation server error");
      }

      const data: QuizData = await response.json();
      setQuizzesCache((prev) => ({
        ...prev,
        [activeDocId]: data,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to synthesize quiz questions. Please check connection.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleTranslate = async (lang: string): Promise<string | null> => {
    if (!activeDocId) return null;
    
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch("/api/translate", {
      method: "POST",
      headers,
      body: JSON.stringify({ fileId: activeDocId, targetLanguage: lang }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed");
    }

    const data = await response.json();
    return data.translatedText || null;
  };

  // Get chat history for current active document
  const currentChatHistory = activeDocId ? chatHistories[activeDocId] || [] : [];
  const setChatHistoryForActiveDoc = (
    updater: React.SetStateAction<ChatMessage[]>
  ) => {
    if (!activeDocId) return;
    setChatHistories((prev) => {
      const existing = prev[activeDocId] || [];
      const updated = typeof updater === "function" ? updater(existing) : updater;
      return {
        ...prev,
        [activeDocId]: updated,
      };
    });
  };

  const activeQuizData = activeDocId ? quizzesCache[activeDocId] || null : null;

  if (!googleUser) {
    return (
      <LoginScreen
        onLoginSuccess={(token, profile) => {
          setAccessToken(token);
          setGoogleUser(profile);
        }}
        isVerifying={isVerifyingSession}
        setIsVerifying={setIsVerifyingSession}
      />
    );
  }

  // --- LIBRARY VIEW MODE (Android 16 Minimal Style - Scroll-free viewport) ---
  if (viewMode === "library") {
    const totalDocs = uploadedDocs.length;
    const totalPages = uploadedDocs.reduce((acc, doc) => acc + parseInt(doc.summary?.fileStats?.pages || "1"), 0);
    const totalAIAnswers = Object.values(chatHistories).reduce((acc, history) => {
      return acc + history.filter(m => m.role === "model").length;
    }, 2); // default to 2

    return (
      <div className="h-screen w-screen bg-bg-base flex flex-col text-slate-100 font-sans leading-relaxed selection:bg-sky-500/20 overflow-hidden relative bg-grid" id="library-view-root">
        {/* Soft background layout glows */}
        <div className="absolute top-[5%] left-[10%] w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />

        {/* Brand Header */}
        <header className="h-16 shrink-0 border-b border-slate-900/60 flex items-center justify-between px-6 bg-bg-base/40 backdrop-blur-xl z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("library")}
              className="font-extrabold text-base tracking-tight text-white uppercase font-sans hover:opacity-90 active:scale-[0.98] cursor-pointer"
            >
              DocMind<span className="text-sky-400">.ai</span>
            </button>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-bg-surface border border-slate-800 text-slate-400">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            {googleUser && (
              <div className="flex items-center gap-2.5">
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-slate-800"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#12141c] border border-slate-800 flex items-center justify-center text-xs text-sky-400 font-bold font-sans">
                    {(googleUser.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-full bg-bg-surface hover:bg-rose-955/20 hover:text-rose-455 border border-slate-800 hover:border-rose-900/40 text-slate-455 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Library Scrollable Body */}
        <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6 relative z-10 max-h-[calc(100vh-4rem)]">
          <div className="max-w-[1200px] w-full mx-auto space-y-6">
            {/* Header Title */}
            <div className="text-left space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-white font-sans uppercase leading-none">
                THE LIBRARY<span className="text-sky-400">.</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-normal">
                Every document you feed DocMind becomes a living knowledge base — chat, quizzes, flashcards, translations and notes, one click away.
              </p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" id="library-stats-bar">
              {[
                { label: "DOCUMENTS", value: totalDocs, icon: FileText, isVanity: false },
                { label: "PAGES READ", value: totalPages, icon: File, isVanity: false },
                { label: "AI ANSWERS", value: totalAIAnswers, icon: BrainCircuit, isVanity: false },
                { label: "AVG RESPONSE", value: "419ms", icon: Sparkles, isVanity: true },
                { label: "SUCCESS RATE", value: "100%", icon: Activity, isVanity: true },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-bg-surface/30 backdrop-blur-md border border-slate-800/40 rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs transition-colors hover:border-slate-700 ${stat.isVanity ? 'opacity-70' : 'opacity-100'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${stat.isVanity ? 'text-slate-500' : 'text-sky-400'}`}>
                    <stat.icon className={`w-3.5 h-3.5 ${stat.isVanity ? 'text-slate-500' : 'text-sky-400'}`} />
                    {stat.label}
                  </span>
                  <span className={`font-extrabold leading-none ${stat.isVanity ? 'text-base text-slate-450' : 'text-xl text-white'}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Drag and Drop Container */}
            <div className="bg-bg-surface/20 backdrop-blur-xl border border-slate-800/40 rounded-2xl p-4 flex flex-col justify-center items-center shadow-xs">
              <UploadZone
                onUploadSuccess={handleUploadSuccess}
                uploadedDocs={uploadedDocs}
                activeDocId={activeDocId}
                onSelectDoc={handleSelectDoc}
                accessToken={accessToken || undefined}
                hideList={true}
              />
            </div>

            {/* Document Grid List */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ingested Documents
              </h3>
              {uploadedDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-bg-surface/10 backdrop-blur-md border border-slate-800 p-12 text-center">
                  <p className="text-xs text-slate-500 font-medium max-w-sm leading-relaxed">
                    No documents in your library yet. Upload documents using the dropzone above to begin analyzing.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-bg-surface/20 backdrop-blur-xl border border-slate-800/40 hover:border-sky-500/20 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 group shadow-xs relative"
                    >
                      {/* Top line with title and trash button */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4.5 h-4.5 text-sky-400 shrink-0" />
                            <h4 className="text-xs md:text-sm font-bold text-slate-100 truncate max-w-[180px]" title={doc.name}>
                              {doc.name}
                            </h4>
                          </div>
                          {/* De-emphasized delete button (×) */}
                          <button
                            onClick={(e) => handleDeleteDoc(doc.id, e)}
                            className="w-6 h-6 rounded-full bg-transparent hover:bg-rose-955/20 hover:text-rose-455 flex items-center justify-center text-slate-500 transition-all cursor-pointer"
                            title="Delete document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Info stats */}
                        <p className="text-[10px] text-slate-500 font-mono">
                          {doc.summary?.fileStats?.pages || "1"} pages • {doc.summary?.fileStats?.wordCount || "~" + (doc.summary?.executiveSummary || "").split(" ").length * 5} words • {formatBytes(doc.size)}
                        </p>

                        {/* Excerpt */}
                        <p className="text-xs text-slate-405 leading-normal font-normal line-clamp-3">
                          {doc.summary?.executiveSummary || ""}
                        </p>
                      </div>

                      {/* Open Workspace action (Secondary Outline button style) */}
                      <button
                        onClick={() => handleOpenWorkspace(doc.id)}
                        className="w-full bg-bg-surface-raised/40 border border-slate-700/60 hover:border-sky-500/20 text-slate-350 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      >
                        <span>Open workspace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- WORKSPACE VIEW MODE (Android 16 Minimal Style - Scroll-free viewport) ---
  return (
    <div className="h-screen w-screen bg-bg-base flex flex-col text-slate-100 font-sans leading-relaxed selection:bg-sky-500/20 overflow-hidden bg-grid" id="workspace-view-root">
      {/* Top bar */}
      <header className="h-16 shrink-0 border-b border-slate-900 flex items-center justify-between px-6 bg-bg-base/40 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("library")}
            className="font-extrabold text-base tracking-tight text-white uppercase font-sans hover:opacity-90 active:scale-[0.98] cursor-pointer mr-2"
          >
            DocMind<span className="text-sky-400">.ai</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mr-1" />

          <button
            onClick={handleBackToLibrary}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-surface hover:bg-bg-surface-raised border border-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Library</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Doc metadata */}
          <div className="flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-sky-400" />
            <div>
              <span className="text-xs md:text-sm font-bold text-slate-100 block leading-tight">{activeDoc?.name}</span>
              <span className="text-[10px] text-slate-500 font-mono block leading-none mt-0.5">
                {activeDoc?.summary?.fileStats?.pages || "1"}p • {activeDoc?.summary?.fileStats?.wordCount || "0"} words • engine: Local
              </span>
            </div>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          {activeDoc?.driveViewLink && (
            <a
              href={activeDoc.driveViewLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-surface hover:bg-bg-surface-raised border border-slate-800 text-slate-300 text-xs font-bold transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </a>
          )}
          <button
            onClick={handleExportNotes}
            className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-slate-955" />
            <span>Export notes</span>
          </button>
        </div>
      </header>

      {/* Tabs bar */}
      <div className="h-12 shrink-0 border-b border-slate-900 bg-bg-surface/30 backdrop-blur-xl px-6 py-1 flex items-center justify-start gap-1.5 overflow-x-auto select-none scrollbar-none" id="workspace-horizontal-tabs">
        {[
          { id: "chat", label: "Chat", icon: MessageSquare },
          { id: "summary", label: "Summary", icon: FileText },
          { id: "keypoints", label: "Key points", icon: Bookmark },
          { id: "quiz", label: "Quiz", icon: BrainCircuit },
          { id: "flashcards", label: "Flashcards", icon: GraduationCap },
          { id: "translate", label: "Translate", icon: Languages },
          { id: "simplify", label: "Simplify", icon: Sparkles },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const accentColors: Record<string, { bg: string; text: string; shadow: string; iconColor: string }> = {
            chat: { bg: "bg-sky-500", text: "text-slate-950", shadow: "shadow-sky-500/20", iconColor: "text-sky-400" },
            summary: { bg: "bg-teal-500", text: "text-slate-950", shadow: "shadow-teal-500/20", iconColor: "text-teal-400" },
            keypoints: { bg: "bg-indigo-500", text: "text-slate-950", shadow: "shadow-indigo-500/20", iconColor: "text-indigo-400" },
            quiz: { bg: "bg-orange-500", text: "text-slate-950", shadow: "shadow-orange-500/20", iconColor: "text-orange-450" },
            flashcards: { bg: "bg-purple-500", text: "text-slate-950", shadow: "shadow-purple-500/20", iconColor: "text-purple-400" },
            translate: { bg: "bg-cyan-500", text: "text-slate-950", shadow: "shadow-cyan-500/20", iconColor: "text-cyan-400" },
            simplify: { bg: "bg-amber-500", text: "text-slate-950", shadow: "shadow-amber-500/20", iconColor: "text-amber-400" }
          };
          const activeColor = accentColors[tab.id] || accentColors.chat;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? `${activeColor.bg} ${activeColor.text} shadow-md ${activeColor.shadow}`
                  : "text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-900/50"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? activeColor.text : "text-slate-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Viewport content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-h-[calc(100vh-7rem)]" id="workspace-viewport">
        <div className="max-w-[1000px] w-full mx-auto h-full">
          <AnimatePresence mode="wait">
            {activeTab === "summary" && activeDoc && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DocumentSummary summary={activeDoc.summary || {
                  title: activeDoc.name,
                  documentType: "Document",
                  executiveSummary: "",
                  keyTakeaways: [],
                  actionItems: [],
                  fileStats: {}
                }} driveViewLink={activeDoc.driveViewLink} />
              </motion.div>
            )}

            {activeTab === "chat" && activeDoc && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <ChatInterface
                  fileId={activeDoc.id}
                  fileName={activeDoc.name}
                  chatHistory={currentChatHistory}
                  setChatHistory={setChatHistoryForActiveDoc}
                  accessToken={accessToken || undefined}
                />
              </motion.div>
            )}

            {activeTab === "keypoints" && activeDoc && (
              <motion.div
                key="keypoints"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-bg-surface/20 backdrop-blur-xl border border-slate-800/40 rounded-3xl p-6 space-y-5"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
                  <Bookmark className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Logical Insights & Key Points</h2>
                </div>
                <div className="space-y-3">
                  {(activeDoc.summary?.keyTakeaways || []).map((takeaway, idx) => (
                    <div key={idx} className="flex gap-3.5 items-start p-3.5 bg-bg-surface-raised/20 backdrop-blur-xs border border-slate-800/50 rounded-2xl">
                      {/* Indigo Accent Numbered Circle */}
                      <span className="w-5.5 h-5.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-medium">{takeaway}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "quiz" && activeDoc && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <QuizView
                  fileId={activeDoc.id}
                  quizData={activeQuizData}
                  onGenerateQuiz={handleGenerateQuiz}
                  isLoading={isGeneratingQuiz}
                  defaultView="quiz"
                  hideTabSelectors={true}
                />
              </motion.div>
            )}

            {activeTab === "flashcards" && activeDoc && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <QuizView
                  fileId={activeDoc.id}
                  quizData={activeQuizData}
                  onGenerateQuiz={handleGenerateQuiz}
                  isLoading={isGeneratingQuiz}
                  defaultView="flashcards"
                  hideTabSelectors={true}
                />
              </motion.div>
            )}

            {activeTab === "translate" && activeDoc && (
              <motion.div
                key="translate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <TranslationView
                  fileId={activeDoc.id}
                  onTranslate={handleTranslate}
                />
              </motion.div>
            )}

            {activeTab === "simplify" && activeDoc && (
              <motion.div
                key="simplify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-bg-surface/20 backdrop-blur-xl border border-slate-800/40 rounded-3xl p-6 space-y-4"
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-900">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">Simplified Summary</h2>
                </div>
                <div className="p-4 bg-bg-surface/30 backdrop-blur-xs border border-slate-855 rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider">Simplified In 3 Bullets:</h4>
                  <div className="space-y-2.5">
                    {(activeDoc.summary?.keyTakeaways || []).slice(0, 3).map((takeaway, idx) => (
                      <div key={idx} className="flex gap-3.5 items-start p-2.5 bg-bg-surface-raised/20 backdrop-blur-xs border border-slate-800/50 rounded-2xl">
                        <span className="w-5.5 h-5.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 mt-0.5 shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-normal">{takeaway}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-bg-surface-raised/20 border border-slate-800 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-450 font-mono uppercase tracking-wider">Plain English Translation:</h4>
                  <p className="text-xs md:text-sm text-slate-400 leading-normal font-normal">
                    {(activeDoc.summary?.executiveSummary || "").split('.').slice(0, 3).join('.')}.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
