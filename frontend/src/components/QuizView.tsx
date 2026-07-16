import React, { useState } from "react";
import { Sparkles, BrainCircuit, GraduationCap, ChevronLeft, ChevronRight, HelpCircle, Check, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuizQuestion, FlashcardItem, QuizData } from "../types";

interface QuizViewProps {
  fileId: string;
  quizData: QuizData | null;
  onGenerateQuiz: () => Promise<void>;
  isLoading: boolean;
}

export default function QuizView({
  fileId,
  quizData,
  onGenerateQuiz,
  isLoading,
}: QuizViewProps) {
  const [activeTab, setActiveTab] = useState<"flashcards" | "quiz">("flashcards");
  
  // Flashcards navigation
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const resetQuiz = () => {
    setUserAnswers({});
    setQuizScore(null);
  };

  const handleSelectOption = (questionId: number, option: string, correctAnswer: string) => {
    if (userAnswers[questionId] !== undefined) return; // already answered
    
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const calculateScore = () => {
    if (!quizData) return;
    let score = 0;
    quizData.quiz.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });
    setQuizScore(score);
  };

  const handleNextCard = () => {
    if (!quizData) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev + 1) % quizData.flashcards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    if (!quizData) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev - 1 + quizData.flashcards.length) % quizData.flashcards.length);
    }, 150);
  };

  if (!quizData && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center border border-slate-800 bg-slate-900 rounded-2xl p-8 text-center max-w-sm mx-auto" id="quiz-empty-state">
        <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 mb-4">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Synthesize Study Kit
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Let Gemini scan this document to construct interactive flashcards and multiple-choice practice quizzes automatically.
        </p>
        <button
          id="generate-quiz-btn"
          onClick={onGenerateQuiz}
          className="mt-6 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-lg"
        >
          GENERATE KIT
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3" id="quiz-loading-state">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500/10 border-t-sky-400 animate-spin" />
          <BrainCircuit className="absolute top-2.5 left-2.5 w-5 h-5 text-sky-400 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Synthesizing Questions...</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Analyzing logical nodes and conceptual mapping
          </p>
        </div>
      </div>
    );
  }

  const flashcards = quizData?.flashcards || [];
  const quiz = quizData?.quiz || [];
  const currentCard = flashcards[currentCardIdx];

  return (
    <div className="flex flex-col gap-5 w-full h-full" id="quiz-dashboard-container">
      {/* Tab Selectors */}
      <div className="flex bg-slate-950/40 p-1 border border-slate-800/80 rounded-xl max-w-xs self-center" id="quiz-tab-selectors">
        <button
          id="tab-select-flashcards"
          onClick={() => setActiveTab("flashcards")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "flashcards"
              ? "bg-slate-800 text-sky-400 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Study Cards
        </button>
        <button
          id="tab-select-quiz"
          onClick={() => {
            setActiveTab("quiz");
            resetQuiz();
          }}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "quiz"
              ? "bg-slate-800 text-sky-400 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> Practice Quiz
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "flashcards" && currentCard && (
          <motion.div
            key="flashcards-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto"
          >
            {/* 3D Flippable Flashcard Card */}
            <div
              id={`flashcard-card-${currentCard.id}`}
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-56 relative cursor-pointer group"
              style={{ perspective: "1000px" }}
            >
              <div
                className={`w-full h-full duration-500 rounded-2xl border transition-all transform-style-3d ${
                  isFlipped
                    ? "rotate-y-180 border-sky-500/40 bg-slate-900/80 shadow-[0_4px_25px_rgba(56,189,248,0.08)]"
                    : "border-slate-800 bg-slate-900/40 group-hover:border-slate-700 shadow-lg"
                }`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* CARD FRONT */}
                <div
                  className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[9px] font-mono tracking-wider uppercase font-semibold">
                      Term / Concept
                    </span>
                    <Sparkles className="w-4 h-4 text-sky-500/50" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-2">
                    <p className="text-xs font-bold text-slate-100 text-center leading-relaxed max-w-xs">
                      {currentCard.front}
                    </p>
                  </div>
                  <p className="text-[9px] font-mono font-medium text-slate-400 text-center animate-pulse">
                    Click to flip card
                  </p>
                </div>

                {/* CARD BACK */}
                <div
                  className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between backface-hidden rotate-y-180"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="flex justify-between items-center text-sky-500/70">
                    <span className="text-[9px] font-mono tracking-wider uppercase font-semibold">
                      Definition / Details
                    </span>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-2">
                    <p className="text-[11px] font-semibold leading-relaxed text-slate-200 text-center max-w-xs">
                      {currentCard.back}
                    </p>
                  </div>
                  <p className="text-[9px] font-mono font-medium text-sky-400/70 text-center">
                    Click to return to front
                  </p>
                </div>
              </div>
            </div>

            {/* Flashcard Controls */}
            <div className="flex items-center justify-between w-full px-4" id="flashcard-controls">
              <button
                id="prev-flashcard-btn"
                onClick={handlePrevCard}
                className="w-9 h-9 rounded-lg border border-slate-850 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-semibold text-slate-500">
                Card {currentCardIdx + 1} of {flashcards.length}
              </span>
              <button
                id="next-flashcard-btn"
                onClick={handleNextCard}
                className="w-9 h-9 rounded-lg border border-slate-850 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "quiz" && quiz.length > 0 && (
          <motion.div
            key="quiz-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4 w-full max-w-xl mx-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2" id="quiz-header-dashboard">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> Multiple Choice Evaluation
              </span>
              {quizScore !== null && (
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded">
                  Score: {quizScore} / {quiz.length}
                </span>
              )}
            </div>

            {/* Questions Canvas */}
            <div className="flex flex-col gap-4 max-h-[340px] overflow-y-auto pr-2" id="quiz-questions-canvas">
              {quiz.map((q, idx) => {
                const selectedAns = userAnswers[q.id];
                const isAnswered = selectedAns !== undefined;

                return (
                  <div
                    id={`quiz-question-box-${q.id}`}
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900"
                  >
                    <p className="text-xs font-semibold text-slate-200 leading-relaxed mb-3">
                      <span className="text-sky-400 font-bold font-mono mr-1">{idx + 1}.</span> {q.question}
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((option, optIdx) => {
                        const isOptionSelected = selectedAns === option;
                        const isCorrectOption = option === q.correctAnswer;
                        
                        let optStyle = "border-slate-800 bg-slate-950/20 hover:border-slate-700 text-slate-300";
                        if (isAnswered) {
                          if (isCorrectOption) {
                            optStyle = "border-sky-500 bg-sky-950/10 text-sky-300";
                          } else if (isOptionSelected) {
                            optStyle = "border-rose-500 bg-rose-950/10 text-rose-300";
                          } else {
                            optStyle = "border-slate-900 bg-slate-950/10 text-slate-500 opacity-60";
                          }
                        }

                        return (
                          <button
                            id={`opt-${q.id}-${optIdx}`}
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() => handleSelectOption(q.id, option, q.correctAnswer)}
                            className={`flex items-center justify-between text-left p-2.5 rounded-lg border text-xs transition-all ${optStyle} ${
                              !isAnswered ? "cursor-pointer hover:bg-slate-950/40" : ""
                            }`}
                          >
                            <span className="font-medium">{option}</span>
                            {isAnswered && isCorrectOption && <Check className="w-3.5 h-3.5 shrink-0 text-sky-400 stroke-[3]" />}
                            {isAnswered && isOptionSelected && !isCorrectOption && <X className="w-3.5 h-3.5 shrink-0 text-rose-400 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback & Explanation Block */}
                    <AnimatePresence>
                      {isAnswered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800"
                        >
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            selectedAns === q.correctAnswer ? "text-sky-400" : "text-rose-400"
                          }`}>
                            {selectedAns === q.correctAnswer ? "Correct Answer" : "Incorrect Answer"}
                          </p>
                          <p className="text-[10px] leading-relaxed text-slate-400">
                            <span className="font-bold text-slate-300">Explanation:</span> {q.explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer Quiz Controls */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4" id="quiz-footer-dashboard">
              <button
                id="reset-quiz-btn"
                onClick={resetQuiz}
                className="text-[10px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer font-mono"
              >
                <RefreshCw className="w-3 h-3" /> RESET
              </button>
              
              {quizScore === null ? (
                <button
                  id="submit-quiz-score-btn"
                  disabled={Object.keys(userAnswers).length < quiz.length}
                  onClick={calculateScore}
                  className="bg-sky-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer hover:bg-sky-400 transition-colors disabled:opacity-40"
                >
                  GRADE EVALUATION
                </button>
              ) : (
                <button
                  id="retake-quiz-btn"
                  onClick={resetQuiz}
                  className="bg-sky-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer hover:bg-sky-400 transition-colors"
                >
                  RETAKE QUIZ
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
