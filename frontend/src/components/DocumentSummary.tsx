import React, { useState } from "react";
import { FileText, Eye, CheckCircle2, Bookmark, Target, Calendar, ExternalLink, Cpu, HardDrive, Check } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { FileSummary } from "../types";

interface DocumentSummaryProps {
  summary: FileSummary;
  driveViewLink?: string;
}

export default function DocumentSummary({ summary, driveViewLink }: DocumentSummaryProps) {
  const [checkedTakeaways, setCheckedTakeaways] = useState<Record<number, boolean>>({});

  const toggleTakeaway = (index: number) => {
    setCheckedTakeaways((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  const { title, documentType, executiveSummary, keyTakeaways, actionItems, fileStats } = summary;

  // Track checked percentage to balance layout with a progress metric visual
  const totalTakeaways = keyTakeaways?.length || 0;
  const verifiedCount = Object.values(checkedTakeaways).filter(Boolean).length;
  const progressPercent = totalTakeaways > 0 ? Math.round((verifiedCount / totalTakeaways) * 100) : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      id="document-summary-grid"
    >
      {/* Title Card & Stats (Elevated layout) */}
      <motion.div
        variants={cardVariants}
        className="md:col-span-3 bg-bg-surface border border-slate-800/80 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider font-mono rounded bg-bg-surface-raised border border-slate-800 text-teal-400 uppercase">
              {documentType}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Calendar className="w-3 h-3 text-teal-450" /> SYNOPSIS COMPLETED
            </span>
          </div>
          <h2 className="text-base md:text-lg font-bold tracking-tight text-white leading-tight flex items-center gap-2 flex-wrap" id="doc-title-drive-link">
            {title}
            {driveViewLink && (
              <a
                href={driveViewLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-mono tracking-wide font-medium transition-all cursor-pointer select-none"
              >
                <ExternalLink className="w-3 h-3" />
                Google Drive
              </a>
            )}
          </h2>
        </div>

        {/* Stats Bento Section (Nested Elevated) */}
        <div className="flex items-center gap-3 w-full md:w-auto" id="document-stats-bento">
          {fileStats?.pages && (
            <div className="flex-1 md:flex-initial bg-bg-surface-raised border border-slate-800 rounded-xl px-4 py-2 text-center min-w-[70px]">
              <span className="block text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wider">
                Length
              </span>
              <span className="text-xs font-bold text-slate-200 font-mono mt-0.5 block">
                {fileStats.pages} {parseInt(fileStats.pages) === 1 ? "Page" : "Pages"}
              </span>
            </div>
          )}
          <div className="flex-1 md:flex-initial bg-bg-surface-raised border border-slate-800 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wider">
              Words
            </span>
            <span className="text-xs font-bold text-slate-200 font-mono mt-0.5 block">
              {fileStats?.wordCount || "~" + executiveSummary.split(" ").length * 5}
            </span>
          </div>
          <div className="flex-1 md:flex-initial bg-bg-surface-raised border border-slate-800 rounded-xl px-4 py-2 text-center min-w-[90px]">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wider">
              Read Time
            </span>
            <span className="text-xs font-bold text-teal-400 font-mono mt-0.5 block">
              {fileStats?.readingTime || "1 min"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Executive Summary Paragraph (Teal Accent visual helper to balance column heights) */}
      <motion.div
        variants={cardVariants}
        className="md:col-span-2 bg-bg-surface border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between"
      >
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Executive Synopsis</span>
            <Eye className="w-4 h-4 text-teal-400" />
          </h3>
          <p className="text-xs md:text-sm leading-relaxed text-slate-300 font-normal">
            {executiveSummary}
          </p>
        </div>

        {/* Lightweight visual chips & progress tracker at bottom to balance whitespace */}
        <div className="mt-6 pt-4 border-t border-slate-900 flex flex-wrap gap-2 items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded bg-bg-surface-raised border border-slate-800 flex items-center gap-1 text-[10px]">
              <Cpu className="w-3 h-3 text-teal-400" /> AI ANALYTICS ENGINE
            </span>
            <span className="px-2 py-0.5 rounded bg-bg-surface-raised border border-slate-800 flex items-center gap-1 text-[10px]">
              <Check className="w-3 h-3 text-emerald-450" /> HIGH FIDELITY
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Insight verification: <span className="text-teal-400 font-bold">{progressPercent}%</span>
          </span>
        </div>
      </motion.div>

      {/* Action Items List */}
      <motion.div
        variants={cardVariants}
        className="bg-bg-surface border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between"
      >
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Action Plan</span>
            <Target className="w-4 h-4 text-teal-400" />
          </h3>
          <div className="flex flex-col gap-2.5">
            {actionItems && actionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-bg-surface-raised/40 border border-slate-800/60 hover:border-slate-800 hover:bg-bg-surface-raised transition-all"
              >
                {/* Standardized Numbered-Circle Pattern */}
                <span className="w-5.5 h-5.5 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-[10px] font-mono font-bold text-teal-400 mt-0.5 shrink-0">
                  {idx + 1}
                </span>
                <div className="text-xs leading-relaxed text-slate-350">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <span {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-slate-200" {...props} />
                    }}
                  >{item}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Key Takeaways Interactive Section */}
      <motion.div
        variants={cardVariants}
        className="md:col-span-3 bg-bg-surface border border-slate-800/80 rounded-3xl p-6"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-teal-400" /> Key Insights & Findings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {keyTakeaways && keyTakeaways.map((takeaway, idx) => {
            const isChecked = !!checkedTakeaways[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleTakeaway(idx)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-350 select-none ${
                  isChecked
                    ? "bg-bg-surface-raised/30 border-slate-900 opacity-60"
                    : "bg-bg-surface-raised border border-slate-800/60 hover:border-teal-500/35 hover:bg-bg-surface-raised"
                }`}
              >
                <button
                  className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors mt-0.5 ${
                    isChecked
                      ? "bg-teal-500 border-teal-500 text-slate-950"
                      : "border-slate-700 bg-bg-base hover:border-slate-500"
                  }`}
                  aria-label="Toggle takeaway checked state"
                >
                  {isChecked && <CheckCircle2 className="w-3 h-3 stroke-[3.5]" />}
                </button>
                <div className={`text-xs md:text-sm leading-relaxed transition-all duration-300 ${
                  isChecked ? "line-through text-slate-500 font-normal" : "text-slate-350 font-medium"
                }`}>
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <span {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-slate-200" {...props} />
                    }}
                  >{takeaway}</ReactMarkdown>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
