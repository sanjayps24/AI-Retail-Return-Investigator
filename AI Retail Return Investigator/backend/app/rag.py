import re
from typing import List, Dict, Any
from app.config import settings
from sqlalchemy.orm import Session
from app.models import Policy

def get_keywords(text: str) -> set:
    """Helper to clean and tokenize text into keywords for simple tf-idf fallback."""
    text = text.lower()
    words = re.findall(r'[a-z0-9]+', text)
    # Filter out common stop words
    stopwords = {"the", "a", "an", "and", "or", "but", "if", "then", "else", "to", "for", "with", "on", "at", "by", "from", "of", "in", "is", "are", "was", "were", "be", "been", "this", "that", "it"}
    return {w for w in words if w not in stopwords}

def calculate_overlap_similarity(query: str, doc_text: str) -> float:
    """Calculates keyword overlap similarity score."""
    q_words = get_keywords(query)
    d_words = get_keywords(doc_text)
    if not q_words or not d_words:
        return 0.0
    intersection = q_words.intersection(d_words)
    return len(intersection) / (len(q_words) + 0.1)

def retrieve_relevant_policies(query: str, db: Session, limit: int = 3) -> List[Dict[str, Any]]:
    """
    RAG Policy Retrieval.
    Queries the database policies, ranks them by keyword overlap, and returns matching context chunks.
    """
    policies = db.query(Policy).all()
    results = []
    
    # Simple semantic similarity fallback using keyword TF-IDF approximation
    for policy in policies:
        combined_text = f"{policy.title} {policy.code} {policy.content}"
        score = calculate_overlap_similarity(query, combined_text)
        results.append({
            "policy": policy,
            "score": score
        })
    
    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    
    # Return top matches
    return [
        {
            "code": item["policy"].code,
            "title": item["policy"].title,
            "content": item["policy"].content,
            "return_window_days": item["policy"].return_window_days,
            "score": item["score"]
        }
        for item in results[:limit]
    ]
