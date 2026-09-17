from datetime import datetime

from app.schemas.base import CamelModel


class FeedbackType(str):
    MESSAGE = "message"
    FEEDBACK = "feedback"
    RECOMMENDATION = "recommendation"
    TASK_SUGGESTION = "task_suggestion"


class FacultyFeedbackIn(CamelModel):
    type: str  # message, feedback, recommendation, task_suggestion
    content: str
    related_task_id: str | None = None


class FacultyFeedbackOut(CamelModel):
    id: str
    project_id: str
    faculty_id: str
    faculty_name: str
    type: str
    content: str
    related_task_id: str | None = None
    created_at: datetime


class FacultyFeedbackListOut(CamelModel):
    feedback: list[FacultyFeedbackOut]