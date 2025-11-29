from PIL import Image, ImageDraw, ImageFont
import os
import random
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

def save_avatar_file(avatar: UploadFile, old_avatar_url: str | None = None) -> str:
    """
    Сохраняет загруженный файл аватарки и возвращает URL.
    Удаляет старую аватарку если она была загружена пользователем.
    """
    # Проверяем тип файла
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if avatar.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Недопустимый формат файла. Разрешены: JPEG, PNG, WebP"
        )
    
    # Проверяем размер файла (макс 5MB)
    avatar.file.seek(0, 2)  # Перемещаемся в конец файла
    file_size = avatar.file.tell()
    avatar.file.seek(0)  # Возвращаемся в начало
    
    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="Файл слишком большой. Максимум 5MB")
    
    # Генерируем уникальное имя файла
    file_extension = avatar.filename.split(".")[-1]
    unique_filename = f"avatar_{uuid.uuid4().hex[:8]}.{file_extension}"
    
    # Путь для сохранения
    avatars_dir = Path("static/avatars")
    avatars_dir.mkdir(parents=True, exist_ok=True)
    file_path = avatars_dir / unique_filename
    
    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        buffer.write(avatar.file.read())
    
    # URL для БД
    avatar_url = f"http://localhost:8000/static/avatars/{unique_filename}"
    
    # Удаляем старую аватарку если она не сгенерированная
    if old_avatar_url and "avatar_" in old_avatar_url:
        old_filename = old_avatar_url.split("/")[-1]
        old_path = avatars_dir / old_filename
        if old_path.exists() and old_filename != unique_filename:
            try:
                old_path.unlink()
            except Exception:
                pass  # Игнорируем ошибки удаления
    
    return avatar_url

def generate_avatar(first_name: str, last_name: str) -> str:
    """
    Генерирует аватар с инициалами пользователя, точно центрированный.
    Возвращает путь к файлу, например: static/avatars/avatar_1234.png
    """
    initials = (first_name[:1] + last_name[:1]).upper() or "U"
    bg_colors = [
        "#4A90E2", "#50E3C2", "#9013FE", "#F5A623",
        "#D0021B", "#B8E986", "#417505", "#F8E71C"
    ]
    bg_color = random.choice(bg_colors)

    img_size = (200, 200)
    img = Image.new("RGB", img_size, bg_color)
    draw = ImageDraw.Draw(img)

    # Шрифт
    try:
        font = ImageFont.truetype("arial.ttf", 90)
    except:
        font = ImageFont.load_default()

    # Получаем реальные размеры текста
    bbox = draw.textbbox((0, 0), initials, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Геометрическое центрирование (учитывая baseline)
    x = (img_size[0] - text_width) / 2 - bbox[0]
    y = (img_size[1] - text_height) / 2 - bbox[1]

    # Рисуем текст
    draw.text((x, y), initials, fill="white", font=font)

    # Папка
    output_dir = "static/avatars"
    os.makedirs(output_dir, exist_ok=True)

    filename = f"avatar_{random.randint(1000,9999)}.png"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath, format="PNG")

    return f"static/avatars/{filename}"
