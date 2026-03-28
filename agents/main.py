"""
Agents Service — FastAPI entry point for the AI agents layer.
Exposes endpoints for RAG queries, agent chain invocations, and tool calls.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agents.rag.router import rag_router
from agents.chains.router import chains_router

app = FastAPI(
    title="Hackathon Agents API",
    version="0.1.0",
    description="AI agents: RAG pipeline, multi-agent chains, tool calls",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag_router,    prefix="/rag",    tags=["RAG"])
app.include_router(chains_router, prefix="/chains", tags=["Chains"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "agents"}
