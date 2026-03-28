"""Agent tools — custom LangChain tools for your use case."""
from langchain_core.tools import tool
import httpx
import os


@tool
def search_web(query: str) -> str:
    """Search the web for information. Returns a summary."""
    # TODO: integrate with a real search API (Serper, Tavily, etc.)
    return f"Web search results for: {query} (implement with Serper/Tavily API)"


@tool
def call_backend_api(endpoint: str, method: str = "GET", payload: dict = None) -> str:
    """
    Call the backend API directly from an agent.
    endpoint: relative path like '/api/v1/items'
    """
    base_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    url = f"{base_url}{endpoint}"

    with httpx.Client() as client:
        if method == "GET":
            response = client.get(url)
        elif method == "POST":
            response = client.post(url, json=payload or {})
        else:
            return f"Unsupported method: {method}"

    return response.text


@tool
def read_file(file_path: str) -> str:
    """Read the contents of a file (for agents that need to process documents)."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"
