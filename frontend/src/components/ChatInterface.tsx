import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, AlertCircle, RefreshCw, Trash2, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";

interface ChatInterfaceProps {
  fileId: string;
  fileName: string;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  accessToken?: string;
}

const SUGGESTIONS = [
  "Summarize the key findings.",
  "Identify any critical risks or red flags.",
  "What are the main actionable recommendations?",
  "Draft a high-level email summary based on this."
];

export default function ChatInterface({
  fileId,
  fileName,
  chatHistory,
  setChatHistory,
  accessToken,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = (behavior: "smooth" | "instant" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [chatHistory]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Show scroll-down button if user scrolled up significantly
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBtn(isScrolledUp);
  };

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "model",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
    };

    // Update history locally
    setChatHistory((prev) => [...prev, newUserMessage, newAssistantMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Map chat history for the backend, omitting the newly added model message
      const conversationHistory = chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fileId,
          message: messageText.trim(),
          history: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to streaming gateway");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read server-sent event stream");
      }

      const decoder = new TextDecoder();
      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Maintain partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.substring(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                // Progressively update Assistant text stream
                setChatHistory((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (err) {
              // Partial JSON, safe to skip to next chunk
            }
          }
        }
      }

      // Finalize streaming state
      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );

    } catch (err: any) {
      console.error("Chat error:", err);
      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ Connection Lost: Unable to stream Gemini responses. Please check server status and try again. Error: ${err.message}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  return (
    <div className="flex flex-col h-full min-h-[450px] md:min-h-[550px] bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-xl relative" id="chat-interface-wrapper">
      {/* Chat Header */}
      <div className="bg-slate-800/40 px-6 py-3 border-b border-slate-800 flex items-center justify-between" id="chat-header">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">Interactive Chat <span className="text-sky-400 font-mono text-[11px] ml-1.5">[Streaming Output]</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded font-mono">Gemini-3.5-Flash</span>
          {chatHistory.length > 0 && (
            <button
              id="clear-chat-btn"
              onClick={clearHistory}
              className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-900/40 hover:bg-rose-950/20 transition-all cursor-pointer font-medium"
              title="Clear conversation history"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages Canvas */}
      <div
        id="messages-canvas"
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 relative bg-slate-950/10"
      >
        {chatHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-4 p-4">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                AI Knowledge Ingestion Chat
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                Query the structural entities of <span className="font-semibold text-slate-200">"{fileName}"</span>. Ask for deep summaries, risk assessments, or contract clauses.
              </p>
            </div>
            {/* Quick Suggestions Chips (Clean 2-column grid layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-lg mx-auto" id="query-suggestion-chips">
              {SUGGESTIONS.map((suggestion, idx) => (
                <button
                  id={`suggestion-chip-${idx}`}
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  className="text-xs font-semibold bg-bg-surface border border-slate-800 hover:border-sky-500/30 px-3.5 py-2.5 rounded-2xl text-slate-350 hover:text-white hover:bg-bg-surface-raised transition-all text-left leading-normal shadow-xs cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">{suggestion}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 text-sky-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {chatHistory.map((msg) => (
              <div
                id={`chat-msg-${msg.id}`}
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
                }`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                  msg.role === "user"
                    ? "bg-slate-800 text-slate-300 border border-slate-700"
                    : "bg-sky-500 text-slate-950 shadow-inner"
                }`}>
                  {msg.role === "user" ? "U" : "AI"}
                </div>

                {/* Content Bubble */}
                <div className="flex flex-col gap-1">
                  <div className={`rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-800 rounded-tr-none p-4 border border-slate-700/50 text-slate-200"
                      : "bg-slate-700/20 border border-slate-700 rounded-tl-none p-5 text-slate-300 whitespace-pre-wrap"
                  }`}>
                    {msg.content === "" && msg.isStreaming ? (
                      <div className="flex items-center gap-1 text-sky-400 py-1" id="chat-typing-indicator">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span className={`text-[8px] font-mono text-slate-500 px-1 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll Down Trigger */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            id="scroll-to-bottom-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-16 right-5 w-7 h-7 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 flex items-center justify-center shadow-lg hover:text-white transition-all cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <form
        id="chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 bg-slate-800/30 border-t border-slate-800 flex gap-2 items-center"
      >
        <input
          id="chat-message-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoading ? "Analyzing document structure..." : "Ask about the document..."}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-5 py-3 text-sm focus:outline-hidden focus:border-sky-500 text-slate-200 outline-hidden transition-all placeholder-slate-500"
        />
        <button
          id="chat-send-submit"
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-sky-500 text-slate-950 rounded-full px-6 py-3 font-bold text-sm cursor-pointer hover:bg-sky-400 transition-colors shrink-0 disabled:opacity-40"
          title="Send query"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
