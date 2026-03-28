"""Chains router — trigger agent chain pipelines via API."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.chains.multi_agent import run_chain

chains_router = APIRouter()


class ChainRequest(BaseModel):
    topic: str


@chains_router.post("/run")
async def run_agent_chain(req: ChainRequest):
    """Run the multi-agent chain on a topic."""
    try:
        result = await run_chain(req.topic)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
