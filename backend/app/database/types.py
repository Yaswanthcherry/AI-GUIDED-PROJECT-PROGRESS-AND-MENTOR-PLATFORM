"""Column types that use JSONB on PostgreSQL and plain JSON elsewhere (SQLite tests)."""
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

JSONType = JSONB().with_variant(JSON(), "sqlite")
