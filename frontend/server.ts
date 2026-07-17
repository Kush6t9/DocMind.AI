import express from "express";
import path from "path";
import multer from "multer";
import crypto from "crypto";
import mammoth from "mammoth";
import AdmZip from "adm-zip";
import dotenv from "dotenv";
import * as xlsx from "xlsx";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON parsing with larger limit for base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configure multer in-memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Initialize Gemini SDK securely (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;


if (apiKey ) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  console.log("Gemini client successfully initialized server-side.");
  } else {
    console.warn("Warning: GEMINI_API_KEY environment variable is not defined. Using mock analysis mode.");
  }

// Robust wrapper for Gemini generateContent with exponential backoff, jitter, and fallback model to combat 503/429
async function generateContentWithRetry(params: any, retries = 3, delay = 1000): Promise<any> {
  if (!ai) throw new Error("Gemini API client is not initialized.");
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("429") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("Unavailable") ||
        err?.message?.includes("busy");

      if (isTransient) {
        // If we hit a transient error, try cross-falling back between gemini-3.1-flash-lite and gemini-3.5-flash to bypass high demand
        const fallbackModel = params.model === "gemini-3.1-flash-lite" ? "gemini-3.5-flash" : "gemini-3.1-flash-lite";
        console.warn(`[Gemini API] Transient error on ${params.model}. Falling back immediately to '${fallbackModel}'...`);
        try {
          const fallbackParams = { ...params, model: fallbackModel };
          return await ai.models.generateContent(fallbackParams);
        } catch (fallbackErr: any) {
          console.warn(`[Gemini API] Fallback to '${fallbackModel}' also failed: ${fallbackErr?.message || fallbackErr}. Proceeding with retry...`);
        }

        if (attempt < retries) {
          const backoff = delay * Math.pow(2, attempt) + Math.random() * 200;
          console.warn(`[Gemini API] Transient error (attempt ${attempt}/${retries}): ${err?.message || err}. Retrying in ${Math.round(backoff)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }
      }

      throw err;
    }
  }
}

// Robust wrapper for Gemini generateContentStream with exponential backoff, jitter, and fallback model to combat 503/429
async function generateContentStreamWithRetry(params: any, retries = 3, delay = 1000): Promise<any> {
  if (!ai) throw new Error("Gemini API client is not initialized.");
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await ai.models.generateContentStream(params);
    } catch (err: any) {
      attempt++;
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("429") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("Unavailable") ||
        err?.message?.includes("busy");

      if (isTransient) {
        // If we hit a transient error, try cross-falling back between gemini-3.1-flash-lite and gemini-3.5-flash to bypass high demand
        const fallbackModel = params.model === "gemini-3.1-flash-lite" ? "gemini-3.5-flash" : "gemini-3.1-flash-lite";
        console.warn(`[Gemini API Stream] Transient error on ${params.model}. Falling back immediately to '${fallbackModel}'...`);
        try {
          const fallbackParams = { ...params, model: fallbackModel };
          return await ai.models.generateContentStream(fallbackParams);
        } catch (fallbackErr: any) {
          console.warn(`[Gemini API Stream] Fallback to '${fallbackModel}' also failed: ${fallbackErr?.message || fallbackErr}. Proceeding with retry...`);
        }

        if (attempt < retries) {
          const backoff = delay * Math.pow(2, attempt) + Math.random() * 200;
          console.warn(`[Gemini API Stream] Transient error (attempt ${attempt}/${retries}): ${err?.message || err}. Retrying in ${Math.round(backoff)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }
      }

      throw err;
    }
  }
}

// In-memory document storage (stateless container fallback / session cache)
interface DocumentStoreItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  rawText?: string;
  base64Data?: string; // used for inlineData multi-modal calls (PDF & Images)
  summary?: any;
  createdAt: string;
  driveFileId?: string;
  driveViewLink?: string;
}

const documents = new Map<string, DocumentStoreItem>();

// Google OAuth Verification & User Info Helper
async function getGoogleUser(accessToken: string) {
  const oauth2 = google.oauth2({ version: "v2" });
  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: accessToken });
  
  try {
    const userInfoResponse = await oauth2.userinfo.get({ auth: authClient });
    return userInfoResponse.data;
  } catch (err: any) {
    console.error("Failed to fetch user info from Google:", err?.message || err);
    throw new Error("Invalid or expired Google access token.");
  }
}

