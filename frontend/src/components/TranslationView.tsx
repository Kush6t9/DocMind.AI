import React, { useState } from "react";
import { Languages, Globe, Loader2, Sparkles, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FileSummary } from "../types";

interface TranslationViewProps {
  fileId: string;
  onTranslate: (lang: string) => Promise<string | null>;
}

const LANGUAGES = [
  { code: "Spanish", name: "Spanish (Español)" },
  { code: "French", name: "French (Français)" },
  { code: "German", name: "German (Deutsch)" },
  { code: "Japanese", name: "Japanese (日本語)" },
  { code: "Chinese", name: "Chinese (中文)" },
  { code: "Hindi", name: "Hindi (हिन्दी)" },
  { code: "Italian", name: "Italian (Italiano)" },
];

export default function TranslationView({ fileId, onTranslate }: TranslationViewProps) {
  const [targetLang, setTargetLang] = useState("Spanish");
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleTranslateClick = async () => {
    setIsLoading(true);
    setError("");
    setTranslatedText(null);

    try {
      const text = await onTranslate(targetLang);
      if (text) {
        setTranslatedText(text);
      } else {
        throw new Error("Translation service returned an empty payload");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Translation gateway error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let cleanLine = line.trim();
      
      if (cleanLine.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-100 mt-5 mb-2.5 font-mono uppercase tracking-wider">
            {cleanLine.replace("###", "").trim()}
          </h4>
        );
      }
      if (cleanLine.startsWith("##")) {
        return (
          <h3 key={idx} className="text-sm font-bold text-cyan-400 mt-6 mb-3 border-b border-slate-800 pb-1.5 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Globe className="w-4.5 h-4.5" /> {cleanLine.replace("##", "").trim()}
          </h3>
        );
      }
      if (cleanLine.startsWith("#")) {
        return (
          <h2 key={idx} className="text-lg font-extrabold text-white mt-7 mb-4 tracking-tight">
            {cleanLine.replace("#", "").trim()}
          </h2>
        );
      }
      if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
        return (
          <li key={idx} className="text-sm leading-relaxed text-slate-300 ml-6 list-disc mb-2 pl-0.5">
            {cleanLine.substring(1).trim()}
          </li>
        );
      }
      if (cleanLine.startsWith("**") && cleanLine.endsWith("**")) {
        return (
          <p key={idx} className="text-sm font-bold text-slate-200 mt-3">
            {cleanLine.replace(/\*\*/g, "").trim()}
          </p>
        );
      }
      if (cleanLine === "") {
        return <div key={idx} className="h-3" />;
      }
      return (
        <p key={idx} className="text-sm leading-relaxed text-slate-350 mb-2 font-sans">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full" id="translation-view-container">
      {/* Translation Toolbar Config */}
      <div className="bg-bg-surface border border-slate-800/85 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4" id="translation-toolbar">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Cross-Lingual Translation
            </h3>
            <p className="text-[10px] text-slate-505 mt-0.5 font-mono">
              Gemini semantic localization engine
            </p>
          </div>
        </div>

        {/* Configuration input field */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <select
            id="target-language-select"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-bg-surface-raised border border-slate-800 focus:border-cyan-500 rounded-full px-4 py-2.5 text-xs text-slate-250 outline-hidden transition-all disabled:opacity-50"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            id="trigger-translation-btn"
            disabled={isLoading}
            onClick={handleTranslateClick}
            className="flex-1 sm:flex-none bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-full text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-40"
          >
            {isLoading ? "TRANSLATING..." : "TRANSLATE"}
          </button>
        </div>
      </div>

      {/* Translations Output Display (Increased min-h to 350px) */}
      <div className="flex-1 flex flex-col min-h-[350px]" id="translation-output-canvas">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="translating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-6"
            >
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Performing Language Mapping...</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Re-aligning semantic matrices into {targetLang}
                </p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center border border-rose-955/20 bg-rose-955/10 rounded-3xl p-6 text-center gap-3 text-rose-455"
            >
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <div>
                <p className="text-sm font-bold">Translation Gateway Blocked</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                  {error}
                </p>
              </div>
            </motion.div>
          )}

          {!isLoading && !error && !translatedText && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center border border-slate-800 bg-bg-surface rounded-3xl p-10 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 tracking-tight">Cross-Lingual Localization</h3>
              <p className="text-sm text-slate-450 mt-3 leading-relaxed max-w-sm mx-auto">
                Choose a target language above and click **Translate** to begin. The Gemini model localizes summaries, key takeaways, and lists.
              </p>
            </motion.div>
          )}

          {!isLoading && !error && translatedText && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 bg-bg-surface border border-slate-800/80 rounded-3xl p-6 overflow-y-auto max-h-[550px]"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3.5 mb-4">
                <span className="text-[10px] font-bold tracking-wider font-mono uppercase bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-lg flex items-center gap-1.5">
                  <Languages className="w-4 h-4" /> {targetLang} OUTPUT
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Characters: {translatedText.length}
                </span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                {renderMarkdown(translatedText)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
