"""
Multi-Agent Chain — LangChain LCEL pipeline example.

Pattern: Sequential chain where each agent builds on the prior output.
Extend this with your own agents (Researcher, Writer, Critic, etc.)
"""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os


def build_chain(model_name: str = "gpt-4o"):
    """Build a simple sequential agent chain."""
    llm = ChatOpenAI(
        model=model_name,
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.7,
    )

    # Step 1: Researcher agent
    researcher_prompt = ChatPromptTemplate.from_template(
        "You are a researcher. Research the following topic thoroughly: {topic}\n"
        "Provide key facts, context, and relevant information."
    )

    # Step 2: Writer agent
    writer_prompt = ChatPromptTemplate.from_template(
        "You are a technical writer. Based on the following research:\n{research}\n\n"
        "Write a clear, concise summary for a technical audience."
    )

    # Step 3: Critic agent
    critic_prompt = ChatPromptTemplate.from_template(
        "You are a critic. Review the following summary:\n{summary}\n\n"
        "Provide specific improvements and a final score out of 10."
    )

    parser = StrOutputParser()

    # LCEL chain
    researcher_chain = researcher_prompt | llm | parser
    writer_chain = writer_prompt | llm | parser
    critic_chain = critic_prompt | llm | parser

    return researcher_chain, writer_chain, critic_chain


async def run_chain(topic: str) -> dict:
    """Run the full multi-agent chain on a topic."""
    researcher_chain, writer_chain, critic_chain = build_chain()

    research = await researcher_chain.ainvoke({"topic": topic})
    summary = await writer_chain.ainvoke({"research": research})
    critique = await critic_chain.ainvoke({"summary": summary})

    return {
        "topic": topic,
        "research": research,
        "summary": summary,
        "critique": critique,
    }
