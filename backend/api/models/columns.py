from pydantic import BaseModel

class ColumnTitleUpdate(BaseModel):
    title: str

class ColumnCreate(BaseModel):
    title: str
    position: int
    board_id: int