<div align="center">

# Analyzer.AI
### The Intelligent AI Document Companion & Study Suite

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Google Gemini](https://img.shields.io/badge/Gemini-SDK-blue?style=flat&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

Analyzer.AI is a premium, full-stack document analyzer designed to instantly convert static documents into active knowledge repositories. Powered by a monolithic **Node.js (Express + Vite)** architecture and advanced AI models, Analyzer.AI delivers live synopses, semantic streaming chats, multi-lingual translations, and interactive study suites.

</div>

---

## ✨ Features

- **Multi-Format Ingestion**: Drag & drop support for PDF, Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), Images, and Text files (`.txt`, `.csv`).
- **Interactive Streaming Chat**: Query documents in natural language with real-time, token-by-token streaming output.
- **Evaluation Studio**: View structured executive summaries, semantic takeaways, and automated action items.
- **Dedicated Study Tools**: Independently generate multiple-choice practice quizzes and concept flashcards.
- **Translation Studio**: Instantly localize summaries and insights into multiple world languages.
- **Cloud Synchronization**: Integrated Google OAuth with secure backups directly to your Google Drive.

---

## 🛠️ Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React, TypeScript, Vite, Tailwind CSS, Motion, Lucide Icons |
| **Backend Server** | Node.js (Express), Google GenAI SDK, Multer, Server-Sent Events (SSE) |
| **File Parsing** | PyPDF, Mammoth (DOCX), SheetJS (Excel), native Zip/XML (PPTX) |
| **Deployment** | Docker, Docker Compose |

---

## 🚀 Quick Start

You can run Analyzer.AI locally either through Docker (recommended) or via a manual Node.js setup.

### Prerequisites
- **Google Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com).

### 1. Configure Environment
Create a `.env` file in the root `frontend/` directory and add your API key:
```env
GEMINI_API_KEY="YourGeminiAPIKeyHere"
```

### 2. Run with Docker (Recommended)
Launch the unified full-stack application instantly using Docker:
```bash
docker-compose up --build -d
```
The application will be live at: **http://localhost:3000**

### 3. Run Manually for Development
Ensure you have Node.js 18+ installed.

```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to **http://localhost:3000**.

---

## 📁 Project Structure

```text
├── assets/                  # Brand assets and images
├── frontend/                # Full-Stack Application Directory
│   ├── src/                 # React UI Components and Application Logic
│   ├── package.json         # Node build scripts and dependencies
│   ├── server.ts            # Monolithic Node.js/Express Server & API Routes
│   └── vite.config.ts       # React Vite Bundler Configuration
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Production Compose deployment file
├── Dockerfile               # Docker configuration for monolithic build
└── README.md                # Project documentation
```

---

<div align="center">
<i>Analyzer.AI — Built for intelligent document analysis and high-performance studying.</i>
</div>
