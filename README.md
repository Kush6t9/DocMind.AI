# DocMind AI

> An intelligent, full-stack document analysis suite featuring streaming chat, interactive study tools, and multi-lingual translations.

**[Live App](YOUR_URL_HERE)**

---

## Features

- **Multi-Format Uploads**: Support for PDF, Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), Images, and Text files.
- **Streaming Chat**: Chat with your documents in natural language, featuring a real-time, token-by-token typing effect.
- **One-Click Analysis**: Instantly generate structured executive summaries and key takeaways.
- **Interactive Study Tools**: Generate multiple-choice practice quizzes and interactive concept flashcards automatically.
- **Translation Studio**: Localize your document insights into multiple world languages.
- **Cloud Sync**: Securely backup ingested files to your personal Google Drive via implicit OAuth.

*(Note: This is an MVP designed to demonstrate full-stack AI integration and responsive UI/UX.)*

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Motion |
| **Backend** | Node.js, Express.js |
| **LLM Integration** | Google Gemini API (via `@google/genai` SDK) |
| **File Parsing** | Mammoth (DOCX), SheetJS (Excel), native parsers |
| **Deployment** | Docker, Docker Compose, AWS Elastic Beanstalk (Target) |

---

## Architecture Overview

Requests flow from the user's browser (React SPA) to the monolithic **Node.js Express backend**. The backend parses the uploaded files using specialized libraries (e.g., Mammoth for Word, SheetJS for Excel) and passes the extracted text as context to the **Google Gemini API**. For chat features, the LLM response is streamed back to the browser dynamically using **Server-Sent Events (SSE)**. 

**State Management**: The application utilizes an in-memory, session-based state design (a dictionary Map keyed by `fileId`). As a known limitation, uploaded document contexts and chat histories will reset whenever the server container restarts.

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js (v18+)
- Docker (optional, but recommended)

### 1. Clone & Configure
```bash
git clone https://github.com/YOUR_USERNAME/Analyzer.AI.git
cd Analyzer.AI/frontend
```
Create a `.env` file in the `frontend` directory (you can use `.env.example` as a reference):
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 2. Run Locally (Manual)
```bash
npm install
npm run build
npm run start
```
*For development with hot-reloading, run `npm run dev`.*

### 3. Run via Docker
To launch the unified full-stack container:
```bash
cd ..
docker-compose up --build -d
```
The application will be accessible at **http://localhost:3000**.

---

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API key used for all LLM inference and generation tasks. |

---

## API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload` | Ingests and parses documents, returning a structured summary and saving them in the memory cache. |
| `POST` | `/api/chat` | Receives a user query and streams the LLM response back to the client using SSE. |
| `POST` | `/api/quiz` | Generates a structured multiple-choice quiz or flashcard set based on the document text. |
| `POST` | `/api/translate` | Translates the document summary into the user's target language. |

---

## Deployment

This application is containerized using Docker, combining the React frontend and Express backend into a single image. It is designed to be easily deployed to **AWS Elastic Beanstalk** (Docker platform). Deploying simply requires uploading the bundled source code (or a pre-built Docker image) to a free-tier EC2 instance via the Elastic Beanstalk console, ensuring the `GEMINI_API_KEY` is set in the AWS environment variables.

---

## Known Limitations

- **In-Memory State**: There is no persistent database configured. Document text and chat histories are stored in active server memory and will be lost if the container reboots.
- **Single-Node Architecture**: Without a shared Redis cache or persistent database, this app cannot currently be horizontally scaled across multiple instances.
- **Authentication Scope**: While Google OAuth is used for Drive synchronization, there is no advanced multi-user session management or row-level security for uploaded files. 

These architectural decisions were made to prioritize rapid MVP delivery and focus on the AI integration layer over complex infrastructure.

---

## Built With AI

This project was developed using AI-assisted "Vibe Coding" techniques. Advanced LLM coding assistants were actively used to rapidly prototype the React UI, architect the monolithic Node.js backend, wire up the streaming Gemini integrations, and containerize the final deployment environment. 

---

## License

[Placeholder: Please insert MIT or "Academic project — not licensed for reuse" depending on your course requirements]
