import React, { useState } from "react";
import { FileText, Eye, CheckCircle2, Bookmark, Target, Calendar, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { FileSummary } from "../types";

interface DocumentSummaryProps {
  summary: FileSummary;
  driveViewLink?: string;
}

export default function DocumentSummary({ summary, driveViewLink }: DocumentSummaryProps) {
  // Let the user interactively "check off" takeaways they've verified or completed
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
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  const { title, documentType, executiveSummary, keyTakeaways, actionItems, fileStats } = summary;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      id="document-summary-grid"
    >
      {/* Title Card & Stats */}
      <motion.div
        variants={cardVariants}
        className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-r from-slate-900 to-slate-900/60"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider font-mono rounded bg-slate-800 border border-slate-700 text-slate-400 uppercase">
              {documentType}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Calendar className="w-3 h-3 text-sky-400" /> EVALUATION OK
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
                <ExternalLink className="w-3 h-3 text-emerald-400" />
                Google Drive
              </a>
            )}
          </h2>
        </div>

        {/* Stats Bento Section */}
        <div className="flex items-center gap-3 w-full md:w-auto" id="document-stats-bento">
          {fileStats?.pages && (
            <div className="flex-1 md:flex-initial bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-2 text-center min-w-[70px]">
              <span className="block text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wider">
                Length
              </span>
              <span className="text-xs font-bold text-slate-200 font-mono mt-0.5 block">
                {fileStats.pages} {parseInt(fileStats.pages) === 1 ? "Page" : "Pages"}
              </span>
            </div>
          )}
          <div className="flex-1 md:flex-initial bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wider">
              Words
            </span>
            <span className="text-xs font-bold text-slate-200 font-mono mt-0.5 block">
              {fileStats?.wordCount || "~" + executiveSummary.split(" ").length * 5}
            </span>
          </div>
          <div className="flex-1 md:flex-initial bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-2 text-center min-w-[90px]">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wider">
              Read Time
            </span>
            <span className="text-xs font-bold text-sky-400 font-mono mt-0.5 block">
              {fileStats?.readingTime || "1 min"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Executive Summary Paragraph */}
      <motion.div
        variants={cardVariants}
        className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Executive Synopsis</span>
          <Eye className="w-4 h-4 text-sky-400" />
        </h3>
        <p className="text-xs leading-relaxed text-slate-300 font-normal">
          {executiveSummary}
        </p>
      </motion.div>

      {/* Action Items List */}
      <motion.div
        variants={cardVariants}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Action Plan</span>
          <Target className="w-4 h-4 text-sky-400" />
        </h3>
        <div className="flex flex-col gap-2.5 flex-1 justify-start">
          {actionItems && actionItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/30 border border-slate-700/20 hover:border-slate-700/50 transition-colors"
            >
              <span className="w-5 h-5 rounded bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[10px] font-mono font-bold text-sky-400 mt-0.5 shrink-0">
                0{idx + 1}
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {item}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key Takeaways Interactive Section */}
      <motion.div
        variants={cardVariants}
        className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-sky-400" /> Key Insights & Findings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {keyTakeaways && keyTakeaways.map((takeaway, idx) => {
            const isChecked = !!checkedTakeaways[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleTakeaway(idx)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-300 select-none ${
                  isChecked
                    ? "bg-slate-800/10 border-slate-800 opacity-60"
                    : "bg-slate-800/30 border-slate-700/30 hover:border-slate-700 hover:bg-slate-850"
                }`}
              >
                <button
                  className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors mt-0.5 ${
                    isChecked
                      ? "bg-sky-500 border-sky-500 text-slate-950"
                      : "border-slate-600 bg-slate-900 hover:border-slate-500"
                  }`}
                  aria-label="Toggle takeaway checked state"
                >
                  {isChecked && <CheckCircle2 className="w-3 h-3 stroke-[3.5]" />}
                </button>
                <p className={`text-xs leading-relaxed transition-all duration-300 ${
                  isChecked ? "line-through text-slate-500 font-normal" : "text-slate-300 font-medium"
                }`}>
                  {takeaway}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
