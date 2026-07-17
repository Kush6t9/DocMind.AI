import React, { useState, useEffect } from "react";
import { Sparkles, BrainCircuit, GraduationCap, ChevronLeft, ChevronRight, HelpCircle, Check, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuizQuestion, FlashcardItem, QuizData } from "../types";

interface QuizViewProps {
  fileId: string;
  quizData: QuizData | null;
  onGenerateQuiz: () => Promise<void>;
  isLoading: boolean;
  defaultView?: "flashcards" | "quiz";
  hideTabSelectors?: boolean;
}

export default function QuizView({
  fileId,
  quizData,
  onGenerateQuiz,
  isLoading,
  defaultView,
  hideTabSelectors = false,
}: QuizViewProps) {
  const [activeTab, setActiveTab] = useState<"flashcards" | "quiz">(defaultView || "flashcards");

  useEffect(() => {
    if (defaultView) {
      setActiveTab(defaultView);
    }
  }, [defaultView]);

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

  const flashcards = quizData?.flashcards || [];
  const quiz = quizData?.quiz || [];
  const currentCard = flashcards[currentCardIdx];
  const hasNoData = activeTab === "quiz" ? quiz.length === 0 : flashcards.length === 0;

  if (hasNoData && !isLoading) {
    const isQuiz = activeTab === "quiz";
    return (
      <div className="flex flex-col items-center justify-center border border-slate-800 bg-bg-surface rounded-3xl p-10 text-center max-w-md mx-auto" id="quiz-empty-state">
        {isQuiz ? (
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-6">
            <BrainCircuit className="w-7 h-7" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
            <GraduationCap className="w-7 h-7" />
          </div>
        )}
        <h3 className="text-lg font-bold text-slate-100 font-sans tracking-tight">
          {isQuiz ? "Generate Quiz" : "Generate Flashcards"}
        </h3>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          Allow our advanced AI to scan this document and instantly generate your interactive practice material.
        </p>
        <button
          id="generate-quiz-btn"
          onClick={onGenerateQuiz}
          className={`mt-6 text-slate-950 font-bold px-6 py-3 rounded-full text-sm transition-all cursor-pointer shadow-lg active:scale-95 ${
            isQuiz 
              ? "bg-orange-500 hover:bg-orange-400 shadow-orange-500/10" 
              : "bg-purple-500 hover:bg-purple-400 shadow-purple-500/10"
          }`}
        >
          GENERATE
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4" id="quiz-loading-state">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-sky-500/10 border-t-sky-400 animate-spin" />
          <BrainCircuit className="absolute top-4 left-4 w-6 h-6 text-sky-400 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-bold text-sky-400 uppercase tracking-wider">Synthesizing Questions...</p>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing logical nodes and conceptual mapping
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full h-full" id="quiz-dashboard-container">
      {/* Tab Selectors */}
      {!hideTabSelectors && (
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
      )}

      <AnimatePresence mode="wait">
        {activeTab === "flashcards" && currentCard && (
          <motion.div
            key="flashcards-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-5 w-full max-w-2xl mx-auto"
          >
            {/* 3D Flippable Flashcard Card (Increased Size to max-w-2xl, height h-80) */}
            <div
              id={`flashcard-card-${currentCard.id}`}
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-80 relative cursor-pointer group"
              style={{ perspective: "1000px" }}
            >
              <div
                className={`w-full h-full duration-500 rounded-3xl border transition-all transform-style-3d ${
                  isFlipped
                    ? "rotate-y-180 border-purple-500/40 bg-slate-900/80 shadow-[0_4px_25px_rgba(168,85,247,0.08)]"
                    : "border-slate-800 bg-slate-900/40 group-hover:border-slate-700 shadow-lg"
                }`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* CARD FRONT */}
                <div
                  className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-purple-400">
                      Term / Concept
                    </span>
                    <Sparkles className="w-5 h-5 text-purple-400/50" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-4">
                    <p className="text-lg md:text-xl font-extrabold text-slate-100 text-center leading-relaxed max-w-lg">
                      {currentCard.front}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono font-medium text-slate-400 text-center animate-pulse">
                    Click to flip card
                  </p>
                </div>

                {/* CARD BACK */}
                <div
                  className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between backface-hidden rotate-y-180"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="flex justify-between items-center text-purple-400/85">
                    <span className="text-[10px] font-mono tracking-wider uppercase font-bold">
                      Definition / Details
                    </span>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-4">
                    <p className="text-sm md:text-base font-semibold leading-relaxed text-slate-200 text-center max-w-lg">
                      {currentCard.back}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono font-medium text-purple-400/70 text-center">
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
                className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:border-purple-500/30"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <span className="text-xs font-mono font-semibold text-slate-500">
                Card {currentCardIdx + 1} of {flashcards.length}
              </span>
              <button
                id="next-flashcard-btn"
                onClick={handleNextCard}
                className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:border-purple-500/30"
              >
                <ChevronRight className="w-4.5 h-4.5" />
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
            className="flex flex-col gap-4 w-full max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5" id="quiz-header-dashboard">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-orange-400" /> Multiple Choice Evaluation
              </span>
              {quizScore !== null && (
                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-lg">
                  Score: {quizScore} / {quiz.length}
                </span>
              )}
            </div>

            {/* Questions Canvas (Increased scrollable height to 480px) */}
            <div className="flex flex-col gap-5 max-h-[480px] overflow-y-auto pr-2" id="quiz-questions-canvas">
              {quiz.map((q, idx) => {
                const selectedAns = userAnswers[q.id];
                const isAnswered = selectedAns !== undefined;

                return (
                  <div
                    id={`quiz-question-box-${q.id}`}
                    key={q.id}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60"
                  >
                    <p className="text-sm font-bold text-slate-200 leading-relaxed mb-4">
                      <span className="text-orange-400 font-bold font-mono mr-1.5">{idx + 1}.</span> {q.question}
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((option, optIdx) => {
                        const isOptionSelected = selectedAns === option;
                        const isCorrectOption = option === q.correctAnswer;
                        
                        let optStyle = "border-slate-800 bg-slate-950/20 hover:border-slate-700 text-slate-350";
                        if (isAnswered) {
                          if (isCorrectOption) {
                            optStyle = "border-orange-500 bg-orange-950/10 text-orange-350";
                          } else if (isOptionSelected) {
                            optStyle = "border-rose-500 bg-rose-950/10 text-rose-350";
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
                            className={`flex items-center justify-between text-left p-3.5 rounded-xl border text-sm transition-all ${optStyle} ${
                              !isAnswered ? "cursor-pointer hover:bg-slate-950/40" : ""
                            }`}
                          >
                            <span className="font-semibold">{option}</span>
                            {isAnswered && isCorrectOption && <Check className="w-4 h-4 shrink-0 text-orange-400 stroke-[3]" />}
                            {isAnswered && isOptionSelected && !isCorrectOption && <X className="w-4 h-4 shrink-0 text-rose-455 stroke-[3]" />}
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
                          className="mt-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800"
                        >
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                            selectedAns === q.correctAnswer ? "text-orange-400" : "text-rose-455"
                          }`}>
                            {selectedAns === q.correctAnswer ? "Correct Answer" : "Incorrect Answer"}
                          </p>
                          <p className="text-xs leading-relaxed text-slate-400">
                            <span className="font-bold text-slate-305">Explanation:</span> {q.explanation}
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
                className="text-[10px] font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" /> RESET
              </button>
              
              {quizScore === null ? (
                <button
                  id="submit-quiz-score-btn"
                  disabled={Object.keys(userAnswers).length < quiz.length}
                  onClick={calculateScore}
                  className="bg-orange-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer hover:bg-orange-400 transition-colors disabled:opacity-40"
                >
                  GRADE EVALUATION
                </button>
              ) : (
                <button
                  id="retake-quiz-btn"
                  onClick={resetQuiz}
                  className="bg-orange-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer hover:bg-orange-400 transition-colors"
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