// Google Drive Folder Management Helper (Gets or creates 'AI Document Analyzer')
async function getOrCreateDriveFolder(driveClient: any): Promise<string> {
  try {
    const response = await driveClient.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and name = 'AI Document Analyzer' and trashed = false",
      fields: "files(id, name)",
      spaces: "drive",
    });
    
    let folderId = response.data.files?.[0]?.id;
    if (!folderId) {
      console.log("Folder 'AI Document Analyzer' not found. Creating brand new folder in Google Drive...");
      const folderMetadata = {
        name: "AI Document Analyzer",
        mimeType: "application/vnd.google-apps.folder",
      };
      const folder = await driveClient.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });
      folderId = folder.data.id;
    }
    return folderId;
  } catch (err: any) {
    console.error("Failed to list/create Google Drive folder:", err?.message || err);
    throw err;
  }
}

// Upload direct to Google Drive without holding files on local disk
async function uploadFileToDrive(accessToken: string, filename: string, mimetype: string, buffer: Buffer): Promise<{ id: string; webViewLink: string }> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  
  const folderId = await getOrCreateDriveFolder(drive);
  
  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };
  
  const { Readable } = await import("stream");
  const media = {
    mimeType: mimetype,
    body: Readable.from(buffer),
  };
  
  const fileResponse = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, name, webViewLink",
  });
  
  return {
    id: fileResponse.data.id || "",
    webViewLink: fileResponse.data.webViewLink || "",
  };
}

// Helper: Extract text from PPTX files
function extractTextFromPptx(buffer: Buffer): string {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    let text = "";

    // PPTX slide content resides in ppt/slides/slideX.xml
    const slideEntries = zipEntries.filter(
      (entry) => entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml")
    );

    // Sort slide entries by name to preserve order (slide1, slide2...)
    slideEntries.sort((a, b) => a.entryName.localeCompare(b.entryName));

    for (const entry of slideEntries) {
      const xml = entry.getData().toString("utf8");
      // Extract text within <a:t> tags
      const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
      if (matches) {
        for (const match of matches) {
          const content = match.replace(/<\/?a:t>/g, "");
          text += content + " ";
        }
      }
      text += "\n";
    }
    return text.trim();
  } catch (err) {
    console.error("PPTX Parsing Error:", err);
    return "Error parsing PowerPoint file.";
  }
}

// Helper: Clean and Parse JSON from LLM markdown fences
function parseJSONFromResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Mock generator for fallback when API Key is missing
function generateMockSummary(filename: string, mimeType: string) {
  return {
    title: filename.replace(/\.[^/.]+$/, ""),
    documentType: mimeType.includes("pdf")
      ? "PDF Document"
      : mimeType.includes("word")
      ? "Word Document"
      : mimeType.includes("presentation")
      ? "PowerPoint Slides"
      : "Image / Scan",
    executiveSummary: `This is a mock evaluation summary for '${filename}'. To enable real multi-modal Gemini analysis, please configure your GEMINI_API_KEY in the Secrets panel. This document appears to contain technical metrics, project architectures, and core requirements relevant to the evaluation scope.`,
    keyTakeaways: [
      "Simulated Key Takeaway 1: High-throughput microservice architecture deployment with minimal latency.",
      "Simulated Key Takeaway 2: AWS App Runner configuration maps external HTTPS requests cleanly to Port 3000.",
      "Simulated Key Takeaway 3: Security credentials and API keys are strictly confined to the backend container.",
      "Simulated Key Takeaway 4: Multi-stage Docker builds reduce overall container footprint by 65%.",
      "Simulated Key Takeaway 5: React frontend provides beautiful transitions with motion and fluid flex layouts."
    ],
    actionItems: [
      "Review Dockerfile and docker-compose configurations in the repository root.",
      "Deploy the containerized application to AWS Elastic Beanstalk or ECS.",
      "Inject the real GEMINI_API_KEY securely using AWS Secrets Manager.",
      "Validate WebSocket and Server-Sent Event streaming protocols in the target environment."
    ],
    fileStats: {
      pages: "1",
      wordCount: "148",
      readingTime: "1 min"
    }
  };
}

/* ==========================================
   API ENDPOINTS
   ========================================== */

