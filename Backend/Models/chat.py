from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ChatMessage(BaseModel):
    user_message: str
    bot_message: str
    timestamp: datetime

class ChatSession(BaseModel):
    session_id: str
    title: str
    created_at: datetime
    last_updated: datetime
    message_count: int

class SessionDetails(BaseModel):
    session_id: str
    title: str
    messages: List[ChatMessage]

class CreateSessionResponse(BaseModel):
    session_id: str
    title: str