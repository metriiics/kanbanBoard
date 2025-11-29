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

class UserUpdate(BaseModel): # Схема для обновления профиля пользователя (без файлов)
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    
    class Config:
        from_attributes = True
