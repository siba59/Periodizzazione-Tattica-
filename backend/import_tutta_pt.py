"""
Script per importare il documento 'Tutta PT a Modo mio' nel database.
Legge il .docx, lo divide per lezioni, e inserisce tutto come modulo premium.
"""
import asyncio
import os
import re
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from docx import Document
from docx.text.paragraph import Paragraph

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
LESSON_HEADER_PATTERN = re.compile(
    r'(?:#+\s*)?Modulo\s+(\d+)\s*[—–-]\s*Lezione\s+(\d+)\s*\n(.*?)(?:\n|$)',
    re.IGNORECASE
)
LESSON_SPLIT_PATTERN = re.compile(
    r'(?=(?:#+\s*)?Modulo\s+\d+\s*[—–-]\s*Lezione\s+\d+)'
)


def _detect_heading_level(style_name: str) -> int:
    """Determina il livello heading dallo stile del paragrafo."""
    if "4" in style_name:
        return 4
    if "3" in style_name:
        return 3
    if "2" in style_name:
        return 2
    return 1


def _is_bold_heading(para: Paragraph, text: str) -> bool:
    """Verifica se il paragrafo e un heading in grassetto."""
    if not para.runs or len(text) >= 120 or text.startswith("("):
        return False
    return all(run.bold for run in para.runs if run.text.strip())


def _runs_to_markdown(para: Paragraph) -> str:
    """Converte i run di un paragrafo in testo markdown."""
    parts: list[str] = []
    for run in para.runs:
        t = run.text
        if not t:
            continue
        if run.bold and run.italic:
            parts.append(f"***{t}***")
        elif run.bold:
            parts.append(f"**{t}**")
        elif run.italic:
            parts.append(f"*{t}*")
        else:
            parts.append(t)
    return "".join(parts)


def _para_to_markdown(para: Paragraph) -> str:
    """Converte un singolo paragrafo in markdown."""
    text = para.text.strip()
    if not text:
        return ""

    style_name = para.style.name if para.style else ""
    if "Heading" in style_name or style_name.startswith("Title"):
        level = _detect_heading_level(style_name)
        return f"{'#' * level} {text}"

    if _is_bold_heading(para, text):
        return f"## {text}"

    md_text = _runs_to_markdown(para)
    return md_text if md_text else text


def extract_text_from_docx(path: Path) -> str:
    """Estrae tutto il testo dal .docx preservando la struttura markdown."""
    doc = Document(path)
    return "\n\n".join(_para_to_markdown(para) for para in doc.paragraphs)


def _parse_lesson_from_part(part: str) -> Optional[dict[str, object]]:
    """Parsa una singola parte di testo in un dizionario lezione."""
    header_match = LESSON_HEADER_PATTERN.match(part)
    if not header_match:
        return None

    les_num = int(header_match.group(2))
    remaining = part[header_match.end():].strip()
    lines = remaining.split('\n')

    title = lines[0].strip().lstrip('#').strip() if lines else f"Lezione {les_num}"
    title = title.replace('**', '').replace('*', '').strip()
    if not title:
        title = f"Lezione {les_num}"

    subtitle = ""
    content_start = 1
    if len(lines) > 1 and lines[1].strip() and not lines[1].strip().startswith('#'):
        subtitle = lines[1].strip()
        content_start = 2

    content = '\n'.join(lines[content_start:]).strip()
    header = f"# {title}\n\n*{subtitle}*\n\n" if subtitle else f"# {title}\n\n"

    return {
        "module_num": int(header_match.group(1)),
        "lesson_num": les_num,
        "title": title,
        "subtitle": subtitle,
        "content": f"{header}{content}"
    }


def _is_appendix(part: str) -> bool:
    """Verifica se una parte di testo e l'appendice."""
    upper_start = part[:500].upper()
    return "APPENDICE" in upper_start[:200] or upper_start.startswith("APPENDICE")


def _make_appendix_lesson(content: str, order: int) -> dict[str, object]:
    """Crea il dizionario lezione per l'appendice."""
    return {
        "module_num": 99,
        "lesson_num": order,
        "title": "Appendice Pratica",
        "subtitle": "Applicazione concreta dei principi PT in campo",
        "content": f"# Appendice Pratica\n\n*Applicazione concreta dei principi PT in campo*\n\n{content}"
    }


def split_into_lessons(full_text: str) -> list[dict[str, object]]:
    """Divide il testo in lezioni basandosi sui markers 'Modulo XX - Lezione YY'."""
    parts = LESSON_SPLIT_PATTERN.split(full_text)

    lessons: list[dict[str, object]] = []
    appendix_content: Optional[str] = None

    for part in parts:
        part = part.strip()
        if not part:
            continue

        if _is_appendix(part):
            appendix_content = part
            continue

        lesson = _parse_lesson_from_part(part)
        if lesson:
            lessons.append(lesson)
        elif "appendice" in part[:500].lower():
            appendix_content = part

    if appendix_content:
        lessons.append(_make_appendix_lesson(appendix_content, len(lessons) + 1))

    return lessons


def _build_module_doc(order: int) -> dict[str, object]:
    """Crea il documento MongoDB per il modulo."""
    return {
        "id": MODULE_ID,
        "order": order,
        "title": MODULE_TITLE,
        "subtitle": MODULE_SUBTITLE,
        "description": MODULE_DESCRIPTION,
        "icon": "book",
        "color": "#D4AF37",
        "is_premium": True
    }


def _build_lesson_doc(index: int, lesson_data: dict[str, object]) -> dict[str, object]:
    """Crea il documento MongoDB per una lezione."""
    content = str(lesson_data["content"])
    return {
        "id": f"les-pt-mio-{str(index + 1).zfill(2)}",
        "module_id": MODULE_ID,
        "order": index + 1,
        "title": lesson_data["title"],
        "content": content,
        "video_url": "",
        "video_type": "none",
        "duration_minutes": max(15, len(content) // 500)
    }


async def seed_tutta_pt() -> None:
    """Entry point per il seeding standalone."""
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    existing = await db.modules.find_one({"id": MODULE_ID})
    if existing:
        print(f"Modulo '{MODULE_TITLE}' gia presente. Aggiornamento...")
        await db.modules.delete_one({"id": MODULE_ID})
        await db.lessons.delete_many({"module_id": MODULE_ID})

    print("Estrazione testo dal documento...")
    full_text = extract_text_from_docx(DOCX_PATH)
    print(f"Testo estratto: {len(full_text)} caratteri")

    print("Divisione in lezioni...")
    lessons = split_into_lessons(full_text)
    print(f"Trovate {len(lessons)} lezioni")

    if not lessons:
        print("ERRORE: Nessuna lezione trovata! Inserimento come singola lezione...")
        lessons = [{"module_num": 1, "lesson_num": 1, "title": MODULE_TITLE,
                     "subtitle": "Il percorso completo", "content": full_text}]

    max_order = await db.modules.count_documents({})
    await db.modules.insert_one(_build_module_doc(max_order + 1))
    print(f"Modulo '{MODULE_TITLE}' creato (ordine: {max_order + 1})")

    for i, lesson_data in enumerate(lessons):
        doc = _build_lesson_doc(i, lesson_data)
        await db.lessons.insert_one(doc)
        print(f"  Lezione {i + 1}: {lesson_data['title']} ({doc['duration_minutes']} min)")

    print(f"\nCompletato! {len(lessons)} lezioni inserite")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_tutta_pt())
