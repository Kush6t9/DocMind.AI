import os
import uuid
import json
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Try to import Gemini SDK if installed, otherwise prepare signature
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

# Try to import file parsers
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx2txt
except ImportError:
    docx2txt = None

app = FastAPI(
    title="AI Document Analyzer Backend",
    description="AWS Production-Grade FastAPI service for file ingestion, parsing, and streaming Gemini LLM analysis.",
    version="1.0.0"
)

# Configure CORS for decoupled frontend deployment (e.g. AWS S3/CloudFront)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual AWS domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Python Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if genai and GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

# In-memory session database for storing parsed document text and cache metadata
documents_db: Dict[str, Dict[str, Any]] = {}

# Data structures
class ChatRequest(BaseModel):
    fileId: str
    message: str
    history: Optional[List[Dict[str, str]]] = []

class QuizRequest(BaseModel):
    fileId: str

class TranslateRequest(BaseModel):
    fileId: str
    targetLanguage: str

# Helper: Parse PDF
def parse_pdf(file_bytes: bytes) -> str:
    if not pypdf:
        return "[PDF library not available in sandbox, using text stub]"
    try:
        from io import BytesIO
        reader = pypdf.PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        return f"[PDF parsing error: {str(e)}]"

# Helper: Parse DOCX
def parse_docx(file_bytes: bytes) -> str:
    if not docx2txt:
        return "[DOCX library not available in sandbox, using text stub]"
    try:
        from io import BytesIO
        # docx2txt takes file path or file-like object
        return docx2txt.process(BytesIO(file_bytes))
    except Exception as e:
        return f"[DOCX parsing error: {str(e)}]"

# Helper: Clean and Parse JSON blocks from LLM markdown
def parse_llm_json(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    return json.loads(cleaned)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "aws_deployment_compatible": True,
        "gemini_sdk_loaded": client is not None
    }

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        file_id = str(uuid.uuid4())
        contents = await file.read()
        mime_type = file.content_type
        filename = file.filename
        
        raw_text = ""
        base64_data = ""

        # Router parsing depending on MIME
        if mime_type == "application/pdf" or mime_type.startswith("image/"):
            import base64
            base64_data = base64.b64encode(contents).decode("utf-8")
            raw_text = f"[Binary Document: {filename}]"
            # Extract PDF text if pypdf is active
            if mime_type == "application/pdf":
                raw_text += "\n" + parse_pdf(contents)
        elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or filename.endswith(".docx"):
            raw_text = parse_docx(contents)
        else:
            # Fallback text
            raw_text = contents.decode("utf-8", errors="ignore")

        # Ingestion analytics summary using Gemini
        summary = None
        if client:
            try:
                system_prompt = (
                    "You are an expert Document Analyst. Analyze the attached document and provide a highly professional, comprehensive analysis. "
                    "Format your response as a JSON object with fields: title, documentType, executiveSummary, keyTakeaways (list), actionItems (list), fileStats (dict with pages, wordCount, readingTime)."
                )
                
                if mime_type == "application/pdf" or mime_type.startswith("image/"):
                    # Use Python GenAI multi-modal API
                    response = client.models.generate_content(
                        model='gemini-3.5-flash',
                        contents=[
                            types.Part.from_bytes(
                                data=contents,
                                mime_type=mime_type,
                            ),
                            system_prompt
                        ]
                    )
                else:
                    response = client.models.generate_content(
                        model='gemini-3.5-flash',
                        contents=f"Document Text Content:\n{raw_text}\n\n{system_prompt}"
                    )
                
                summary = parse_llm_json(response.text)
            except Exception as e:
                summary = {"error": f"LLM analysis failed: {str(e)}"}
        
        # In case Gemini client or analysis is not active, build mock overview
        if not summary or "error" in summary:
            summary = {
                "title": filename.rsplit(".", 1)[0],
                "documentType": "Document (Parsed)",
                "executiveSummary": "This summary is produced in offline fallback mode. Please ensure the GEMINI_API_KEY environment variable is configured in the AWS deployment environment to activate real AI parsing.",
                "keyTakeaways": [
                    "AWS App Runner routes ingress traffic securely to internal container portals.",
                    "FastAPI serves dynamic requests with asynchronously non-blocking Event loops.",
                    "DevOps pipeline executes multi-stage container isolation to keep size under 120MB."
                ],
                "actionItems": [
                    "Inject GEMINI_API_KEY securely using AWS Secrets Manager.",
                    "Expose FastAPI server on port 8000 (or map to single-port public proxy)."
                ],
                "fileStats": {
                    "pages": "1",
                    "wordCount": str(len(raw_text.split())),
                    "readingTime": f"{max(1, len(raw_text.split()) // 200)} min"
                }
            }

        # Cache file mapping
        documents_db[file_id] = {
            "id": file_id,
            "name": filename,
            "mimeType": mime_type,
            "rawText": raw_text,
            "base64Data": base64_data,
            "summary": summary
        }

        return {
            "id": file_id,
            "name": filename,
            "mimeType": mime_type,
            "size": len(contents),
            "summary": summary
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion pipeline crashed: {str(e)}"
        )

