"""
services/rag_service.py
-----------------------
Retrieval-Augmented Generation (RAG) pipeline for the AI Tutor feature.

Overview
--------
This module implements the three core operations of the RAG pipeline:

  1. Ingestion (ingest_pdf)
     - Extracts text from a PDF with pdfplumber.
     - Splits the text into overlapping chunks (~800 tokens) using
       LangChain's RecursiveCharacterTextSplitter.
     - Embeds each chunk using Ollama's nomic-embed-text model running
       locally on the host machine.
     - Stores the embedded chunks in a local ChromaDB collection
       ("studybuddy_rag") with metadata tags for course-level and
       chapter-level filtering.

  2. Retrieval + Generation (query_rag)
     - Converts the student's question to an embedding.
     - Performs a nearest-neighbour similarity search in ChromaDB,
       optionally filtered by course_id or chapter_id.
     - Assembles the top-k retrieved chunks into a structured context
       window.
     - Submits the context + question to Ollama's llama3.2:3b LLM with
       a pedagogically designed system prompt.
     - Returns the LLM answer and source citations.

  3. Deletion (delete_resource_chunks)
     - Removes all ChromaDB chunks tagged with a given resource_id,
       called when a resource is deleted via the API.

Infrastructure Requirements
---------------------------
Both Ollama (https://ollama.com) must be installed and running locally,
and the following models must be pulled before this service is used:
  - ollama pull nomic-embed-text
  - ollama pull llama3.2:3b

ChromaDB data is persisted to the `chroma_db/` directory at the
project root, relative to this file's parent. The directory is created
automatically if it does not exist.
"""

import os
import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# Absolute path to the ChromaDB persistence directory.
# Derived from this file's location so it resolves correctly regardless
# of which directory the server is launched from.
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chroma_db")

# Ollama model used for converting text to vector embeddings.
# Must be pulled locally before the service starts (ollama pull nomic-embed-text).
EMBEDDING_MODEL = "nomic-embed-text"

# Ollama LLM used for generating AI Tutor answers from retrieved context.
# Must be pulled locally before the service starts (ollama pull llama3.2:3b).
LLM_MODEL = "llama3.2:3b"


