import os
import re
import logging
from bs4 import BeautifulSoup
from pypdf import PdfReader
from docx import Document

logger = logging.getLogger(__name__)

def parse_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()

def parse_md(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()

def parse_html(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()
    soup = BeautifulSoup(html, "html.parser")
    # Remove script and style elements
    for script in soup(["script", "style"]):
        script.decompose()
    # Get text
    text = soup.get_text()
    # Collapse whitespace
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = "\n".join(chunk for chunk in chunks if chunk)
    return text.strip()

def parse_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text_content = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            text_content.append(text)
    return "\n\n".join(text_content).strip()

def parse_docx(file_path: str) -> str:
    doc = Document(file_path)
    text_content = []
    for para in doc.paragraphs:
        if para.text.strip():
            text_content.append(para.text)
    return "\n".join(text_content).strip()

def extract_text_from_file(file_path: str) -> str:
    """Parses files and extracts raw text based on extension."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".txt":
            return parse_txt(file_path)
        elif ext in (".md", ".markdown"):
            return parse_md(file_path)
        elif ext in (".html", ".htm"):
            return parse_html(file_path)
        elif ext == ".pdf":
            return parse_pdf(file_path)
        elif ext == ".docx":
            return parse_docx(file_path)
        else:
            # Fallback to standard text reading
            logger.warning(f"Unsupported file format {ext}. Attempting to read as plain text.")
            return parse_txt(file_path)
    except Exception as e:
        logger.error(f"Error parsing file {file_path} with extension {ext}: {e}")
        raise e
