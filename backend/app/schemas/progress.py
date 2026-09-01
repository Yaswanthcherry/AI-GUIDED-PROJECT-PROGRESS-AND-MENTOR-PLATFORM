from app.schemas.base import CamelModel


class MilestoneProgress(CamelModel):
    id: str
    title: str
    weeks: list[int]
    progress: int


class WeekLoad(CamelModel):
    week: int = 0
    done: int = 0
    open: int = 0
    delayed: int = 0


class StatusCounts(CamelModel):
    done: int = 0
    in_progress: int = 0
    pending: int = 0
    delayed: int = 0


class ProgressTaskRef(CamelModel):
    id: str
    status: str


class ProgressOut(CamelModel):
    progress: int
    planned: int
    week: int
    duration_weeks: int
    phase: str
    next_task: str
    counts: StatusCounts
    milestones: list[MilestoneProgress]
    weeks: list[WeekLoad]
    tasks: list[ProgressTaskRef]
    # Progress Agent output — surfaced in the frontend Progress view.
    recommendations: list[str] = []
