"""Text extraction dispatched by ``source_type``. Heavy parsers are imported
lazily so mock/text paths need no extra libraries installed."""
from __future__ import annotations

import re


def _detect_language(text: str) -> str:
    """Very light heuristic — enough to tag chunks without a heavy dependency."""
    sample = text[:2000]
    if re.search(r"[Ѐ-ӿ]", sample):        # Cyrillic
        return "ru"
    if re.search(r"[؀-ۿ]", sample):        # Arabic script
        return "ar"
    return "en"


def _extract_website(url: str) -> str:
    try:
        import trafilatura

        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded)
            if text:
                return text
    except Exception:
        pass
    # Fallback: reuse the Stage-3 fetcher + strip tags.
    from bs4 import BeautifulSoup

    from apps.website_manager.crawler import RequestsFetcher

    resp = RequestsFetcher().get(url)
    if not resp.ok:
        return ""
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


def extract_text(document) -> str:
    """Return clean text for a Document. Raises ValueError for unsupported types."""
    st = document.source_type
    Source = document.SourceType

    if st == Source.TEXT:
        return document.raw_text or ""

    if st == Source.WEBSITE:
        return _extract_website(document.source_url)

    if st == Source.TXT:
        document.file.open("rb")
        try:
            return document.file.read().decode("utf-8", errors="ignore")
        finally:
            document.file.close()

    if st == Source.PDF:
        import pdfplumber

        with pdfplumber.open(document.file.path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)

    if st == Source.DOCX:
        import docx

        d = docx.Document(document.file.path)
        return "\n".join(p.text for p in d.paragraphs)

    raise ValueError(f"Unsupported source_type: {st}")


detect_language = _detect_language
