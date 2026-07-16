# DocMind.ai 📄🤖

DocMind.ai is an intelligent full-stack AI Document Companion designed to process, extract, and analyze information from documents seamlessly. It features a modern, beautiful, and minimal interface inspired by Android 16 typography and card aesthetics, backed by a robust Python FastAPI service and the Gemini API.

---

## ✨ Key Features

- **📂 Smart Library Dashboard**: Manage your complete document inventory with live analytics counting uploaded documents, pages read, AI answers, response latency, and system ingestion success rate.
- **🛠️ Workspace Evaluation Studio**: A dedicated full-screen workstation for your selected document, featuring a horizontal multi-tab interface:
  - **💬 Chat**: Ask questions about the document structure and get streaming responses (SSE).
  - **📄 Summary**: View a high-level executive synopsis, key takeaways, and action plans.
  - **📌 Key Points**: Dive deep into bulleted logical concepts.
  - **🧠 Quiz & Flashcards**: Auto-synthesize interactive multiple-choice practice exams and 3D concept flashcards.
  - **🌐 Translate**: Translate document insights instantly into multiple world languages.
  - **✨ Simplify**: Toggle plain-English translations and simple 3-bullet overviews of complex materials.
- **☁️ Google Drive Sync**: Login securely via Google OAuth to automatically sync and backup your uploaded files directly in your personal Drive folder (`DocMind.ai Workspace`).

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Motion, Lucide Icons.
- **Backend**: Python, FastAPI, Google GenAI SDK, PyPDF, Mammoth (DOCX parser).
- **Environment**: Decoupled microservices architecture with local hot-reloading.

---

## 📁 Repository Structure

```text
├── backend/                  # Python FastAPI Service
│   ├── auth.py              # Google OAuth Token Verification
│   ├── drive_service.py     # Google Drive Sync API Utilities
│   ├── main.py              # FastAPI Application & Gemini SDK Integration
│   └── requirements.txt     # Python Dependencies
├── frontend/                 # React SPA Client Service
│   ├── src/
│   │   ├── components/      # UI Dashboard Modules (Chat, Summary, Quiz, etc.)
│   │   ├── App.tsx          # Core Navigation & View Controller
│   │   ├── index.css        # Material Design tokens & Custom Scrollbars
│   │   └── main.tsx         # App Mounting Root
│   ├── index.html           # HTML Entry & Google Fonts Loading
│   └── package.json         # Node Scripts & Dependencies
├── docker-compose.yml        # Multi-container Orchestration (Optional)
└── README.md                 # Project Documentation
```

---

## ⚙️ Getting Started & Setup

### Prerequisites
Make sure you have the following installed:
- **Node.js** (v18+)
- **Python** (v3.10+)

---

### 💻 Manual Local Development

To run the services bare-metal without containerization:

#### 1. Start the Backend (FastAPI)
1. Navigate into the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Define your Gemini API Key:
   ```bash
   # Windows PowerShell:
   $env:GEMINI_API_KEY="your-api-key"
   # Windows CMD:
   set GEMINI_API_KEY="your-api-key"
   # macOS/Linux:
   export GEMINI_API_KEY="your-api-key"
   ```
5. Start the server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

#### 2. Start the Frontend (Vite)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at: **[http://localhost:3000](http://localhost:3000)**.
