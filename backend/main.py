from fastapi import FastAPI
from app.api import users, auth

app = FastAPI() # Создание экземпляра FastAPI
app.include_router(users.router) # Подключение роутеров
app.include_router(auth.router) # Подключение роутеров