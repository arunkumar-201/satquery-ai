from typing import List, Dict, Any
from datetime import datetime


class ConversationContext:
    """Manages project-level conversation context for the chat assistant."""

    def __init__(self, max_messages: int = 10):
        self.max_messages = max_messages
        self.messages: List[Dict[str, Any]] = []

    def add_message(self, role: str, content: str, language: str = "en", metadata: Dict = None):
        msg = {
            "role": role,
            "content": content,
            "language": language,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        }
        self.messages.append(msg)
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]

    def get_context_for_llm(self) -> List[Dict[str, str]]:
        """Format messages for LLM consumption."""
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in self.messages
        ]

    def get_recent_user_queries(self, count: int = 3) -> List[str]:
        """Get recent user messages for context."""
        user_msgs = [m["content"] for m in self.messages if m["role"] == "user"]
        return user_msgs[-count:]

    def clear(self):
        self.messages = []


# In-memory store for active sessions (per chat session)
# In production, this could be Redis or database-backed
_context_store: Dict[int, ConversationContext] = {}


def get_context(session_id: int) -> ConversationContext:
    if session_id not in _context_store:
        _context_store[session_id] = ConversationContext()
    return _context_store[session_id]


def clear_context(session_id: int):
    if session_id in _context_store:
        del _context_store[session_id]