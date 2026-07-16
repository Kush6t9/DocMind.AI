# Analyzer.AI 📄🤖

Analyzer.AI is an intelligent full-stack AI Document Analyzer designed to process, extract, and analyze information from documents seamlessly. Built with a robust Python backend and a fast, modern React/TypeScript frontend, the entire application is containerized and orchestrated via Docker for a streamlined developer experience.

## 🚀 Architecture Overview

The project uses a clean monorepo structure separating the specialized backend logic from the user-facing interface:

*   **`/backend`**: A Python-based service handling core data extraction, Google Drive integrations (`drive_service.py`), authentication protocols (`auth.py`), and main execution routing (`main.py`).
*   **`/frontend`**: A highly responsive Single Page Application (SPA) built using **React**, **TypeScript**, and **Vite**, featuring reusable functional UI pieces under `src/components/`.
*   **Containerization**: Managed globally from the root using **Docker Compose** to run both services simultaneously without dependency collision.

---

## 🛠️ Technology Stack

*   **Frontend**: React, TypeScript, Vite, Bun (or NPM), Nginx (for production routing)
*   **Backend**: Python, Google Drive Workspace API
*   **DevOps**: Docker, Docker Compose

---

## 📁 Repository Structure

```text
├── backend/                  # Python Service
│   ├── auth.py              # Authentication logic
│   ├── drive_service.py     # Google Drive integration
│   ├── main.py              # Application entry point
│   └── requirements.txt     # Python dependencies
├── frontend/                 # React SPA Service
│   ├── src/
│   │   ├── components/      # Reusable UI elements
│   │   ├── App.tsx          # Main React component
│   │   └── main.tsx         # App mount point
│   ├── .env.example         # Environment template for frontend
│   ├── nginx.conf           # Reverse proxy / routing config
│   ├── package.json         # Package configuration
│   └── tsconfig.json        # TypeScript configuration
├── docker-compose.yml        # Multi-container orchestrator
└── README.md                 # Project documentation
⚙️ Getting Started & Setup
Prerequisites
Ensure you have the following installed on your local machine:

Docker Desktop

Node.js (or Bun)

Python 3.10+

1. Clone the Repository
Bash
git clone [https://github.com/Kush6t9/Analyzer.AI.git](https://github.com/Kush6t9/Analyzer.AI.git)
cd Analyzer.AI
2. Configure Environment Variables
Copy the template configuration inside the frontend directory and populate it with your specific service keys:

Bash
cp frontend/.env.example frontend/.env
Open frontend/.env and configure your backend endpoint and any required Firebase or third-party client integrations:

Code snippet
VITE_API_URL=http://localhost:8000
# Add other necessary frontend environment variables here
If your Python backend handles direct credential files (like a Google Service Account credentials.json for drive_service.py), place them into the /backend folder according to your local environment instructions.

🐳 Running the App with Docker (Recommended)
To spin up both the React frontend and the Python backend concurrently with a single command, run the following from the project root:

Bash
docker-compose up --build
Frontend Server: Accessible at http://localhost:3000 (or the port mapped in your compose file).

Backend API Service: Accessible at http://localhost:8000.

💻 Manual Local Development
If you prefer running the services bare-metal without Docker container isolation:

Starting the Backend (Python)
Navigate into the backend directory:

Bash
cd backend
Create and activate a virtual environment:

Bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
Install dependencies and run:

Bash
pip install -r requirements.txt
python main.py
Starting the Frontend (Vite + React)
Open a new terminal window and navigate to the frontend directory:

Bash
cd frontend
Install dependencies using your preferred package manager:

Bash
npm install  # OR bun install
Start the dev server:

Bash
npm run dev  # OR bun run dev
🤝 Contribution Guidelines
Branching: Always create a feature branch off main for individual features (git checkout -b feature/amazing-feature).

Environment Protection: Never commit .env files or secrets to GitHub. Always update .env.example if you add new environment variable requirements.

Monorepo Etiquette: Ensure Docker configuration updates are kept at the root, frontend settings within /frontend, and core algorithms within /backend.
