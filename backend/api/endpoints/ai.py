from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
from core.config import settings
from core.security import get_current_user
from core.logger import logger

router = APIRouter(tags=["🤖 AI Ассистент"])


class ChatMessage(BaseModel):
    message: str
    model: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    model: str


@router.post("/api/ai/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_message: ChatMessage,
    current_user=Depends(get_current_user)
):
    """
    Отправляет сообщение в AI модель через Ollama и получает ответ.
    """
    try:
        # Используем модель из запроса или дефолтную из настроек
        model = chat_message.model or settings.OLLAMA_MODEL
        
        # Формируем промпт с контекстом о том, что это ассистент для управления задачами
        system_prompt = """Ты - полезный AI-ассистент для системы управления задачами (Kanban доска). 
Помогай пользователям с вопросами о задачах, проектах, рабочих пространствах и управлении временем.
Отвечай кратко, дружелюбно и по делу. Если вопрос не связан с управлением задачами, вежливо перенаправь разговор."""
        
        user_message = chat_message.message
        
        # Подготовка запроса к Ollama
        ollama_url = f"{settings.OLLAMA_BASE_URL}/api/chat"
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            "stream": False
        }
        
        # Отправка запроса к Ollama
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(ollama_url, json=payload)
            response.raise_for_status()
            result = response.json()
        
        # Извлечение ответа из результата Ollama
        ai_response = result.get("message", {}).get("content", "Извините, не удалось получить ответ от AI.")
        
        logger.info(f"AI request from user {current_user.id}: {user_message[:50]}...")
        
        return ChatResponse(
            response=ai_response,
            model=model
        )
        
    except httpx.TimeoutException:
        logger.error("Ollama request timeout")
        raise HTTPException(
            status_code=504,
            detail="Превышено время ожидания ответа от AI. Попробуйте еще раз."
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"Ollama HTTP error: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Модель '{model}' не найдена. Убедитесь, что модель установлена в Ollama."
            )
        raise HTTPException(
            status_code=502,
            detail="Ошибка при обращении к Ollama. Проверьте, что Ollama запущена и доступна."
        )
    except Exception as e:
        logger.error(f"Unexpected error in AI chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )


@router.get("/api/ai/models")
async def get_available_models(
    current_user=Depends(get_current_user)
):
    """
    Получает список доступных моделей в Ollama.
    """
    try:
        ollama_url = f"{settings.OLLAMA_BASE_URL}/api/tags"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(ollama_url)
            response.raise_for_status()
            result = response.json()
        
        models = [model.get("name", "") for model in result.get("models", [])]
        
        return {"models": models}
        
    except httpx.TimeoutException:
        logger.error("Ollama models request timeout")
        raise HTTPException(
            status_code=504,
            detail="Превышено время ожидания ответа от Ollama."
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"Ollama HTTP error: {e.response.status_code}")
        raise HTTPException(
            status_code=502,
            detail="Ошибка при обращении к Ollama. Проверьте, что Ollama запущена и доступна."
        )
    except Exception as e:
        logger.error(f"Unexpected error getting models: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )

