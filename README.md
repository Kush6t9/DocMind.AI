<div align="center">

<img src="assets/logo.png" alt="DocMind.AI Logo" width="360" style="margin-bottom: 10px;"/>

### The Intelligent AI Document Companion & Study Suite

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.x-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Google Gemini](https://img.shields.io/badge/Gemini-SDK-blue?style=flat&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

[Explore features](#-key-features) • [Get Started](#-getting-started--setup) • [Architecture](#-system-architecture)

</div>

---

DocMind.AI is a premium, full-stack document analyzer designed to process, extract, and convert static documents into active knowledge repositories. Backed by a high-performance **Monolithic Node.js (Express + Vite)** service, and powered by **Google Gemini models**, DocMind.AI delivers live synopsis, semantic chat, multi-lingual translations, and interactive practice suites.

---

## ⚡ System Architecture

```mermaid
graph TD
    User([User Client]) <-->|React Vite SPA: Port 3000| Server[Node.js Express Server]
    Server <-->|Multi-Modal Ingestion| Gemini[Google Gemini API]
    Server <-->|OAuth / File Backup| GDrive[Google Drive API]
```

---

## ✨ Key Features

DocMind.AI provides a series of high-level features built to streamline document consumption:

### 📂 Smart Library Dashboard
- **Translucent Drag & Drop Ingestion**: Upload files instantly with active tracking of file size and ingest progress.
- **Persistent Inventory**: Saves your inventory across refreshes via local storage syncing.
- **Analytics Metrics**: Real-time evaluation dashboard tracking total documents, total read pages, AI answers, and response latency.

### 🛠️ Evaluation Studio (Document Workspace)
Each uploaded document receives a fully insulated, viewport-fitted workspace featuring a custom horizontal tab controller:
- **💬 Streamed Interactive Chat**: Query document details in natural language with token-by-token server-sent events (SSE) and strict citations.
- **📄 Executive Summary**: View a structured summary presenting document objectives, target takeaways, and action points.
- **📌 Key Insights**: Dig into detailed bullet points representing core semantic structures.
- **🧠 Quiz Generator**: Synthesize multiple-choice interactive exams based on document claims.
- **🎓 Concept Flashcards**: Flip and study concepts with 3D transition interactive flashcards.
- **🌐 Translation Studio**: Instantly localize summaries, definitions, and questions into twelve world languages.
- **💾 Export Notes**: Download a complete compilation of your synopsis, takeaways, and quiz scores as clean Markdown logs.

### ☁️ Cloud Drive Synchronization
- **Implicit Google OAuth**: Login directly with your Google account.
- **Secure Backup**: Automatically sync and backup ingested files directly into your personal Google Drive account in a designated `DocMind.ai Workspace` folder.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React SPA, TypeScript, Vite, Tailwind CSS, Motion, Lucide Icons |
| **Backend** | Node.js (Express.js), Google GenAI SDK, Multer, SSE |
| **File Parsers** | PyPDF (PDF text), Mammoth (DOCX structure), native Zip/XML parser (PPTX slides) |

---

## 📁 Repository Structure

```text
├── Dockerfile                # Docker setup for full-stack build
├── frontend/                 # React Client Application
│   ├── src/
│   │   ├── components/      # UI components (ChatInterface, QuizView, etc.)
│   │   ├── App.tsx          # Workspace Router & Root Controller
│   │   ├── index.css        # Tailwind directives & CSS Grid definitions
│   │   └── types.ts         # TypeScript structural definitions
│   ├── index.html           # Document HTML entrypoint
│   └── package.json         # Node build scripts
├── LICENSE                   # MIT License
└── README.md                 # Documentation
```

---

## ⚙️ Getting Started & Setup

Follow these steps to deploy a local instance of DocMind.AI for development:

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com))

---

### 💻 Local Installation Guide

#### 1. Configure Environment
Create a `.env` file in the `frontend` folder and add your Gemini API Key:
```env
GEMINI_API_KEY="YourGeminiAPIKeyHere"
```

#### 2. Run with Docker (Recommended)
You can launch the entire unified stack via Docker:
```bash
docker-compose up --build -d
```
The application will be live at **[http://localhost:3000](http://localhost:3000)**.

#### 3. Run Manually for Development
1. Open a terminal instance and enter the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.


