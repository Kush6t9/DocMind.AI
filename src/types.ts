export interface FileStats {
  pages?: string;
  wordCount?: string;
  readingTime?: string;
}

export interface FileSummary {
  title: string;
  documentType: string;
  executiveSummary: string;
  keyTakeaways: string[];
  actionItems: string[];
  fileStats: FileStats;
}

export interface DocumentItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  summary: FileSummary;
  createdAt: string;
  driveFileId?: string;
  driveViewLink?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface FlashcardItem {
  id: number;
  front: string;
  back: string;
}

export interface QuizData {
  quiz: QuizQuestion[];
  flashcards: FlashcardItem[];
}
