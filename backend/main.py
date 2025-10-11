from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import users, auth
from db.database import Base, engine

app = FastAPI() # Создание экземпляра FastAPI
app.include_router(users.router) # Подключение роутеров
app.include_router(auth.router) # Подключение роутеров

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # разрешаем источники
    allow_credentials=True,
    allow_methods=["*"],        
    allow_headers=["*"],         
)

@app.on_event("startup")
def startup_db():
    Base.metadata.create_all(bind=engine)

    
@app.get("/")
def read_root():
    return {"message": "Welcome to the Real-Time Task Manager API"}