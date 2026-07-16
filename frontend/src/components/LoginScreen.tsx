import React from "react";
import { motion } from "motion/react";
import { useGoogleLogin } from "@react-oauth/google";
import { CloudLightning, HardDrive, Sparkles, Shield, FileSearch, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (accessToken: string, userProfile: any) => void;
  isVerifying: boolean;
  setIsVerifying: (val: boolean) => void;
}

export default function LoginScreen({ onLoginSuccess, isVerifying, setIsVerifying }: LoginScreenProps) {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;
      setIsVerifying(true);
      try {
        console.log("Implicit login success from login page. Verifying session with backend...");
        const response = await fetch("/api/auth/session", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          onLoginSuccess(token, data.user);
        } else {
          console.error("Backend session verification failed from login page.");
          alert("We couldn't verify your Google session with our secure server. Please try again.");
        }
      } catch (err) {
        console.error("Auth session check failed:", err);
        alert("A network error occurred. Please verify your internet connection and try again.");
      } finally {
        setIsVerifying(false);
      }
    },
    onError: () => {
      console.error("Google OAuth login aborted or failed.");
    },
    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file",
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-sky-500/30 overflow-hidden relative" id="login-screen-root">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <header className="h-16 flex items-center justify-between px-6 md:px-12 bg-slate-900/10 backdrop-blur-sm border-b border-slate-900/40 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm tracking-wider text-white uppercase font-mono">
            DOCMIND<span className="text-sky-400">.AI</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 border border-slate-700/50 text-slate-400">
            v2.4.0-AWS_FARGATE
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          Gateway Online
        </div>
      </header>

      {/* Hero Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative z-10 justify-center">
        {/* Left Side: Product Value Propositions */}
        <div className="flex-1 text-left max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium font-mono mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-POWERED INTELLIGENT COMPANION</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none mb-6"
          >
            Smarter <span className="text-sky-400 bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Document</span> Analysis.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-slate-400 mb-8 leading-relaxed max-w-lg"
          >
            Securely login with your Google Account to automatically upload PDF, PPTX, and image files to your private Google Drive and extract deep semantic insights using Gemini.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-8"
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Google Drive Sync</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Saves all active documents directly to your own custom drive folder.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                <FileSearch className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Deep Extraction</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Understands slides, charts, complex paragraphs, and image structures.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Glass Login Bento Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative"
          id="login-bento-card"
        >
          {/* Top glowing ambient line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold mx-auto shadow-lg shadow-sky-500/10 mb-4">
              <CloudLightning className="w-6 h-6 fill-current" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Access Control Gate</h3>
            <p className="text-xs text-slate-500 mt-1">Authenticate via Google OAuth 2.0 to sync workspace and files</p>
          </div>

          <div className="space-y-4">
            <button
              disabled={isVerifying}
              onClick={() => login()}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer group"
              id="google-login-btn"
            >
              <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1c-6.076 0-11 4.924-11 11s4.924 11 11 11c6.34 0 10.553-4.453 10.553-10.743 0-.72-.077-1.272-.172-1.682H12.24z"/>
              </svg>
              <span>{isVerifying ? "Verifying Google Session..." : "Sign-in with Google"}</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 h-[1px] bg-slate-800" />
              <span className="text-[10px] font-mono text-slate-600 font-bold uppercase tracking-wider">SECURITY CLEARANCE</span>
              <div className="flex-1 h-[1px] bg-slate-800" />
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-slate-900/60 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-slate-300">Authorized App Scopes Only</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">We request isolated file scope (`drive.file`) which prevents the app from viewing any files you didn't create or upload here.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card footer details */}
          <div className="mt-8 pt-4 border-t border-slate-950 flex items-center justify-between text-[10px] font-mono text-slate-600">
            <span>SECURE AES-256</span>
            <span>GDPR COMPLIANT</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-900/40 px-6 flex items-center justify-between text-[10px] font-mono text-slate-500 relative z-10">
        <span>© 2026 DOCMIND.AI SYSTEM. ALL RIGHTS RESERVED.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300">PRIVACY</a>
          <a href="#" className="hover:text-slate-300">TERMS</a>
        </div>
      </footer>
    </div>
  );
}
