from datetime import datetime

from pydantic import Field

from app.schemas.base import CamelModel


class ChatRequest(CamelModel):
    content: str = Field(min_length=1, max_length=4000)


class ChatMessageOut(CamelModel):
    id: str
    role: str  # user | mentor
    content: str
    ts: datetime
    agent: str | None = None
