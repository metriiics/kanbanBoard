from PIL import Image, ImageDraw, ImageFont
import os
import random

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
