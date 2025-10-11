from pydantic import BaseModel, EmailStr

class UserBase(BaseModel): # Базовая схема пользователя
    email: EmailStr
    first_name: str
    last_name: str
    username: str

class UserCreate(UserBase): # Схема для создания пользователя
    password: str

class UserRead(UserBase): # Схема для чтения информации о пользователе
    class Config:
        from_attributes = True

class UserLogin(BaseModel): # Схема для входа пользователя
    email: EmailStr
    password: str
