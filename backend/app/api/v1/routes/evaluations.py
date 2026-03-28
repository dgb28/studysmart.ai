from fastapi import APIRouter, HTTPException
import os

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.schemas.evaluation import ProofOfLearningRequest, ProofOfLearningResponse

router = APIRouter()

@router.post("/proof-of-learning", response_model=ProofOfLearningResponse)
async def evaluate_learning(request: ProofOfLearningRequest):
    try:
        # We rely on OPENAI_API_KEY environment variable being set in .env
        llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"), 
            temperature=0.2
        )
        
        # Force the LLM to return exactly our desired JSON shape
        structured_llm = llm.with_structured_output(ProofOfLearningResponse)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert AI cognitive tutor evaluating a student's 'Proof of Learning'. "
                       "You must critically assess their explanation of the topic. "
                       "Provide a clarity score (0-100) and correctness score (0-100). "
                       "If there are errors, list them as 'gaps'. "
                       "Provide 1-2 actionable 'recommendations' on what they should review next."),
            ("user", "Topic: {topic}\n\nStudent Explanation: {explanation}")
        ])
        
        chain = prompt | structured_llm
        
        result = await chain.ainvoke({
            "topic": request.topic_title,
            "explanation": request.explanation
        })
        
        return result
        
    except Exception as e:
        print(f"Error during evaluation: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate explanation.")
