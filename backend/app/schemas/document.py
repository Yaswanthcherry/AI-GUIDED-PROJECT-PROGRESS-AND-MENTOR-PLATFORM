from datetime import datetime
from typing import Literal

from app.schemas.base import CamelModel

DocType = Literal[
    "synopsis",
    "abstract",
    "literature-review",
    "objectives",
    "problem-statement",
    "architecture",
    "uml",
    "flowchart",
    "report",
    "ppt",
    "user-manual",
]

DOC_TITLES: dict[str, str] = {
    "synopsis": "Synopsis",
    "abstract": "Abstract",
    "literature-review": "Literature Review",
    "objectives": "Objectives",
    "problem-statement": "Problem Statement",
    "architecture": "Architecture Doc",
    "uml": "UML Diagrams",
    "flowchart": "Flowchart",
    "report": "Project Report",
    "ppt": "Presentation (PPT)",
    "user-manual": "User Manual",
}


class DocGenerateRequest(CamelModel):
    type: DocType


class DocOut(CamelModel):
    id: str
    type: str
    title: str
    content: str
    diagram: str | None = None
    generated_at: datetime
