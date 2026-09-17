"""SQLAlchemy models — import all so Base.metadata sees every table."""
from app.models.user import User
from app.models.project import Activity, Milestone, Project, Task
from app.models.chat import ChatMessage
from app.models.document import Document
from app.models.feedback import FacultyFeedback

__all__ = ["User", "Project", "Milestone", "Task", "Activity", "ChatMessage", "Document", "FacultyFeedback"]
