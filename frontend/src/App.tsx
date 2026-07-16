import React, { useState } from "react";
import { Sparkles, FileText, BrainCircuit, Languages, File, MessageSquare, Menu, X, HelpCircle, Activity, Database, Server, ChevronRight, LogOut, CloudLightning } from "lucide-react";
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
  };

  // Application State
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  
  // Tab Navigation: 'summary' | 'chat' | 'quiz' | 'translate'
  const [activeTab, setActiveTab] = useState<"summary" | "chat" | "quiz" | "translate">("summary");

  // In-Memory Multi-Document States Cache
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [quizzesCache, setQuizzesCache] = useState<Record<string, QuizData>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Mobile drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Get active document
  const activeDoc = uploadedDocs.find((doc) => doc.id === activeDocId) || null;

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setUploadedDocs((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setActiveTab("summary"); // default to summary on fresh ingestion
  };

  const handleSelectDoc = (docId: string) => {
    setActiveDocId(docId);
    setIsMobileSidebarOpen(false); // close drawer on selection
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans leading-normal selection:bg-sky-500/30" id="main-app-container">
      
      {/* 1. Header (Bento Styled top rail) */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40" id="app-header">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm tracking-wider text-white uppercase font-mono">
            ANALYZER<span className="text-sky-400">.AI</span>
          </span>
          <span className="hidden md:inline px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400">
            v2.4.0-AWS_FARGATE
          </span>
        </div>

        {/* Telemetry Status Lights */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex gap-4 text-[10px] font-mono font-bold">
            {googleUser ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                DRIVE: CONNECTED
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                DRIVE: OFFLINE
              </span>
            )}
            <span className="text-slate-500 hidden sm:inline">DB: RDS_PROXY</span>
          </div>

          {/* Google Sign In / User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            {googleUser ? (
              <div className="flex items-center gap-2.5">
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name || "User Profile"}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-sky-400 font-bold font-mono">
                    {(googleUser.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">
                    {googleUser.name}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono leading-none">
                    {googleUser.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded bg-slate-800/60 hover:bg-red-950/20 hover:text-red-400 border border-slate-700 hover:border-red-900/50 text-slate-400 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                disabled={isVerifyingSession}
                onClick={() => login()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold font-sans tracking-tight transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <CloudLightning className="w-3.5 h-3.5 fill-current" />
                <span>{isVerifyingSession ? "Signing In..." : "Connect Drive"}</span>
              </button>
            )}
          </div>
          
          {/* Mobile menu trigger */}
          <button
            id="mobile-sidebar-toggle"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden w-8 h-8 border border-slate-700 bg-slate-800 rounded flex items-center justify-center text-slate-300"
            aria-label="Open sidebar drawer"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Bento Container Framework */}
      <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 md:p-6" id="workspace-frame">
        <div className="grid grid-cols-12 gap-4 h-full">
          
          {/* LEFT BENTO BLOCK: INGEST ENGINE (Desktop sidebar) */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col hidden md:flex" id="desktop-sidebar">
            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              uploadedDocs={uploadedDocs}
              activeDocId={activeDocId}
              onSelectDoc={handleSelectDoc}
              accessToken={accessToken || undefined}
            />
          </aside>

          {/* CENTER BENTO BLOCK: CENTRAL EVALUATION LAB */}
          <main className="col-span-12 md:col-span-8 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col overflow-hidden min-h-[550px]" id="workspace-main-content">
            <AnimatePresence mode="wait">
              {!activeDoc ? (
                // Pre-Ingested State: Technical Guidance
                <motion.div
                  key="welcome-screen"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-center max-w-md mx-auto text-left gap-6 py-4"
                >
                  <div>
                    <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      Ingestion Pending
                    </span>
                    <h2 className="text-base font-bold text-white mt-3 leading-snug">
                      Evaluate Multi-modal Ingestion
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      This sandbox performs real-time semantic structuring, synthesis and translation on documents via FastAPI and the Gemini-3.5 API.
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 gap-2.5" id="welcome-features-grid">
                    <div className="p-3 bg-slate-800/30 border border-slate-800/80 rounded-xl flex items-start gap-3">
                      <FileText className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Ingestion Summary</h4>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                          Parse paragraphs, extract numbers and compile action steps instantly.
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-800/30 border border-slate-800/80 rounded-xl flex items-start gap-3">
                      <MessageSquare className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Interactive Streaming</h4>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                          Query document logical paths with progressive stream chunks (SSE).
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-800/30 border border-slate-800/80 rounded-xl flex items-start gap-3">
                      <BrainCircuit className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Study Synthesizer</h4>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                          Auto-construct memory cards and multiple-choice practice modules.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] font-mono text-slate-500 italic">
                    * Standard file picker or drop zone active on the left sidebar.
                  </p>
                </motion.div>
              ) : (
                // Active Ingested Document State
                <motion.div
                  key="active-workspace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col gap-4"
                >
                  {/* Top Control Bar with Bento navigation buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3" id="workspace-navbar">
                    <div className="flex flex-wrap gap-1.5" id="workspace-tabs-group">
                      <button
                        id="tab-btn-summary"
                        onClick={() => setActiveTab("summary")}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          activeTab === "summary"
                            ? "bg-sky-400 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        SUMMARY
                      </button>
                      <button
                        id="tab-btn-chat"
                        onClick={() => setActiveTab("chat")}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          activeTab === "chat"
                            ? "bg-sky-400 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        CHAT
                      </button>
                      <button
                        id="tab-btn-quiz"
                        onClick={() => setActiveTab("quiz")}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          activeTab === "quiz"
                            ? "bg-sky-400 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        STUDY KIT
                      </button>
                      <button
                        id="tab-btn-translate"
                        onClick={() => setActiveTab("translate")}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          activeTab === "translate"
                            ? "bg-sky-400 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        TRANSLATE
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[160px]" title={activeDoc.name}>
                      REF: {activeDoc.name}
                    </span>
                  </div>

                  {/* Component Viewport */}
                  <div className="flex-1" id="workspace-content-viewport">
                    <AnimatePresence mode="wait">
                      {activeTab === "summary" && (
                        <motion.div
                          key="summary-tab-content"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          <DocumentSummary summary={activeDoc.summary} driveViewLink={activeDoc.driveViewLink} />
                        </motion.div>
                      )}

                      {activeTab === "chat" && (
                        <motion.div
                          key="chat-tab-content"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
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

                      {activeTab === "quiz" && (
                        <motion.div
                          key="quiz-tab-content"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          <QuizView
                            fileId={activeDoc.id}
                            quizData={activeQuizData}
                            onGenerateQuiz={handleGenerateQuiz}
                            isLoading={isGeneratingQuiz}
                          />
                        </motion.div>
                      )}

                      {activeTab === "translate" && (
                        <motion.div
                          key="translate-tab-content"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          <TranslationView
                            fileId={activeDoc.id}
                            onTranslate={handleTranslate}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* RIGHT BENTO BLOCK: TELEMETRY & SYSTEM ANALYTICS */}
          <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4" id="desktop-telemetry">
            
            {/* TILE 1: Ingestion Engine Analytics */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Ingestion Core
              </span>
              <div className="mt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Semantic Confidence</span>
                  <span className="font-mono text-sky-400 font-bold">{activeDoc ? "96%" : "0%"}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-1 mt-2 overflow-hidden">
                  <div
                    className="bg-sky-400 h-full transition-all duration-500"
                    style={{ width: activeDoc ? "96%" : "0%" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mt-1 text-slate-400 border-t border-slate-800 pt-2.5">
                <div>
                  <span className="block text-slate-500">Status</span>
                  <span className={activeDoc ? "text-emerald-400 font-bold" : "text-slate-400"}>
                    {activeDoc ? "ANALYZED" : "AWAITING"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500">Type</span>
                  <span>{activeDoc ? activeDoc.summary.documentType : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* TILE 2: Quick Operations Map */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Operation Matrix
              </span>
              <div className="flex flex-col gap-1.5 text-xs font-mono font-bold mt-1">
                <button
                  disabled={!activeDoc}
                  onClick={() => setActiveTab("chat")}
                  className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800 hover:border-slate-700 hover:text-sky-300 transition-colors disabled:opacity-40 disabled:hover:text-slate-400 text-left cursor-pointer"
                >
                  <span>ASK FILE GPT</span>
                  <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                </button>
                <button
                  disabled={!activeDoc}
                  onClick={() => setActiveTab("quiz")}
                  className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800 hover:border-slate-700 hover:text-sky-300 transition-colors disabled:opacity-40 disabled:hover:text-slate-400 text-left cursor-pointer"
                >
                  <span>SYNTHESIZE CARDS</span>
                  <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                </button>
                <button
                  disabled={!activeDoc}
                  onClick={() => setActiveTab("translate")}
                  className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800 hover:border-slate-700 hover:text-sky-300 transition-colors disabled:opacity-40 disabled:hover:text-slate-400 text-left cursor-pointer"
                >
                  <span>TRANSLATE SYSTEM</span>
                  <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* TILE 3: AWS Architecture Reference */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                AWS Sandbox Context
              </span>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-2.5 text-xs">
                  <Server className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 font-mono">DEPLOYMENT</span>
                    <span className="font-semibold text-slate-300">ECS Fargate Cluster</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs border-t border-slate-800 pt-2">
                  <Database className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 font-mono">DATABASE</span>
                    <span className="font-semibold text-slate-300">RDS Proxy (Aurora)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs border-t border-slate-800 pt-2">
                  <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 font-mono">REGION</span>
                    <span className="font-semibold text-slate-300">us-east-1 (N. Virginia)</span>
                  </div>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>

      {/* MOBILE DRAWER (For Uploads & File Workspace) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/75 z-50 md:hidden backdrop-blur-xs"
            />
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-slate-900 border-r border-slate-800 z-50 p-6 flex flex-col md:hidden gap-5 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                  Ingestion Workspace
                </span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <UploadZone
                  onUploadSuccess={handleUploadSuccess}
                  uploadedDocs={uploadedDocs}
                  activeDocId={activeDocId}
                  onSelectDoc={handleSelectDoc}
                  accessToken={accessToken || undefined}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