// 0. Google Authentication Verify & Session Endpoint
app.get("/api/auth/session", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }
    const accessToken = authHeader.substring(7);
    const googleUser = await getGoogleUser(accessToken);
    res.json({ user: googleUser });
  } catch (error: any) {
    console.error("Auth session validation failed:", error?.message || error);
    res.status(401).json({ error: error?.message || "Invalid or expired token" });
  }
});

// 1. File Upload & Ingestion Route
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, mimetype, buffer, size } = req.file;
    const docId = crypto.randomUUID();

    // Check for Google OAuth Access Token in Authorization Header
    let driveFileId: string | undefined = undefined;
    let driveViewLink: string | undefined = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.substring(7);
      try {
        console.log(`OAuth access token detected. Storing '${originalname}' directly in user's Google Drive...`);
        const driveResult = await uploadFileToDrive(accessToken, originalname, mimetype, buffer);
        driveFileId = driveResult.id;
        driveViewLink = driveResult.webViewLink;
        console.log(`Successfully uploaded to Google Drive. File ID: ${driveFileId}`);
      } catch (driveErr: any) {
        console.error("Google Drive Upload failed, continuing with standard local pipeline fallback:", driveErr?.message || driveErr);
      }
    }

    let rawText = "";
    let base64Data = "";

    // Parse files based on type
    if (mimetype === "application/pdf" || mimetype.startsWith("image/")) {
      // Keep base64 format for Gemini inlineData
      base64Data = buffer.toString("base64");
      rawText = `[Multi-modal binary file: ${originalname}]`;
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Word DOCX extraction
      const docxResult = await mammoth.extractRawText({ buffer });
      rawText = docxResult.value;
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      // PPTX extraction
      rawText = extractTextFromPptx(buffer);
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || originalname.endsWith(".xlsx")) {
      // XLSX extraction
      const workbook = xlsx.read(buffer, { type: "buffer" });
      let extracted = "";
      workbook.SheetNames.forEach((sheetName) => {
        extracted += `--- Sheet: ${sheetName} ---\n`;
        extracted += xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        extracted += "\n\n";
      });
      rawText = extracted;
    } else if (mimetype === "text/csv" || originalname.endsWith(".csv")) {
      // CSV extraction
      rawText = buffer.toString("utf8");
    } else {
      // Fallback for TXT/Markdown/JSON etc
      rawText = buffer.toString("utf8");
    }

    let summary: any = null;

    if (ai) {
      try {
        const systemPrompt = `You are an expert Document Analyst. Analyze the attached document and provide a highly professional, comprehensive analysis.
Format your response as a JSON object with the following fields:
- title: string (the document title or a descriptive title)
- documentType: string (e.g. PDF Report, Image Invoice, Word Essay, PowerPoint Slides)
- executiveSummary: string (a concise 3-4 sentence high-level overview)
- keyTakeaways: string[] (5 bullet points of key details, metrics, or points)
- actionItems: string[] (3-5 concrete next steps, actionable advice, or recommendations)
- fileStats: {
    pages: string,
    wordCount: string,
    readingTime: string
  }

Ensure the response is valid, parseable JSON. Do not include any text before or after the JSON. Return ONLY the raw JSON block without markdown code fences or backticks.`;

        let response;
        if (mimetype === "application/pdf" || mimetype.startsWith("image/")) {
          // Pass PDF/Image as inlineData directly to multi-modal Gemini!
          response = await generateContentWithRetry({
            model: "gemini-3.1-flash-lite",
            contents: [
              {
                inlineData: {
                  mimeType: mimetype,
                  data: base64Data,
                },
              },
              systemPrompt,
            ],
          });
        } else {
          // Pass extracted text
          response = await generateContentWithRetry({
            model: "gemini-3.1-flash-lite",
            contents: `Document Content:\n${rawText}\n\n${systemPrompt}`,
          });
        }

        const textOutput = response.text || "";
        summary = parseJSONFromResponse(textOutput);
      } catch (geminiError) {
        console.error("Gemini Ingestion analysis failed, using mock summary fallback:", geminiError);
        summary = generateMockSummary(originalname, mimetype);
      }
    } else {
      // Mock mode
      summary = generateMockSummary(originalname, mimetype);
    }

    // Save document to in-memory store
    const newDoc: DocumentStoreItem = {
      id: docId,
      name: originalname,
      mimeType: mimetype,
      size,
      rawText,
      base64Data: base64Data || undefined,
      summary,
      createdAt: new Date().toISOString(),
      driveFileId,
      driveViewLink,
    };

    documents.set(docId, newDoc);

    res.json({
      id: docId,
      name: originalname,
      mimeType: mimetype,
      size,
      summary,
      createdAt: newDoc.createdAt,
      driveFileId,
      driveViewLink,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error" });
  }
});

