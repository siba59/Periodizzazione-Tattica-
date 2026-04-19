"""
Script per importare il documento 'Tutta PT a Modo mio' nel database.
Legge il .docx, lo divide per lezioni, e inserisce tutto come modulo premium.
"""
import asyncio
import os
import re
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from docx import Document

load_dotenv(Path(__file__).parent / '.env')

DOCX_PATH = Path(__file__).parent / 'tutta_pt.docx'
MODULE_ID = "mod-pt-mio"
MODULE_TITLE = "Tutta PT a Modo mio"
MODULE_SUBTITLE = "Il percorso completo — con la voce autentica dell'istruttore"
MODULE_DESCRIPTION = (
    "Il documento integrale del corso di Periodizzazione Tattica e Calcio Relazionale. "
    "Sei moduli, dodici lezioni, un'appendice pratica — scritto come un istruttore "
    "parla ai suoi allievi: con empatia, profondita e la passione di chi vive il calcio "
    "come filosofia di vita."
)

def extract_text_from_docx(path):
    """Estrae tutto il testo dal .docx preservando la struttura."""
    doc = Document(path)
    full_text = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            full_text.append("")
            continue
        # Detect heading styles
        style_name = para.style.name if para.style else ""
        if "Heading" in style_name or style_name.startswith("Title"):
            level = 1
            if "2" in style_name:
                level = 2
            elif "3" in style_name:
                level = 3
            elif "4" in style_name:
                level = 4
            full_text.append(f"{'#' * level} {text}")
        else:
            # Check for bold runs to detect inline headings
            has_bold = any(run.bold for run in para.runs if run.text.strip())
            all_bold = all(run.bold for run in para.runs if run.text.strip()) if para.runs else False
            if all_bold and len(text) < 120 and not text.startswith("("):
                full_text.append(f"## {text}")
            else:
                # Convert bold and italic runs to markdown
                md_text = ""
                for run in para.runs:
                    t = run.text
                    if not t:
                        continue
                    if run.bold and run.italic:
                        md_text += f"***{t}***"
                    elif run.bold:
                        md_text += f"**{t}**"
                    elif run.italic:
                        md_text += f"*{t}*"
                    else:
                        md_text += t
                full_text.append(md_text if md_text else text)
    return "\n\n".join(full_text)

def split_into_lessons(full_text):
    """Divide il testo in lezioni basandosi sui markers 'Modulo XX — Lezione YY'."""
    # Pattern per trovare l'inizio di ogni lezione
    pattern = r'(?=(?:#+\s*)?Modulo\s+\d+\s*[—–-]\s*Lezione\s+\d+)'
    parts = re.split(pattern, full_text)
    
    lessons = []
    appendix_content = None
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Check if this is the appendix
        if "APPENDICE" in part[:200].upper() or part.upper().startswith("APPENDICE"):
            appendix_content = part
            continue
        
        # Extract lesson info from header
        header_match = re.match(
            r'(?:#+\s*)?Modulo\s+(\d+)\s*[—–-]\s*Lezione\s+(\d+)\s*\n(.*?)(?:\n|$)',
            part, re.IGNORECASE
        )
        
        if header_match:
            mod_num = int(header_match.group(1))
            les_num = int(header_match.group(2))
            # Get the subtitle from the next line
            remaining = part[header_match.end():].strip()
            lines = remaining.split('\n')
            title = lines[0].strip().lstrip('#').strip() if lines else f"Lezione {les_num}"
            subtitle = ""
            content_start = 1
            if len(lines) > 1 and lines[1].strip() and not lines[1].strip().startswith('#'):
                subtitle = lines[1].strip()
                content_start = 2
            
            content = '\n'.join(lines[content_start:]).strip()
            # Clean up title
            title = title.replace('**', '').replace('*', '').strip()
            if not title or title == "":
                title = f"Lezione {les_num}"
            
            lessons.append({
                "module_num": mod_num,
                "lesson_num": les_num,
                "title": title,
                "subtitle": subtitle,
                "content": f"# {title}\n\n{f'*{subtitle}*' if subtitle else ''}\n\n{content}"
            })
        else:
            # Might be content without proper header, check for appendix
            if "appendice" in part[:500].lower():
                appendix_content = part
    
    # Add appendix as final lesson if exists
    if appendix_content:
        lessons.append({
            "module_num": 99,
            "lesson_num": len(lessons) + 1,
            "title": "Appendice Pratica",
            "subtitle": "Applicazione concreta dei principi PT in campo",
            "content": f"# Appendice Pratica\n\n*Applicazione concreta dei principi PT in campo*\n\n{appendix_content}"
        })
    
    return lessons

async def seed_tutta_pt():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Check if already seeded
    existing = await db.modules.find_one({"id": MODULE_ID})
    if existing:
        print(f"Modulo '{MODULE_TITLE}' gia presente. Aggiornamento in corso...")
        await db.modules.delete_one({"id": MODULE_ID})
        await db.lessons.delete_many({"module_id": MODULE_ID})
    
    # Extract and parse document
    print("Estrazione testo dal documento...")
    full_text = extract_text_from_docx(DOCX_PATH)
    print(f"Testo estratto: {len(full_text)} caratteri")
    
    # Split into lessons
    print("Divisione in lezioni...")
    lessons = split_into_lessons(full_text)
    print(f"Trovate {len(lessons)} lezioni")
    
    if not lessons:
        print("ERRORE: Nessuna lezione trovata! Inserimento del documento come singola lezione...")
        lessons = [{
            "module_num": 1,
            "lesson_num": 1,
            "title": "Tutta PT a Modo mio",
            "subtitle": "Il percorso completo",
            "content": full_text
        }]
    
    # Get current module count for ordering
    max_order = await db.modules.count_documents({})
    
    # Insert module
    module_doc = {
        "id": MODULE_ID,
        "order": max_order + 1,
        "title": MODULE_TITLE,
        "subtitle": MODULE_SUBTITLE,
        "description": MODULE_DESCRIPTION,
        "icon": "book",
        "color": "#D4AF37",
        "is_premium": True
    }
    await db.modules.insert_one(module_doc)
    print(f"Modulo '{MODULE_TITLE}' creato (ordine: {max_order + 1})")
    
    # Insert lessons
    for i, lesson_data in enumerate(lessons):
        lesson_doc = {
            "id": f"les-pt-mio-{str(i+1).zfill(2)}",
            "module_id": MODULE_ID,
            "order": i + 1,
            "title": lesson_data["title"],
            "content": lesson_data["content"],
            "video_url": "",
            "video_type": "none",
            "duration_minutes": max(15, len(lesson_data["content"]) // 500)  # stima lettura
        }
        await db.lessons.insert_one(lesson_doc)
        print(f"  Lezione {i+1}: {lesson_data['title']} ({lesson_doc['duration_minutes']} min)")
    
    print(f"\nCompletato! {len(lessons)} lezioni inserite nel modulo '{MODULE_TITLE}'")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_tutta_pt())
