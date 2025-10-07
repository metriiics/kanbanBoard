from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr = str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str