def get_vectorstore():
    """
    Returns a Chroma vector store connected to the local persistence directory.

    A new OllamaEmbeddings instance is created on each call so the function
    remains stateless and safe for concurrent request handling.

    Returns:
        Chroma: A ChromaDB vector store backed by the local persistence
                directory and the nomic-embed-text embedding model.
    """

    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL)
    return Chroma(
        collection_name="studybuddy_rag",
        persist_directory=CHROMA_DB_DIR,
        embedding_function=embeddings
    )


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts and concatenates all text from a PDF file.

    Uses pdfplumber for reliable text extraction from standard PDF layouts.
    Each page's text is prefixed with a page-number label so the LLM
    and downstream logging can trace which page a chunk originated from.

    Args:
        file_path (str): Absolute or relative path to the PDF file.

    Returns:
        str: Concatenated text across all pages, separated by double
             newlines. Returns an empty string if extraction fails or
             the PDF contains no extractable text.
    """

    text_content = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    text_content.append(f"--- Page {page_num + 1} ---\n{text}")
    except Exception as e:
        print(f"[RAG Error] Failed to extract text from {file_path}: {e}")
        return ""

    return "\n\n".join(text_content)


def ingest_pdf(file_path: str, resource_id: int, chapter_id: int, course_id: int, title: str = "") -> int:
    """
    Ingests a PDF into the ChromaDB vector store for AI Tutor retrieval.

    Extracts text from the PDF, splits it into overlapping chunks, embeds
    each chunk using the nomic-embed-text model, and writes the embedded
    documents to ChromaDB with metadata tags that enable course-level and
    chapter-level filtering during similarity searches.

    The chunk_size of 800 and chunk_overlap of 150 were tuned to balance
    context richness per chunk against the LLM's context window limit.

    Args:
        file_path   (str): Path to the PDF file on the local filesystem.
        resource_id (int): Database ID of the Resource record, used as a
                           metadata tag for deletion and filtering.
        chapter_id  (int): Database ID of the parent Chapter, enabling
                           chapter-scoped RAG queries.
        course_id   (int): Database ID of the parent Course, enabling
                           course-scoped RAG queries.
        title       (str): Display title of the resource, embedded in chunk
                           metadata for citation display in the UI.

    Returns:
        int: Number of chunks successfully ingested. Returns 0 if the file
             does not exist, contains no extractable text, or produces no
             chunks after splitting.
    """

    if not os.path.exists(file_path):
        print(f"[RAG Error] File not found: {file_path}")
        return 0

    full_text = extract_text_from_pdf(file_path)
    if not full_text.strip():
        print(f"[RAG Warning] No extractable text found in {file_path}")
        return 0

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n\n", "\n", " ", ""]
    )

    chunks = text_splitter.split_text(full_text)
    if not chunks:
        return 0

    # Build LangChain Document objects with metadata for multi-level filtering.
    # chunk_index enables ordered citation display (e.g., "Page/Section 3").
    documents = []
    for idx, chunk in enumerate(chunks):
        doc = Document(
            page_content=chunk,
            metadata={
                "resource_id": resource_id,
                "chapter_id": chapter_id,
                "course_id": course_id,
                "title": title,
                "chunk_index": idx
            }
        )
        documents.append(doc)

    vectorstore = get_vectorstore()
    vectorstore.add_documents(documents)
    print(f"[RAG Success] Ingested {len(documents)} chunks for resource {resource_id} ('{title}')")
    return len(documents)


def delete_resource_chunks(resource_id: int):
    """
    Removes all ChromaDB chunks associated with a specific resource.

    Called by DELETE /resources/:id to keep the vector store consistent
    with the database when a resource is removed. Uses ChromaDB's native
    metadata filter deletion to avoid iterating through individual chunks.

    Args:
        resource_id (int): Database ID of the resource whose chunks should
                           be purged from the vector store.
    """

    try:
        vectorstore = get_vectorstore()
        # ChromaDB supports bulk deletion by metadata filter, which avoids
        # the need to retrieve chunk IDs before deleting them.
        vectorstore._collection.delete(where={"resource_id": resource_id})
        print(f"[RAG Success] Deleted chunks for resource_id={resource_id}")
    except Exception as e:
        print(f"[RAG Warning] Failed to delete chunks for resource_id={resource_id}: {e}")


def query_rag(question: str, course_id: int = None, chapter_id: int = None, top_k: int = 4) -> dict:
    """
    Queries the RAG pipeline to answer a student's question.

    Performs a similarity search in ChromaDB using the student's question
    as the query vector, assembles the retrieved chunks into a context
    window, and sends the context + question to the local Ollama LLM for
    answer generation.

    Scoping Strategy
    ----------------
    - If chapter_id is provided, the search is scoped to that chapter.
    - If the chapter-scoped search returns no results and course_id is
      also provided, the search falls back to course-level scope.
    - If neither filter is provided, the search spans the full knowledge base.
    - On any ChromaDB error, the search retries without the metadata filter.

    Args:
        question   (str): The student's natural-language question.
        course_id  (int, optional): Limit retrieval to a specific course.
        chapter_id (int, optional): Limit retrieval to a specific chapter.
        top_k      (int): Maximum number of chunks to retrieve. Defaults to 4.

    Returns:
        dict: {
            "answer"  (str):  The LLM-generated response text.
            "sources" (list): List of source citation dicts, each containing
                              title, resource_id, chapter_id, and chunk_snippet.
        }
    """

    vectorstore = get_vectorstore()

    # Build a metadata filter dict only when scoping is requested.
    # chapter_id takes precedence over course_id when both are provided.
    filter_dict = {}
    if chapter_id is not None:
        filter_dict["chapter_id"] = chapter_id
    elif course_id is not None:
        filter_dict["course_id"] = course_id

    try:
        if filter_dict:
            docs = vectorstore.similarity_search(question, k=top_k, filter=filter_dict)
            # Fall back to course-level scope when the chapter filter finds nothing,
            # preventing a poor student experience from overly narrow queries.
            if not docs and "chapter_id" in filter_dict and course_id is not None:
                docs = vectorstore.similarity_search(question, k=top_k, filter={"course_id": course_id})
        else:
            docs = vectorstore.similarity_search(question, k=top_k)
    except Exception as e:
        print(f"[RAG Error during vector search]: {e}")
        # Retry without any filter as a last-resort fallback so the student
        # still receives a response rather than an unhandled server error.
        docs = vectorstore.similarity_search(question, k=top_k)

    if not docs:
        # Inform the LLM that no relevant materials were found so it does
        # not hallucinate course-specific content.
        context_str = "No relevant context found in uploaded study materials for this query."
        sources = []
    else:
        context_str = "\n\n".join([
            f"[Source: {d.metadata.get('title', 'Study Material')}, Page/Section {d.metadata.get('chunk_index', 0)+1}]\n{d.page_content}"
            for d in docs
        ])
        sources = [
            {
                "title": d.metadata.get("title", "Unknown Material"),
                "resource_id": d.metadata.get("resource_id"),
                "chapter_id": d.metadata.get("chapter_id"),
                # Truncate the snippet to 150 characters for the UI citation preview.
                "chunk_snippet": d.page_content[:150] + "..."
            }
            for d in docs
        ]

    # System prompt instructs the LLM to stay grounded in the retrieved
    # context and to gracefully handle gaps rather than hallucinating.
    prompt = f"""You are StudyBuddy AI, an intelligent, friendly, and expert AI tutor for students.
Answer the student's question accurately based ONLY on the provided context from their course materials.
If the context contains enough information, explain clearly with examples or bullet points where helpful.
If the context does not contain enough information to fully answer the question, clearly state what information is in the study materials and provide helpful general guidance while noting what is outside the uploaded notes.

=== RETRIEVED COURSE CONTEXT ===
{context_str}
================================

Student Question: {question}

AI Tutor Answer:"""

    try:
        # temperature=0.3 balances factual accuracy with natural-sounding
        # language. Lower values produce more deterministic but stiffer answers.
        llm = ChatOllama(model=LLM_MODEL, temperature=0.3)
        response = llm.invoke(prompt)
        answer_text = response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        print(f"[RAG Error during LLM generation]: {e}")
        answer_text = (
            f"Error generating response from local AI model ({LLM_MODEL}): {str(e)}. "
            f"Make sure Ollama is running and '{LLM_MODEL}' is pulled."
        )

    return {
        "answer": answer_text,
        "sources": sources
    }
