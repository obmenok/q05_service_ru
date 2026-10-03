import os
import re
import json
from bs4 import BeautifulSoup
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Область доступа (только чтение)
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# ID ваших папок с медиа на Google Диске, где лежат картинки
IMAGE_FOLDER_ID = '1LhaeT-I9t0njDyHz9dh3_ZoQgOU9KxoM' 
IMG_FOLDER_ID = '1N2022BbV3Mq9pEuNK2Unff2a8rxNF3Zw' 

def get_drive_service():
    """Авторизация и создание сервиса Google Drive API."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
        creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('drive', 'v3', credentials=creds)

def get_image_mapping(service, folder_ids):
    """Получает словарь {имя_файла: id_в_гугл_диске} для всех картинок."""
    image_map = {}
    for folder_id in folder_ids:
        query = f"'{folder_id}' in parents and trashed=false"
        page_token = None
        while True:
            results = service.files().list(
                q=query, fields="nextPageToken, files(id, name)", pageToken=page_token
            ).execute()
            
            for item in results.get('files', []):
                image_map[item['name']] = item['id']
                
            page_token = results.get('nextPageToken')
            if not page_token:
                break
    return image_map

def parse_catalog(index_path):
    """Парсит index.html для извлечения правильного порядка оглавления."""
    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    # Ищем переменную var CAT
    match = re.search(r'var CAT = (\{.*?\});\s*(?:var|</script>)', html, re.DOTALL)
    if not match:
        raise ValueError("Не удалось найти структуру CAT в index.html")
    
    cat_data = json.loads(match.group(1))
    pages = []
    
    # Рекурсивный обход древовидного оглавления
    def traverse(node, level=1):
        if node.get('href'):
            # Ссылка выглядит как https://gats.../ST575170.html, берем только имя файла
            filename = node['href'].split('/')[-1]
            pages.append((level, node['label'], filename))
            
        if 'children' in node:
            for child in node.get('children', []):
                traverse(child, level + 1)
                
    traverse(cat_data)
    return pages

def build_combined_html(pages, image_map, html_dir="."):
    """Собирает итоговый HTML документ."""
    combined_soup = BeautifulSoup(
        "<html><head><meta charset='utf-8'>"
        "<title>Руководство по ремонту Changan Qiyuan Q05</title>"
        "<style>"
        "body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; }"
        "img { max-width: 100%; height: auto; display: block; margin: 10px 0; }"
        ".section-block { margin-bottom: 50px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }"
        "</style></head><body>"
        "<h1>Руководство по ремонту</h1></body></html>", 
        "html.parser"
    )
    body_tag = combined_soup.body

    for level, label, filename in pages:
        filepath = os.path.join(html_dir, 'html-CASM866491', filename)
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            soup = BeautifulSoup(f.read(), "html.parser")
            
            # Достаем основной контент из тега <section> или <body>
            section = soup.find("section") or soup.body
            if section:
                # 1. Заменяем пути к изображениям
                for img in section.find_all("img"):
                    src = img.get("src")
                    if src:
                        img_filename = src.split('/')[-1]
                        if img_filename in image_map:
                            # Ставим прямую ссылку на просмотр файла с Диска
                            img["src"] = f"https://drive.google.com/uc?export=view&id={image_map[img_filename]}"
                
                # 2. Формируем блок и заголовки нужного уровня
                wrapper = combined_soup.new_tag("div", attrs={"class": "section-block", "id": filename.split('.')[0]})
                
                header_level = min(level + 1, 6) # Ограничиваем до <h6>
                header = combined_soup.new_tag(f"h{header_level}")
                header.string = label
                wrapper.append(header)
                
                # Вставляем оригинальный HTML код раздела
                wrapper.extend(section.contents)
                body_tag.append(wrapper)

    with open("combined_manual.html", "w", encoding="utf-8") as f:
        f.write(str(combined_soup))

if __name__ == "__main__":
    print("Авторизация в Google Drive...")
    service = get_drive_service()
    
    print("Получаем ID изображений из папок 'image' и 'img'...")
    img_map = get_image_mapping(service, [IMAGE_FOLDER_ID, IMG_FOLDER_ID])
    print(f"Найдено {len(img_map)} изображений на Диске.")
    
    print("Парсим древовидное оглавление из index.html...")
    pages = parse_catalog("index.html")
    print(f"В оглавлении найдено {len(pages)} разделов.")
    
    print("Сборка итогового HTML файла...")
    build_combined_html(pages, img_map, ".")
    print("Готово! Итоговый файл сохранен как: combined_manual.html")