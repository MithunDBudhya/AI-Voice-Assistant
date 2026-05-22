from app.rag.retriever import query_knowledge_base

def rag_query(question: str):
    return query_knowledge_base(question)
