"""RAG API router — exposes ingest and query endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.rag.pipeline import RAGPipeline

rag_router = APIRouter()
pipeline = RAGPipeline()


class IngestRequest(BaseModel):
    texts: list[str]


class QueryRequest(BaseModel):
    question: str
    top_k: int = 5


@rag_router.post("/ingest")
async def ingest(req: IngestRequest):
    """Ingest texts into the vector store."""
    try:
        pipeline.ingest_texts(req.texts)
        return {"status": "ok", "count": len(req.texts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@rag_router.post("/query")
async def query(req: QueryRequest):
    """Query the RAG pipeline."""
    try:
        answer = pipeline.query(req.question, top_k=req.top_k)
        return {"answer": answer, "question": req.question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
