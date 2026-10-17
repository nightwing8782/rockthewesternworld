import os
import sys
import json
import io
import pypdfium2 as pdfium
from PIL import Image

def render_pdf_to_jpeg(pdf_bytes_or_path, out_path, max_dimension=1600, quality=85):
    pdf = pdfium.PdfDocument(pdf_bytes_or_path)
    if len(pdf) == 0:
        raise ValueError("PDF has 0 pages")
    page = pdf[0]
    
    # Render with scale 2 for high sharpness
    img = page.render(scale=2.0).to_pil()
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    # Resize down if larger than max_dimension while preserving aspect ratio
    w, h = img.size
    if max(w, h) > max_dimension:
        ratio = max_dimension / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path, format='JPEG', quality=quality, optimize=True)
    return os.path.getsize(out_path)

if __name__ == '__main__':
    manifest_path = sys.argv[1]
    with open(manifest_path, 'r', encoding='utf-8') as f:
        tasks = json.load(f)
        
    success = 0
    errors = []
    for item in tasks:
        book_id = item['id']
        source = item['path'] # could be file path
        out_path = item['out']
        try:
            sz = render_pdf_to_jpeg(source, out_path)
            success += 1
            print(f"[OK] {book_id} -> {out_path} ({sz // 1024} KB)")
        except Exception as e:
            errors.append({'id': book_id, 'error': str(e), 'source': source})
            print(f"[ERR] {book_id}: {e}")
            
    print(f"Summary: {success} succeeded, {len(errors)} failed.")
    if errors:
        sys.exit(1)
