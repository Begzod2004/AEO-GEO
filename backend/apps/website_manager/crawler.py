"""Pure crawling logic, decoupled from Django and the network.

``crawl_site`` takes a ``Fetcher`` so the whole thing is testable offline: prod
uses ``RequestsFetcher``, tests pass a fake. It never raises for network issues
— failures are reported in the returned dict.
"""
from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

DEFAULT_TIMEOUT = 10
MAX_LINKS_TO_CHECK = 25
USER_AGENT = "AEOGEOBot/1.0 (+https://aeo.geo)"


@dataclass
class FetchResponse:
    url: str
    status_code: int
    text: str = ""
    elapsed: float = 0.0
    ok: bool = True
    error: str = ""


class RequestsFetcher:
    """Real HTTP fetcher backed by ``requests`` (imported lazily so unit tests
    that inject a fake fetcher don't need the library at import time)."""

    def __init__(self, timeout: int = DEFAULT_TIMEOUT):
        import requests

        self._requests = requests
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT

    def get(self, url: str) -> FetchResponse:
        try:
            r = self.session.get(url, timeout=self.timeout, allow_redirects=True)
            return FetchResponse(
                url, r.status_code, r.text, r.elapsed.total_seconds(), r.ok
            )
        except self._requests.RequestException as exc:
            return FetchResponse(url, 0, ok=False, error=str(exc))

    def head(self, url: str) -> FetchResponse:
        try:
            r = self.session.head(url, timeout=self.timeout, allow_redirects=True)
            # Many servers mishandle HEAD (405/501) — fall back to a light GET.
            if r.status_code in (403, 405, 501):
                r = self.session.get(
                    url, timeout=self.timeout, allow_redirects=True, stream=True
                )
            return FetchResponse(
                url, r.status_code, ok=r.ok, elapsed=r.elapsed.total_seconds()
            )
        except self._requests.RequestException as exc:
            return FetchResponse(url, 0, ok=False, error=str(exc))


def performance_score(elapsed_seconds: float) -> int:
    """Crude 0-100 speed score from main-page load time."""
    if elapsed_seconds <= 0.4:
        return 100
    return max(0, min(100, int(round(100 - (elapsed_seconds - 0.4) * 35))))


def _clean_links(base_url: str, soup: BeautifulSoup) -> list[str]:
    out, seen = [], set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        absolute = urljoin(base_url, href)
        if urlparse(absolute).scheme not in ("http", "https"):
            continue
        if absolute not in seen:
            seen.add(absolute)
            out.append(absolute)
    return out


def crawl_site(url: str, fetcher=None, max_links: int = MAX_LINKS_TO_CHECK) -> dict:
    """Crawl a single page and its outbound links. Returns a meta dict; the
    ``status`` key is ``"done"`` or ``"failed"``."""
    fetcher = fetcher or RequestsFetcher()
    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"

    main = fetcher.get(url)
    if not main.ok:
        return {
            "status": "failed",
            "error": main.error or f"HTTP {main.status_code}",
        }

    soup = BeautifulSoup(main.text, "html.parser")

    title = soup.title.get_text(strip=True) if soup.title else ""
    desc = soup.find("meta", attrs={"name": "description"})
    meta_description = (desc.get("content", "").strip() if desc else "")
    canon = soup.find("link", attrs={"rel": "canonical"})
    canonical = canon.get("href", "").strip() if canon else ""

    has_robots = fetcher.head(f"{origin}/robots.txt").ok
    has_sitemap = fetcher.head(f"{origin}/sitemap.xml").ok

    links = _clean_links(url, soup)
    internal = [l for l in links if urlparse(l).netloc == parsed.netloc]
    external = [l for l in links if urlparse(l).netloc != parsed.netloc]

    to_check = links[:max_links]
    broken = []
    for link in to_check:
        resp = fetcher.head(link)
        if not resp.ok or resp.status_code >= 400:
            broken.append(
                {"url": link, "status": resp.status_code, "error": resp.error}
            )

    return {
        "status": "done",
        "title": title,
        "meta_description": meta_description,
        "canonical": canonical,
        "has_robots": has_robots,
        "has_sitemap": has_sitemap,
        "links_total": len(links),
        "internal_links": len(internal),
        "external_links": len(external),
        "links_checked": len(to_check),
        "broken_links": broken,
        "performance_score": performance_score(main.elapsed),
    }
