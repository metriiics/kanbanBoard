from pydantic import BaseModel

class ColumnTitleUpdate(BaseModel):
    title: str