// 2. Chat with Document Stream Route (Progressive Text Rendering via SSE)
app.post("/api/chat", async (req, res) => {
  const { fileId, message, history } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId" });
  }

  const doc = documents.get(fileId);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  // Configure response headers for Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!ai) {
    // Return mock response stream
    const mockResponses = [
      "Hello! I am running in mock evaluation mode because GEMINI_API_KEY is not defined. ",
      "Your uploaded file is safe and has been parsed securely on the server. ",
      `The file is named '${doc.name}' (${doc.mimeType}) with a size of ${(doc.size / 1024).toFixed(1)} KB. `,
      "\n\nIn real mode, this response streams dynamically chunk-by-chunk from Gemini using SSE. ",
      "Let me know if you would like to test the visual dashboard and interactive quiz widgets!"
    ];

    for (const chunk of mockResponses) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  try {
    // Set up chat contents with history and context
    const chatContents: any[] = [];

    // System instruction to bind Gemini to the document context
    const docContext = doc.rawText && doc.rawText.length > 50 
      ? `Document Context:\n${doc.rawText}\n\n`
      : `Document Name: ${doc.name}\nMimeType: ${doc.mimeType}\n\n`;

    const systemInstruction = `You are an expert interactive assistant analyzing a document. Your user is querying: '${doc.name}'.
Use the following context to answer their questions. Be precise, professional, and clear.
${docContext}`;

    // Map conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        chatContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Prepare current turn
    let currentParts: any[] = [];

    // If it's a multi-modal PDF/image, we can pass it alongside the user message on the first query
    if (chatContents.length === 0 && doc.base64Data && (doc.mimeType === "application/pdf" || doc.mimeType.startsWith("image/"))) {
      currentParts.push({
        inlineData: {
          mimeType: doc.mimeType,
          data: doc.base64Data,
        }
      });
    }

    currentParts.push({ text: message });
    chatContents.push({ role: "user", parts: currentParts });

    // Call streaming API
    const responseStream = await generateContentStreamWithRetry({
      model: "gemini-3.1-flash-lite",
      contents: chatContents,
      config: {
        systemInstruction,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text || "";
      // Split keeping whitespace to preserve formatting, and add a small delay to simulate typing effect
      const tokens = text.split(/(?=\s+)/);
      for (const token of tokens) {
        res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Gemini stream error:", error);
    res.write(`data: ${JSON.stringify({ error: error?.message || "Streaming failed" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// 3. Quiz & Flashcards Generator Route
app.post("/api/quiz", async (req, res) => {
  try {
    const { fileId, type = "quiz" } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: "Missing fileId" });
    }

    const doc = documents.get(fileId);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!ai) {
      // Return beautiful mock quiz
      const mockQuiz = {
        quiz: [
          {
            id: 1,
            question: "What is the primary target port for this application according to its environment constraints?",
            options: ["Port 8080", "Port 5173", "Port 3000", "Port 80"],
            correctAnswer: "Port 3000",
            explanation: "Port 3000 is the only externally accessible port in this sandboxed environment, managed by the custom Nginx reverse proxy layer."
          },
          {
            id: 2,
            question: "Which of the following frameworks is utilized in the production backend server boilerplate?",
            options: ["Python FastAPI", "Java Spring Boot", "Ruby on Rails", "Express Node.js"],
            correctAnswer: "Python FastAPI",
            explanation: "The user's architectural specification calls for a Python FastAPI backend to handle API routing, parsing, and business logic."
          },
          {
            id: 3,
            question: "What tool should be used to stream responses progressively from the LLM?",
            options: ["WebSockets", "Server-Sent Events (SSE)", "Long Polling", "Static Webhook JSON"],
            correctAnswer: "Server-Sent Events (SSE)",
            explanation: "Server-Sent Events are ideal for streaming textual chatbot data chunk-by-chunk in real-time, reducing user perceived latency."
          }
        ],
        flashcards: [
          {
            id: 1,
            front: "Secure Environment Variables (.env)",
            back: "All sensitive Gemini API keys and credentials must be configured on the server side, never exposed to the client browser bundle."
          },
          {
            id: 2,
            front: "Multi-Stage Dockerfile",
            back: "Builds production assets in a builder container, then copies only optimized code to the final container, saving footprint and memory."
          },
          {
            id: 3,
            front: "AWS App Runner Support",
            back: "Allows developer to map and deploy a single docker container, automatically handling SSL configuration and scaling out of the box."
          }
        ]
      };
      return res.json({ [type]: mockQuiz[type as keyof typeof mockQuiz] });
    }

    let systemPrompt = "";
    if (type === "quiz") {
      systemPrompt = `Analyze the content of the attached document and generate an interactive multiple-choice quiz (exactly 5 questions, with 4 options each, a correct answer, and an explanation).
Format your response as a valid JSON object with the following schema:
{
  "quiz": [
    {
      "id": number,
      "question": string,
      "options": string[],
      "correctAnswer": string,
      "explanation": string
    }
  ]
}
Ensure the correctAnswer EXACTLY matches one of the values in the options array. Do not include any text before or after the JSON. Return ONLY the raw JSON block without markdown code fences or backticks.`;
    } else {
      systemPrompt = `Analyze the content of the attached document and generate a list of interactive flashcards (exactly 5 cards with a 'front' concept/question and a 'back' definition/answer) summarizing key terms.
Format your response as a valid JSON object with the following schema:
{
  "flashcards": [
    {
      "id": number,
      "front": string,
      "back": string
    }
  ]
}
Do not include any text before or after the JSON. Return ONLY the raw JSON block without markdown code fences or backticks.`;
    }

    let response;
    if (doc.base64Data && (doc.mimeType === "application/pdf" || doc.mimeType.startsWith("image/"))) {
      response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: [
          {
            inlineData: {
              mimeType: doc.mimeType,
              data: doc.base64Data,
            },
          },
          systemPrompt,
        ],
      });
    } else {
      response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: `Document Content:\n${doc.rawText}\n\n${systemPrompt}`,
      });
    }

    const textOutput = response.text || "";
    const quizData = parseJSONFromResponse(textOutput);
    res.json(quizData);
  } catch (error: any) {
    console.error("Quiz generation failed:", error);
    res.status(500).json({ error: error?.message || "Failed to generate quiz" });
  }
});

// 4. Translate Document Content Route
app.post("/api/translate", async (req, res) => {
  try {
    const { fileId, targetLanguage } = req.body;
    if (!fileId || !targetLanguage) {
      return res.status(400).json({ error: "Missing fileId or targetLanguage" });
    }

    const doc = documents.get(fileId);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!ai) {
      // Mock translated markdown response
      return res.json({
        translatedText: `### [MOCK TRANSLATION INTO ${targetLanguage.toUpperCase()}]
        
**Title / Título:** ${doc.summary?.title || doc.name}

**Type / Tipo:** ${doc.summary?.documentType || "Document"}

#### Executive Summary / Resumen Ejecutivo:
*(Translated to ${targetLanguage})*
This is a mock translation of the executive summary for '${doc.name}'. Please configure your server's Gemini API Key in the Settings to get high-accuracy multi-lingual translations powered by Gemini.

#### Key Takeaways / Puntos Clave:
- **Takeaway 1:** Translated bullet point outlining architectural container patterns.
- **Takeaway 2:** AWS App Runner deploys with complete security groups mapping to exposed Port 3000.
- **Takeaway 3:** Express handles static assets serving with low-latency CDN.`,
      });
    }

    const systemPrompt = `You are a professional document translator. Translate the following structured summary analysis of the document into: '${targetLanguage}'.
Format your output in clean, gorgeous markdown including Title, Executive Summary, Key Takeaways, and Action Items. Maintain a highly professional business tone.

Document Summary Details:
${JSON.stringify(doc.summary)}`;

    const response = await generateContentWithRetry({
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
    });

    res.json({ translatedText: response.text || "Translation failed." });
  } catch (error: any) {
    console.error("Translation failed:", error);
    res.status(500).json({ error: error?.message || "Failed to translate document" });
  }
});

/* ==========================================
   VITE & STATIC FILE SERVING
   ========================================== */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite in development mode as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Document Analyzer server running on http://localhost:${PORT}`);
  });
}

startServer();