@app.post("/api/chat")
async def chat_with_document_stream(request: ChatRequest):
    file_id = request.fileId
    doc = documents_db.get(file_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not client:
        # Mock streaming response generator
        async def mock_generator():
            chunks = [
                "This is a progressive stream simulation from your Python FastAPI backend.\n\n",
                f"You asked about document '{doc['name']}' in AWS evaluation mode.\n",
                "Ensure your target AWS deployment injects the actual GEMINI_API_KEY to activate multi-modal streaming!"
            ]
            for c in chunks:
                yield f"data: {json.dumps({'text': c})}\n\n"
                await asyncio.sleep(0.4)
            yield "data: [DONE]\n\n"

        return StreamingResponse(mock_generator(), media_type="text/event-stream")

    try:
        # Construct chat message parts
        contents = []
        
        # Inject system instruction to ground the AI model on document content
        doc_context = f"Document Name: {doc['name']}\nContext:\n{doc['rawText'][:15000]}"
        system_instruction = f"You are a professional Document Analyst. Answer questions strictly based on the following document context:\n{doc_context}"

        # Setup history
        for msg in request.history:
            contents.append(
                types.Content(
                    role="user" if msg["role"] == "user" else "model",
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )

        # Append current user prompt
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=request.message)]
            )
        )

        # Call python streaming model
        response_stream = client.models.generate_content_stream(
            model='gemini-3.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )

        async def python_stream_generator():
            try:
                for chunk in response_stream:
                    text_part = chunk.text or ""
                    yield f"data: {json.dumps({'text': text_part})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as stream_err:
                yield f"data: {json.dumps({'error': str(stream_err)})}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(python_stream_generator(), media_type="text/event-stream")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Chat stream broke: {str(e)}")

@app.post("/api/quiz")
async def generate_document_quiz(request: QuizRequest):
    doc = documents_db.get(request.fileId)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not client:
        # Mock structured quiz return
        return {
            "quiz": [
                {
                    "id": 1,
                    "question": "What port does the container expose by default for ingress mapping?",
                    "options": ["Port 8000", "Port 3000", "Port 5000", "Port 8080"],
                    "correctAnswer": "Port 3000",
                    "explanation": "Vite dev server is bound to Port 3000 as the only open port in this runtime environment."
                }
              ],
            "flashcards": [
                {
                    "id": 1,
                    "front": "CORS",
                    "back": "Cross-Origin Resource Sharing is essential for decoupled AWS deployments to connect frontend and backend."
                }
            ]
        }

    try:
        system_prompt = (
            "Analyze the attached document context and generate an interactive study bundle. "
            "Return a JSON object with 'quiz' (exactly 5 multiple choice questions with 4 options, a correctAnswer matching an option, and an explanation) "
            "and 'flashcards' (exactly 5 items with 'front' and 'back' fields)."
        )

        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=f"Document Context:\n{doc['rawText'][:15000]}\n\n{system_prompt}"
        )
        
        quiz_data = parse_llm_json(response.text)
        return quiz_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@app.post("/api/translate")
async def translate_document(request: TranslateRequest):
    doc = documents_db.get(request.fileId)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not client:
        return {
            "translatedText": f"### Translated Overview into {request.targetLanguage}\n\nThis is a simulated cross-lingual translation output of the document summary for '{doc['name']}' in fallback evaluation mode."
        }

    try:
        prompt = (
            f"Translate the following document summary into {request.targetLanguage}. "
            f"Format beautiful Markdown including Title, Executive Synopsis, and key bullets.\n\n"
            f"Source Summary: {json.dumps(doc['summary'])}"
        )

        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt
        )
        return {"translatedText": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
