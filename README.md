# StudyBuddy AI - Learning Management System

![Status](https://img.shields.io/badge/Status-Active_Development-blue.svg)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-000000.svg)
![AI](https://img.shields.io/badge/AI-Ollama_Llama3.2-FF9900.svg)

A modern, full-stack Learning Management System (LMS) enhanced with an offline Retrieval-Augmented Generation (RAG) AI Tutor. Built during a Software Development Internship at Signity Software Solutions Pvt. Ltd.

## System Architecture

StudyBuddy AI employs a decoupled client-server architecture:

1. **Client (Next.js)**: A React-based frontend providing distinct, role-routed experiences for Students and Administrators.
2. **API Gateway (FastAPI)**: A high-performance asynchronous REST API handling business logic, authentication, and database orchestration.
3. **Data Layer (PostgreSQL & ChromaDB)**: Relational data (users, courses, enrollments) is persisted in PostgreSQL via SQLAlchemy, while vector embeddings for PDF study materials are stored in a local ChromaDB instance.
4. **AI Inference (Ollama)**: Local execution of the `llama3.2:3b` and `nomic-embed-text` models, ensuring data privacy and zero API cost for AI Tutor interactions.

## Technology Stack

### Backend
* **Framework**: FastAPI (Python)
* **ORM**: SQLAlchemy
* **Database**: PostgreSQL
* **Vector Store**: ChromaDB (Local)
* **LLM & Embeddings**: Ollama, LangChain, pdfplumber
* **Security**: JWT (HS256), Bcrypt Password Hashing

### Frontend
* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript
* **Styling**: Vanilla CSS with modern Glassmorphism aesthetics
* **Icons**: Lucide React

## RAG Pipeline Workflow (AI Tutor)

The AI Tutor allows students to ask questions directly related to the course material uploaded by administrators.

1. **Ingestion**: 
   - Admin uploads a PDF document to a specific chapter.
   - The backend extracts text using `pdfplumber`, chunks it into overlapping segments via LangChain, and generates vector embeddings using Ollama's `nomic-embed-text`.
   - Chunks are stored in ChromaDB, tagged with `course_id` and `chapter_id` metadata.

2. **Retrieval**:
   - A student submits a question via the chat UI.
   - The question is embedded and a semantic similarity search is performed against ChromaDB, optionally scoped to the current chapter or course.
   
3. **Generation**:
   - The top 4 most relevant chunks are injected into a system prompt.
   - The context-augmented prompt is processed by the local `llama3.2:3b` model to generate a factually grounded response.
   - The answer, along with precise source citations, is returned to the student.

## Directory Structure

```text
intern project/
├── lms-backend/                 # FastAPI Application
│   ├── main.py                  # Application entry point
│   ├── database.py              # SQLAlchemy connection & session management
│   ├── models/                  # SQLAlchemy ORM definitions (Course, User, etc.)
│   ├── schemas/                 # Pydantic models for request/response validation
│   ├── routes/                  # API endpoints grouped by domain (auth, chat, etc.)
│   ├── services/                # Business logic (e.g., rag_service.py)
│   ├── utils/                   # Shared utilities (JWT, password hashing)
│   └── uploads/                 # Static mount for user-uploaded PDFs and media
│
└── lms-frontend/                # Next.js Application
    ├── app/                     # App Router pages (login, student/, admin/)
    ├── components/              # Reusable React components (cards, headers, sidebars)
    ├── styles/                  # Global and component-scoped CSS stylesheets
    └── public/                  # Static assets
```

## Security Considerations

- **Authentication**: JWTs are issued upon login and validated via HTTP Bearer headers on protected routes.
- **Role-Based Access Control (RBAC)**: Course creation, resource uploading, and global analytics are strictly gated behind an `admin` role check.
- **Secrets Management**: For production deployment, `SECRET_KEY` and `DATABASE_URL` must be migrated from hardcoded constants to environment variables.

## Getting Started

*(Instructions for local deployment, database migrations, and Ollama setup will be documented here prior to production release.)*
