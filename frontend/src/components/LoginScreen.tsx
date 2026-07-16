import React from "react";
import { motion } from "motion/react";
import { useGoogleLogin } from "@react-oauth/google";
import { 
  CloudLightning, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Bot, 
  BrainCircuit, 
  GraduationCap, 
  Languages, 
  Bookmark, 
  Shield, 
  Cpu,
  ArrowRightLeft,
  CheckCircle,
  HelpCircle,
  Download
} from "lucide-react";

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
        console.log("Implicit login success from landing. Verifying session with backend...");
        const response = await fetch("/api/auth/session", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          onLoginSuccess(token, data.user);
        } else {
          console.error("Backend session verification failed.");
          alert("We couldn't verify your Google session. Please try again.");
        }
      } catch (err) {
        console.error("Auth session check failed:", err);
        alert("A network error occurred. Please try again.");
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
    <div className="h-screen w-screen bg-bg-base text-slate-100 font-sans selection:bg-sky-500/20 overflow-y-auto relative scroll-smooth bg-grid" id="landing-page-root">
      {/* Background ambient layout glows */}
      <div className="absolute top-[5%] left-[-10%] w-[50%] h-[50%] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* FIXED HEADER */}
      <header className="h-16 border-b border-slate-900/60 flex items-center justify-between px-8 bg-bg-base/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-955 font-bold font-sans">
            D
          </div>
          <button 
            onClick={() => document.getElementById("landing-page-root")?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-extrabold text-base tracking-tight text-white uppercase font-sans hover:opacity-90 active:scale-[0.98] cursor-pointer"
          >
            DocMind<span className="text-sky-400">.ai</span>
          </button>
        </div>

        {/* Navigation Bar Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-bg-surface/40 backdrop-blur-md border border-slate-850 rounded-full px-1.5 py-1">
          <a href="#toolkit" className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-350 hover:text-white transition-all">Product</a>
          <a href="#workflow" className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-350 hover:text-white transition-all">Workflow</a>
        </nav>

        {/* Action button */}
        <button
          onClick={() => login()}
          disabled={isVerifying}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-955 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
        >
          <span>{isVerifying ? "Verifying..." : "Launch app"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="min-h-[calc(100vh-4rem)] max-w-7xl w-full mx-auto px-8 py-12 flex flex-col lg:flex-row items-center gap-12 justify-center relative">
        {/* Left copy column */}
        <div className="flex-1 text-left space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-bold tracking-wide uppercase font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            DOCUMENT INTELLIGENCE, STREAMED LIVE
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-none uppercase font-sans">
            READ LESS.<br />
            KNOW<br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">EVERYTHING.</span>
          </h1>

          <p className="text-sm md:text-base text-slate-455 leading-relaxed max-w-xl font-normal">
            Upload any document and instantly understand it with AI — chat with it, summarize it, turn it into quizzes and flashcards, translate it, and extract the insights that matter. In seconds, not hours.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => login()}
              className="px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold text-sm transition-all cursor-pointer shadow-lg hover:shadow-sky-500/10 flex items-center gap-2 active:scale-95"
            >
              <span>Drop a PDF in</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <a
              href="#workflow"
              className="px-6 py-3 rounded-full border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white font-bold text-sm transition-all flex items-center justify-center"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Right side visualization: Interactive Chat Mockup */}
        <div className="flex-1 w-full max-w-lg bg-bg-surface/20 backdrop-blur-xl border border-slate-800/40 rounded-3xl p-6 shadow-2xl relative shrink-0">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3.5 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono text-slate-500">docmind · attention-paper.pdf</span>
            </div>
            <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded font-mono uppercase tracking-wider">
              ● LIVE
            </span>
          </div>

          <div className="space-y-4 min-h-[160px] flex flex-col justify-end">
            {/* User message */}
            <div className="self-end max-w-[85%] flex gap-2.5 flex-row-reverse items-start">
              <div className="w-7 h-7 rounded bg-bg-surface-raised/20 border border-slate-850 flex items-center justify-center text-xs text-slate-355 font-mono font-bold">
                U
              </div>
              <div className="bg-bg-surface-raised/30 border border-slate-800 rounded-2xl rounded-tr-none px-4 py-2.5 text-xs text-slate-200 leading-relaxed font-normal">
                What problem does this paper solve?
              </div>
            </div>

            {/* AI Response message */}
            <div className="self-start max-w-[90%] flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded bg-sky-500 flex items-center justify-center text-xs text-slate-950 font-bold">
                AI
              </div>
              <div className="bg-bg-surface-raised/10 backdrop-blur-xs border border-slate-800/60 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-300 leading-relaxed font-normal space-y-3">
                <p>
                  It attacks <span className="font-bold text-white underline decoration-sky-400 decoration-2">slow document comprehension</span> — readers lose hours parsing dense PDFs. The fix: extract → understand → test yourself. Summaries with citations ([13]), auto-generated quizzes and flashcards, all in under two seconds.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                    ✓ 6-question quiz ready
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-medium flex items-center gap-1">
                    ✓ 10 flashcards built
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-medium flex items-center gap-1">
                    ✓ Summary exported
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dummy Input bar */}
          <div className="mt-5 pt-3.5 border-t border-slate-900 flex gap-2 items-center">
            <div className="flex-1 bg-bg-surface-raised/20 border border-slate-800 rounded-full px-4 py-2.5 text-xs text-slate-500 font-normal">
              Ask anything about the document...
            </div>
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-slate-950 shrink-0 cursor-pointer">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section id="workflow" className="py-20 border-t border-slate-900/60 max-w-6xl w-full mx-auto px-8 space-y-12 bg-grid">
        <div className="text-left space-y-2">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest font-mono">WORKFLOW</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white uppercase font-sans tracking-tight">
            FROM PDF TO MASTERY IN THREE MOVES
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Drop the document",
              desc: "Any PDF — a textbook chapter, a research paper, a 100-page report. DocMind extracts every word and indexes it into searchable passages the same second."
            },
            {
              step: "02",
              title: "Ask anything",
              desc: "Chat with the document in plain language. Every answer streams live and cites the exact paragraphs it came from, so you can verify, not just trust."
            },
            {
              step: "03",
              title: "Master it",
              desc: "One click turns the material into a summary, key points, a quiz, a deck of flashcards, a translation, or a rewrite so simple a kid could follow it."
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-bg-surface/20 backdrop-blur-md border border-slate-800/40 rounded-3xl p-6 space-y-5 shadow-xs relative overflow-hidden group hover:border-sky-500/20 transition-all duration-300">
              <div className="text-6xl font-extrabold text-slate-900 group-hover:text-sky-500/10 transition-colors font-mono leading-none">
                {item.step}
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-white tracking-tight">{item.title}</h4>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* THE TOOLKIT SECTION */}
      <section id="toolkit" className="py-20 border-t border-slate-900/60 max-w-6xl w-full mx-auto px-8 space-y-12 mb-12 bg-grid">
        <div className="text-left space-y-2">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest font-mono">THE TOOLKIT</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white uppercase font-sans tracking-tight">
            ONE UPLOAD. SEVEN SUPERPOWERS.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Chat bento */}
          <div className="bg-bg-surface/20 backdrop-blur-md border border-slate-800/40 rounded-3xl p-6 md:col-span-2 space-y-4 hover:border-sky-500/20 transition-all">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-sky-400" />
              <h4 className="text-sm font-bold text-white">Chat with your document</h4>
            </div>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-normal">
              Ask questions in natural language and get answers pulled straight from the source — with paragraph citations and zero hallucination-by-design. Context-aware follow-ups included.
            </p>
            <div className="bg-bg-surface-raised/20 border border-slate-850 p-4 rounded-2xl max-w-md space-y-2 font-mono text-[11px] text-slate-500">
              <span className="text-slate-405">Which dataset performed best?</span>
              <p className="text-slate-350"><span className="text-sky-400 font-bold">WikiText-103</span> — perplexity dropped to <span className="text-sky-400 font-bold">18.3</span>, a 12% gain ([T14]).</p>
            </div>
          </div>

          {/* Summary bento */}
          <div className="bg-bg-surface/20 backdrop-blur-md border border-slate-800/40 rounded-3xl p-6 space-y-4 hover:border-teal-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-450" />
                <h4 className="text-sm font-bold text-white">One-click summary</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Dense, structured summaries with the thesis up front — no fluff, no filler.
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-3/4 rounded bg-slate-800" />
              <div className="h-1.5 w-1/2 rounded bg-slate-800" />
              <div className="h-1.5 w-2/3 rounded bg-teal-500/40" />
            </div>
          </div>

          {/* Keypoints bento */}
          <div className="bg-bg-surface/20 backdrop-blur-md border border-slate-800/40 rounded-3xl p-6 space-y-4 hover:border-indigo-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Key points</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                The key bullet concepts that carry the whole document — bolded terms, core concepts, done.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-mono text-indigo-405 font-bold">1</span>
              <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-mono text-indigo-405 font-bold">2</span>
              <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-mono text-indigo-405 font-bold">3</span>
            </div>
          </div>

          {/* Quiz generator bento */}
          <div className="bg-bg-surface/20 backdrop-blur-md border border-slate-800/40 rounded-3xl p-6 space-y-4 hover:border-orange-500/20 transition-all">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-orange-405" />
              <h4 className="text-sm font-bold text-white">Quiz generator</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Exam-ready multiple choice built from the actual facts, figures and claims.
            </p>
            <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-450 text-[10px] font-bold inline-block">
              ✓ Transformer architecture
            </div>
          </div>

          {/* Flashcards bento */}
          <div className="bg-bg-surface/20 backdrop-blur-md border border-slate-800/40 rounded-3xl p-6 space-y-4 hover:border-purple-500/20 transition-all">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-bold text-white">Flashcards</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              A study deck in seconds — flip, shuffle, drill until it sticks.
            </p>
            <div className="w-14 h-8 bg-bg-surface-raised/20 border border-slate-800 rounded-lg shadow-sm" />
          </div>

          {/* Translate bento */}
          <div className="bg-bg-surface/20 backdrop-blur-md border border-slate-800/40 rounded-3xl p-6 space-y-4 hover:border-cyan-500/20 transition-all">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Translation</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Read it in twelve languages — structure, numbers and terms preserved.
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {["ES", "FR", "DE", "HI", "JA", "ZH"].map((lang) => (
                <span key={lang} className="px-1.5 py-0.5 rounded bg-bg-surface-raised/20 border border-slate-800 text-[9px] font-mono font-bold text-slate-450">{lang}</span>
              ))}
            </div>
          </div>


          {/* Export notes bento (8th superpower - Added according to user requirement) */}
          <div className="bg-bg-surface/20 backdrop-blur-md border border-slate-800/40 rounded-3xl p-6 space-y-4 hover:border-sky-500/20 transition-all">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-sky-400" />
              <h4 className="text-sm font-bold text-white">Export notes</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Take your summary, key points and scores anywhere as clean Markdown.
            </p>
            <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold inline-block">
              ✓ Export format: .txt / .md
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-slate-900/60 max-w-6xl w-full mx-auto px-8 flex flex-col items-center justify-center text-center space-y-6">
        <h2 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tight text-white leading-[0.95] uppercase font-sans">
          YOUR<br />
          DOCUMENTS ARE<br />
          <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">WAITING.</span>
        </h2>
        
        <p className="text-sm md:text-base text-slate-400 font-sans tracking-wide max-w-lg">
          Stop skimming. Start knowing. The first document takes ten seconds.
        </p>

        <div className="pt-4">
          <button
            onClick={() => login()}
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-955 text-sm font-extrabold transition-all cursor-pointer shadow-lg hover:shadow-sky-500/20 active:scale-95"
          >
            <span>Launch DocMind</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-16 border-t border-slate-900/60 px-8 md:px-16 flex items-center justify-between text-xs font-mono text-slate-500 shrink-0">
        <span>© 2026 DOCMIND.AI SYSTEM. ALL RIGHTS RESERVED.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-350 transition-colors">PRIVACY</a>
          <a href="#" className="hover:text-slate-350 transition-colors">TERMS</a>
        </div>
      </footer>
    </div>
  );
}
