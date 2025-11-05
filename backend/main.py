from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import users, auth, projects, tasks, columns, boards, colors_columns
from db.database import Base, engine
from core.logger import logger
import time

app = FastAPI() # Создание экземпляра FastAPI
app.include_router(users.router) # Подключение роутеров
app.include_router(auth.router) # Подключение роутеров
app.include_router(projects.router) # Подключение роутеров
app.include_router(tasks.router) # Подключение роутеров
app.include_router(columns.router) # Подключение роутеров
app.include_router(boards.router) # Подключение роутеров
app.include_router(colors_columns.router) # Подключение роутеров

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

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # IP клиента
    client_ip = request.client.host if request.client else "unknown"

    # User-Agent устройства (если есть)
    user_agent = request.headers.get("user-agent", "unknown")

    # Начало запроса
    logger.info(f"-> {request.method} {request.url.path} | IP: {client_ip} | UA: {user_agent}")

    response = await call_next(request)

    process_time = round(time.time() - start_time, 3)
    status = response.status_code

    # Результат
    logger.info(
        f"<- {request.method} {request.url.path} | {status} | {process_time}s | IP: {client_ip}"
    )

    return response