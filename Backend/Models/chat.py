from pydantic import BaseModel
from datetime import datetime

class ChatMessage(BaseModel):
    user_message: str
    bot_message: str
    timestamp: datetime
