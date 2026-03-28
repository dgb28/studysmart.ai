"""
RAG Pipeline — Retrieval Augmented Generation using LlamaIndex + ChromaDB.

Usage:
    from agents.rag.pipeline import RAGPipeline

    pipeline = RAGPipeline()
    await pipeline.ingest(documents)
    result = await pipeline.query("What is the main topic?")
"""
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core.settings import Settings
import chromadb
import os


class RAGPipeline:
    """End-to-end RAG pipeline: ingest → index → retrieve → generate."""

    def __init__(
        self,
        collection_name: str = "hackathon",
        chroma_host: str = "localhost",
        chroma_port: int = 8100,
    ):
        self.chroma_client = chromadb.HttpClient(host=chroma_host, port=chroma_port)
        self.collection = self.chroma_client.get_or_create_collection(collection_name)
        self.vector_store = ChromaVectorStore(chroma_collection=self.collection)
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)
        self.index: VectorStoreIndex | None = None

    def ingest_directory(self, directory: str) -> None:
        """Ingest all documents from a directory into the vector store."""
        documents = SimpleDirectoryReader(directory).load_data()
        self.index = VectorStoreIndex.from_documents(
            documents,
            storage_context=self.storage_context,
        )

    def ingest_texts(self, texts: list[str]) -> None:
        """Ingest raw text strings."""
        from llama_index.core import Document
        documents = [Document(text=t) for t in texts]
        self.index = VectorStoreIndex.from_documents(
            documents,
            storage_context=self.storage_context,
        )

    def query(self, question: str, top_k: int = 5) -> str:
        """Retrieve relevant chunks and generate an answer."""
        if self.index is None:
            # Load from existing vector store
            self.index = VectorStoreIndex.from_vector_store(
                self.vector_store,
                storage_context=self.storage_context,
            )
        query_engine = self.index.as_query_engine(similarity_top_k=top_k)
        response = query_engine.query(question)
        return str(response)
