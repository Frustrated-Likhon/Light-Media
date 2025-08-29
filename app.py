from flask import Flask, request, render_template, send_from_directory, redirect, url_for, flash
import os
import glob
from pathlib import Path
from werkzeug.utils import secure_filename
from datetime import datetime
import json

app = Flask(__name__)
app.secret_key = 'local-media-server-secret-2024'


MEDIA_FOLDER = os.path.abspath("media_files")  
ALLOWED_EXTENSIONS = {
    'video': ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'],
    'audio': ['mp3', 'm4a', 'wav', 'flac', 'aac', 'ogg', 'wma'],
    'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
}


os.makedirs(MEDIA_FOLDER, exist_ok=True)


def get_media_files():
    """Scan media folder and return all media files grouped by type"""
    media_files = {
        'video': [],
        'audio': [],
        'image': []
    }

    for category, extensions in ALLOWED_EXTENSIONS.items():
        for ext in extensions:
            for file_path in glob.glob(os.path.join(MEDIA_FOLDER, '**', f'*.{ext}'), recursive=True):
                relative_path = os.path.relpath(file_path, MEDIA_FOLDER).replace("\\", "/")  
                file_name = os.path.basename(file_path)

                file_info = {
                    'name': file_name,
                    'path': relative_path,
                    'type': category,
                    'size': os.path.getsize(file_path),
                    'full_path': file_path,
                    'icon': get_file_icon(category, file_name),
                    'formatted_size': format_file_size(os.path.getsize(file_path))
                }

                media_files[category].append(file_info)


    for category in media_files:
        media_files[category].sort(key=lambda x: x['name'].lower())

    return media_files


def get_file_icon(file_type, file_name):
    """Get appropriate icon for file type"""
    if file_type == 'video':
        return '🎬'
    elif file_type == 'audio':
        return '🎵'
    elif file_type == 'image':
        return '🖼️'
    else:
        return '📄'


def format_file_size(size_bytes):
    """Convert bytes to human readable format"""
    if size_bytes == 0:
        return "0B"
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.1f} {size_names[i]}"


@app.route('/')
def index():
    """Main page with media grid grouped by type"""
    media_files = get_media_files()
    total_files = sum(len(files) for files in media_files.values())
    return render_template('index.html',
                           media_files=media_files,
                           total_files=total_files)


@app.route('/media/<path:filename>')
def serve_media(filename):
    """Serve media files"""
    return send_from_directory(MEDIA_FOLDER, filename)


@app.route('/player')
def player():
    """Media player page"""
    file_path = request.args.get('file')
    if not file_path:
        return redirect(url_for('index'))

    full_path = os.path.join(MEDIA_FOLDER, file_path)
    if not os.path.exists(full_path):
        return "File not found", 404

    file_type = 'video'
    file_ext = os.path.splitext(file_path)[1].lower().lstrip('.')
    for category, extensions in ALLOWED_EXTENSIONS.items():
        if file_ext in extensions:
            file_type = category
            break

    return render_template('player.html',
                           file_path=file_path,
                           file_name=os.path.basename(file_path),
                           file_type=file_type)


@app.route('/image-viewer')
def image_viewer():
    """Image viewer with navigation"""
    file_path = request.args.get('file')
    if not file_path:
        return redirect(url_for('index'))

    full_path = os.path.join(MEDIA_FOLDER, file_path)
    if not os.path.exists(full_path):
        return "File not found", 404

    image_dir = os.path.dirname(full_path)
    image_files = []

    for ext in ALLOWED_EXTENSIONS['image']:
        for img_path in glob.glob(os.path.join(image_dir, f'*.{ext}')):
            image_files.append({
                'name': os.path.basename(img_path),
                'path': os.path.relpath(img_path, MEDIA_FOLDER).replace("\\", "/") 
            })

    image_files.sort(key=lambda x: x['name'].lower())

    current_index = next((i for i, img in enumerate(image_files)
                          if img['path'] == file_path), 0)

    prev_image = image_files[current_index - 1] if current_index > 0 else None
    next_image = image_files[current_index + 1] if current_index < len(image_files) - 1 else None

    return render_template('image_viewer.html',
                           current_image=file_path,
                           image_name=os.path.basename(file_path),
                           prev_image=prev_image['path'] if prev_image else None,
                           next_image=next_image['path'] if next_image else None,
                           total_images=len(image_files),
                           current_index=current_index + 1)


@app.route('/browse')
def browse():
    """Browse files in a specific folder"""
    folder_path = request.args.get('path', '')
    full_path = os.path.join(MEDIA_FOLDER, folder_path)

    if not os.path.exists(full_path):
        return "Folder not found", 404

    items = []

    if folder_path:
        parent_path = os.path.dirname(folder_path)
        items.append({
            'name': '..',
            'path': parent_path.replace("\\", "/"), 
            'type': 'folder',
            'icon': '📁'
        })

    for item in os.listdir(full_path):
        item_path = os.path.join(full_path, item)
        relative_path = os.path.join(folder_path, item).replace("\\", "/")  

        if os.path.isdir(item_path):
            items.append({
                'name': item,
                'path': relative_path,
                'type': 'folder',
                'icon': '📁'
            })
        else:
            file_ext = os.path.splitext(item)[1].lower().lstrip('.')
            file_type = 'file'
            for category, extensions in ALLOWED_EXTENSIONS.items():
                if file_ext in extensions:
                    file_type = category
                    break

            items.append({
                'name': item,
                'path': relative_path,
                'type': file_type,
                'icon': get_file_icon(file_type, item),
                'size': os.path.getsize(item_path),
                'formatted_size': format_file_size(os.path.getsize(item_path))
            })

    return render_template('browse.html',
                           items=items,
                           current_path=folder_path.replace("\\", "/"))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

