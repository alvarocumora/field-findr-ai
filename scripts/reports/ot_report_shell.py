"""
OT REPORT SHELL — formato único para informes y tasaciones de Oferta Terrenos.

Shell editorial (portada, cabeceras, pies, folio, QR de verificación y bloques
de contenido) para que TODOS los entregables PDF —tasaciones, peritajes,
informes de mercado, dossiers y fichas ejecutivas— salgan con la misma
identidad: moderna, comercial y sobria.

Uso mínimo:

    from ot_report_shell import Report, DocMeta

    r = Report(DocMeta(
        doc_type="Informe de tasación comercial",
        title="Parcelas Valle Escondido",
        subtitle="Comuna de Hualañé, Región del Maule",
        folio="OT-TAS-2026-0142",
        date="22 de agosto de 2026",
        prepared_for="Banco de Chile · Banca Empresas",
        author="Oferta Terrenos · Valuation",
    ))
    r.cover(highlights=[("Valor de mercado", "UF 18.400"), ...])
    r.section("Antecedentes del predio")
    r.p("...")
    r.save("/mnt/documents/informe.pdf")

Reglas de marca (no negociables):
  · Paleta blanco + verdes OT (#164E34 / #22C55E) con acento cian (#0EA5E9).
  · Wordmark OFERTA TERRENOS + marca vectorial de deslinde.
  · Nada de emojis, degradados chillones ni tipografías decorativas.
"""

from __future__ import annotations

import io
import subprocess
from dataclasses import dataclass, field
from typing import Iterable, Sequence

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas

# --------------------------------------------------------------------------- #
# Marca
# --------------------------------------------------------------------------- #

FOREST = HexColor("#164E34")
EMERALD = HexColor("#22C55E")
SKY = HexColor("#0EA5E9")
INK = HexColor("#12181A")
BODY = HexColor("#333B38")
GRAY = HexColor("#6E7672")
LINE = HexColor("#E2E6E3")
SOFT = HexColor("#F5F8F5")
WHITE = HexColor("#FFFFFF")
AMBER = HexColor("#B45309")

BRAND = "OFERTA TERRENOS"
DOMAIN = "ofertaterrenos.com"
ORIGIN = "https://ofertaterrenos.com"

PAGE_W, PAGE_H = A4
ML, MR = 20 * mm, 18 * mm
MT, MB = 24 * mm, 20 * mm
CONTENT_W = PAGE_W - ML - MR
TOP = PAGE_H - MT
BOTTOM = MB + 6 * mm


def _register_fonts() -> tuple[str, str]:
    try:
        reg = subprocess.check_output(["fc-match", "-f", "%{file}", "DejaVu Sans"], text=True).strip()
        bold = subprocess.check_output(["fc-match", "-f", "%{file}", "DejaVu Sans:bold"], text=True).strip()
        pdfmetrics.registerFont(TTFont("OTSans", reg))
        pdfmetrics.registerFont(TTFont("OTSans-Bold", bold))
        return "OTSans", "OTSans-Bold"
    except Exception:  # pragma: no cover - fallback defensivo
        return "Helvetica", "Helvetica-Bold"


FONT, FONT_B = _register_fonts()


@dataclass
class DocMeta:
    doc_type: str
    title: str
    subtitle: str = ""
    folio: str = ""
    date: str = ""
    prepared_for: str = ""
    author: str = f"{BRAND} · Valuation"
    confidential: bool = True
    qr_url: str = ORIGIN
    footer_note: str = ""
    facts: list[tuple[str, str]] = field(default_factory=list)


# --------------------------------------------------------------------------- #
# Utilidades
# --------------------------------------------------------------------------- #

def clp(value: float) -> str:
    """Formato monetario chileno: $ 1.234.567."""
    return "$ " + f"{round(value):,}".replace(",", ".")


def num(value: float, dec: int = 0) -> str:
    s = f"{value:,.{dec}f}"
    return s.replace(",", "@").replace(".", ",").replace("@", ".")


def _wrap(text: str, font: str, size: float, width: float) -> list[str]:
    words, lines, cur = text.split(), [], ""
    for w in words:
        probe = f"{cur} {w}".strip()
        if pdfmetrics.stringWidth(probe, font, size) <= width:
            cur = probe
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def _qr_image(url: str):
    import qrcode

    qr = qrcode.QRCode(box_size=10, border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#12181A", back_color="white").convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    from reportlab.lib.utils import ImageReader

    return ImageReader(buf)


# --------------------------------------------------------------------------- #
# Shell
# --------------------------------------------------------------------------- #

class Report:
    def __init__(self, meta: DocMeta, path: str | None = None):
        self.meta = meta
        self.buf = io.BytesIO()
        self.c = rl_canvas.Canvas(self.buf, pagesize=A4)
        self.c.setTitle(f"{meta.title} — {meta.doc_type}")
        self.c.setAuthor(meta.author)
        self.c.setSubject(meta.doc_type)
        self.y = TOP
        self.page = 0
        self.section_label = ""
        self._started = False
        self.path = path

    # ---------------------------------------------------------------- marca
    def _wordmark(self, x: float, y: float, size: float = 10, light: bool = False) -> float:
        """Dibuja la marca (deslinde + wordmark). Devuelve el ancho usado."""
        c = self.c
        s = size
        c.saveState()
        # Marca: parcela con vértice destacado
        c.setLineWidth(1.1)
        c.setStrokeColor(WHITE if light else FOREST)
        p = c.beginPath()
        p.moveTo(x, y)
        p.lineTo(x + s * 0.95, y - s * 0.18)
        p.lineTo(x + s * 0.82, y + s * 0.9)
        p.lineTo(x + s * 0.08, y + s * 0.72)
        p.close()
        c.drawPath(p)
        c.setFillColor(EMERALD)
        c.circle(x + s * 0.95, y - s * 0.18, s * 0.15, stroke=0, fill=1)
        # Wordmark
        tx = x + s * 1.5
        c.setFont(FONT_B, s * 0.86)
        c.setFillColor(WHITE if light else INK)
        c.drawString(tx, y + s * 0.16, "OFERTA")
        w1 = pdfmetrics.stringWidth("OFERTA ", FONT_B, s * 0.86)
        c.setFont(FONT, s * 0.86)
        c.setFillColor(WHITE if light else FOREST)
        c.drawString(tx + w1, y + s * 0.16, "TERRENOS")
        w2 = pdfmetrics.stringWidth("TERRENOS", FONT, s * 0.86)
        c.restoreState()
        return (tx + w1 + w2) - x

    # -------------------------------------------------------------- portada
    def cover(self, highlights: Sequence[tuple[str, str]] = (), summary: str = "") -> None:
        m, c = self.meta, self.c
        self.page = 1
        self._started = True

        band_h = 118 * mm
        c.setFillColor(FOREST)
        c.rect(0, PAGE_H - band_h, PAGE_W, band_h, stroke=0, fill=1)
        # Textura de deslindes sutil
        c.saveState()
        c.setStrokeColor(Color(1, 1, 1, alpha=0.07))
        c.setLineWidth(0.6)
        for i in range(-6, 22):
            x = i * 18 * mm
            c.line(x, PAGE_H - band_h, x + band_h * 0.55, PAGE_H)
        c.restoreState()
        c.setFillColor(EMERALD)
        c.rect(0, PAGE_H - band_h, PAGE_W, 2.2, stroke=0, fill=1)

        self._wordmark(ML, PAGE_H - 22 * mm, 11, light=True)

        c.setFont(FONT, 8)
        c.setFillColor(Color(1, 1, 1, alpha=0.75))
        c.drawRightString(PAGE_W - MR, PAGE_H - 20 * mm, m.folio or DOMAIN)
        if m.confidential:
            c.drawRightString(PAGE_W - MR, PAGE_H - 25 * mm, "Documento confidencial")

        y = PAGE_H - 52 * mm
        c.setFont(FONT_B, 8.5)
        c.setFillColor(EMERALD)
        c.drawString(ML, y, m.doc_type.upper())
        y -= 12 * mm

        c.setFillColor(WHITE)
        for line in _wrap(m.title, FONT_B, 27, CONTENT_W - 10 * mm):
            c.setFont(FONT_B, 27)
            c.drawString(ML, y, line)
            y -= 11.5 * mm
        if m.subtitle:
            c.setFont(FONT, 12.5)
            c.setFillColor(Color(1, 1, 1, alpha=0.82))
            for line in _wrap(m.subtitle, FONT, 12.5, CONTENT_W - 20 * mm):
                c.drawString(ML, y, line)
                y -= 6.5 * mm

        # Ficha de emisión
        y = PAGE_H - band_h - 16 * mm
        rows = [r for r in (
            ("Fecha de emisión", m.date),
            ("Preparado para", m.prepared_for),
            ("Emitido por", m.author),
            ("Folio", m.folio),
        ) if r[1]]
        col = CONTENT_W / 2
        for i, (k, v) in enumerate(rows):
            cx = ML + (i % 2) * col
            cy = y - (i // 2) * 15 * mm
            c.setFont(FONT, 7.5)
            c.setFillColor(GRAY)
            c.drawString(cx, cy, k.upper())
            c.setFont(FONT_B, 10.5)
            c.setFillColor(INK)
            c.drawString(cx, cy - 5.4 * mm, v)
        y -= ((len(rows) + 1) // 2) * 15 * mm + 4 * mm

        if summary:
            c.setStrokeColor(LINE)
            c.setLineWidth(0.7)
            c.line(ML, y, PAGE_W - MR, y)
            y -= 8 * mm
            c.setFont(FONT, 9.6)
            c.setFillColor(BODY)
            for line in _wrap(summary, FONT, 9.6, CONTENT_W):
                c.drawString(ML, y, line)
                y -= 5.2 * mm
            y -= 4 * mm

        if highlights:
            n = min(len(highlights), 3)
            gap = 5 * mm
            w = (CONTENT_W - gap * (n - 1)) / n
            h = 24 * mm
            for i, (label, value) in enumerate(list(highlights)[:n]):
                x = ML + i * (w + gap)
                c.setFillColor(SOFT)
                c.roundRect(x, y - h, w, h, 2.5 * mm, stroke=0, fill=1)
                c.setFillColor(EMERALD)
                c.rect(x, y - h, 1.8, h, stroke=0, fill=1)
                c.setFont(FONT, 7.2)
                c.setFillColor(GRAY)
                c.drawString(x + 5 * mm, y - 8.5 * mm, label.upper()[:34])
                size = 14
                while pdfmetrics.stringWidth(value, FONT_B, size) > w - 10 * mm and size > 8:
                    size -= 0.5
                c.setFont(FONT_B, size)
                c.setFillColor(FOREST)
                c.drawString(x + 5 * mm, y - 17 * mm, value)
            y -= h + 6 * mm

        # Pie de portada con QR
        qr = 22 * mm
        base = MB
        c.drawImage(_qr_image(m.qr_url), ML, base, qr, qr, mask="auto")
        c.setFont(FONT_B, 8.5)
        c.setFillColor(INK)
        c.drawString(ML + qr + 5 * mm, base + qr - 6 * mm, "Verificación en línea")
        c.setFont(FONT, 8)
        c.setFillColor(GRAY)
        for i, line in enumerate(_wrap(
            m.footer_note or f"Escanee el código para consultar la versión vigente de este documento en {DOMAIN}.",
            FONT, 8, CONTENT_W - qr - 12 * mm)[:3]):
            c.drawString(ML + qr + 5 * mm, base + qr - 11 * mm - i * 4.4 * mm, line)
        c.setStrokeColor(LINE)
        c.line(ML, base + qr + 6 * mm, PAGE_W - MR, base + qr + 6 * mm)
        self._new_page()

    # ------------------------------------------------------ cabecera / pie
    def _chrome(self) -> None:
        c, m = self.c, self.meta
        self._wordmark(ML, PAGE_H - 15 * mm, 7.4)
        c.setFont(FONT, 7.4)
        c.setFillColor(GRAY)
        label = self.section_label or m.doc_type
        c.drawRightString(PAGE_W - MR, PAGE_H - 14.4 * mm, label[:72])
        c.setStrokeColor(LINE)
        c.setLineWidth(0.7)
        c.line(ML, PAGE_H - 18.5 * mm, PAGE_W - MR, PAGE_H - 18.5 * mm)

        c.line(ML, MB + 8 * mm, PAGE_W - MR, MB + 8 * mm)
        c.setFont(FONT, 7.2)
        c.setFillColor(GRAY)
        left = " · ".join(x for x in (m.folio, m.date) if x) or DOMAIN
        c.drawString(ML, MB + 3.6 * mm, left)
        c.setFillColor(FOREST)
        c.drawCentredString(PAGE_W / 2, MB + 3.6 * mm, DOMAIN)
        c.setFillColor(GRAY)
        c.drawRightString(PAGE_W - MR, MB + 3.6 * mm, f"Página {self.page}")

    def _new_page(self) -> None:
        self.c.showPage()
        self.page += 1
        self._chrome()
        self.y = TOP

    def _space(self, needed: float) -> None:
        if not self._started:
            self._started = True
            self.page = 1
            self._chrome()
            self.y = TOP
        if self.y - needed < BOTTOM:
            self._new_page()

    def page_break(self) -> None:
        self._space(1)
        self._new_page()

    # ------------------------------------------------------------ bloques
    def section(self, title: str, kicker: str = "") -> None:
        self._space(26 * mm)
        c = self.c
        if kicker:
            c.setFont(FONT_B, 7.6)
            c.setFillColor(EMERALD)
            c.drawString(ML, self.y, kicker.upper())
            self.y -= 5.6 * mm
        c.setFont(FONT_B, 15)
        c.setFillColor(INK)
        for line in _wrap(title, FONT_B, 15, CONTENT_W):
            c.drawString(ML, self.y, line)
            self.y -= 7 * mm
        c.setStrokeColor(FOREST)
        c.setLineWidth(1.4)
        c.line(ML, self.y + 2 * mm, ML + 16 * mm, self.y + 2 * mm)
        self.y -= 4 * mm
        self.section_label = title

    def subsection(self, title: str) -> None:
        self._space(16 * mm)
        self.c.setFont(FONT_B, 10.8)
        self.c.setFillColor(FOREST)
        self.c.drawString(ML, self.y, title)
        self.y -= 6.6 * mm

    def p(self, text: str, size: float = 9.5, color: Color = BODY) -> None:
        for line in _wrap(text, FONT, size, CONTENT_W):
            self._space(7 * mm)
            self.c.setFont(FONT, size)
            self.c.setFillColor(color)
            self.c.drawString(ML, self.y, line)
            self.y -= size * 0.52 * mm + 1.6 * mm
        self.y -= 2 * mm

    def bullets(self, items: Iterable[str], size: float = 9.3) -> None:
        for item in items:
            lines = _wrap(item, FONT, size, CONTENT_W - 6 * mm)
            self._space(len(lines) * 5.4 * mm + 2 * mm)
            self.c.setFillColor(EMERALD)
            self.c.circle(ML + 1.4 * mm, self.y + 1.2 * mm, 0.9 * mm, stroke=0, fill=1)
            self.c.setFillColor(BODY)
            for i, line in enumerate(lines):
                self.c.setFont(FONT, size)
                self.c.drawString(ML + 6 * mm, self.y, line)
                self.y -= 5.2 * mm
                if i < len(lines) - 1:
                    self._space(6 * mm)
            self.y -= 1 * mm
        self.y -= 2 * mm

    def kpis(self, items: Sequence[tuple[str, str, str]], cols: int = 3) -> None:
        """items: (etiqueta, valor, nota)."""
        gap = 4.5 * mm
        rows = [items[i:i + cols] for i in range(0, len(items), cols)]
        for row in rows:
            h = 22 * mm
            self._space(h + 5 * mm)
            w = (CONTENT_W - gap * (cols - 1)) / cols
            for i, item in enumerate(row):
                label, value, note = (list(item) + ["", "", ""])[:3]
                x = ML + i * (w + gap)
                y0 = self.y - h
                self.c.setFillColor(SOFT)
                self.c.roundRect(x, y0, w, h, 2 * mm, stroke=0, fill=1)
                self.c.setFillColor(FOREST)
                self.c.rect(x, y0, 1.6, h, stroke=0, fill=1)
                self.c.setFont(FONT, 6.9)
                self.c.setFillColor(GRAY)
                self.c.drawString(x + 4.5 * mm, y0 + h - 6 * mm, label.upper()[:32])
                size = 13
                while pdfmetrics.stringWidth(value, FONT_B, size) > w - 9 * mm and size > 7:
                    size -= 0.5
                self.c.setFont(FONT_B, size)
                self.c.setFillColor(INK)
                self.c.drawString(x + 4.5 * mm, y0 + h - 13.5 * mm, value)
                if note:
                    self.c.setFont(FONT, 6.8)
                    self.c.setFillColor(GRAY)
                    self.c.drawString(x + 4.5 * mm, y0 + 4 * mm, note[:44])
            self.y -= h + gap
        self.y -= 1 * mm

    def table(
        self,
        headers: Sequence[str],
        rows: Sequence[Sequence[str]],
        widths: Sequence[float] | None = None,
        align: Sequence[str] | None = None,
        size: float = 8.4,
    ) -> None:
        n = len(headers)
        widths = list(widths) if widths else [1] * n
        total = sum(widths)
        cols = [CONTENT_W * w / total for w in widths]
        align = list(align) if align else ["L"] + ["R"] * (n - 1)
        head_h = 8 * mm

        def draw_head() -> None:
            self._space(head_h + 12 * mm)
            self.c.setFillColor(FOREST)
            self.c.rect(ML, self.y - head_h, CONTENT_W, head_h, stroke=0, fill=1)
            x = ML
            for i, h in enumerate(headers):
                self.c.setFont(FONT_B, size - 0.4)
                self.c.setFillColor(WHITE)
                if align[i] == "R":
                    self.c.drawRightString(x + cols[i] - 3 * mm, self.y - head_h + 2.9 * mm, h)
                else:
                    self.c.drawString(x + 3 * mm, self.y - head_h + 2.9 * mm, h)
                x += cols[i]
            self.y -= head_h

        draw_head()
        for r, row in enumerate(rows):
            cells = [_wrap(str(v), FONT, size, cols[i] - 6 * mm) for i, v in enumerate(row)]
            h = max(len(x) for x in cells) * 4.6 * mm + 3.2 * mm
            if self.y - h < BOTTOM:
                self._new_page()
                draw_head()
            if r % 2 == 0:
                self.c.setFillColor(SOFT)
                self.c.rect(ML, self.y - h, CONTENT_W, h, stroke=0, fill=1)
            x = ML
            for i, lines in enumerate(cells):
                self.c.setFont(FONT, size)
                self.c.setFillColor(BODY)
                for j, line in enumerate(lines):
                    ly = self.y - 4.6 * mm - j * 4.4 * mm
                    if align[i] == "R":
                        self.c.drawRightString(x + cols[i] - 3 * mm, ly, line)
                    else:
                        self.c.drawString(x + 3 * mm, ly, line)
                x += cols[i]
            self.c.setStrokeColor(LINE)
            self.c.setLineWidth(0.5)
            self.c.line(ML, self.y - h, ML + CONTENT_W, self.y - h)
            self.y -= h
        self.y -= 5 * mm

    def callout(self, title: str, text: str, kind: str = "info") -> None:
        accent = {"info": SKY, "ok": EMERALD, "warn": AMBER, "brand": FOREST}.get(kind, SKY)
        lines = _wrap(text, FONT, 9, CONTENT_W - 12 * mm)
        h = 12 * mm + len(lines) * 4.9 * mm
        self._space(h + 5 * mm)
        y0 = self.y - h
        self.c.setFillColor(SOFT)
        self.c.roundRect(ML, y0, CONTENT_W, h, 2 * mm, stroke=0, fill=1)
        self.c.setFillColor(accent)
        self.c.rect(ML, y0, 2.2, h, stroke=0, fill=1)
        self.c.setFont(FONT_B, 9.2)
        self.c.setFillColor(accent)
        self.c.drawString(ML + 6 * mm, self.y - 6.5 * mm, title)
        self.c.setFillColor(BODY)
        for i, line in enumerate(lines):
            self.c.setFont(FONT, 9)
            self.c.drawString(ML + 6 * mm, self.y - 12 * mm - i * 4.9 * mm, line)
        self.y -= h + 5 * mm

    def keyvalues(self, pairs: Sequence[tuple[str, str]], cols: int = 2) -> None:
        gap = 6 * mm
        w = (CONTENT_W - gap * (cols - 1)) / cols
        rows = [pairs[i:i + cols] for i in range(0, len(pairs), cols)]
        for row in rows:
            hs = []
            for _, v in row:
                hs.append(len(_wrap(v, FONT_B, 9.4, w)))
            h = 6 * mm + max(hs) * 5 * mm
            self._space(h + 3 * mm)
            for i, (k, v) in enumerate(row):
                x = ML + i * (w + gap)
                self.c.setFont(FONT, 7.2)
                self.c.setFillColor(GRAY)
                self.c.drawString(x, self.y, k.upper())
                self.c.setFillColor(INK)
                for j, line in enumerate(_wrap(v, FONT_B, 9.4, w)):
                    self.c.setFont(FONT_B, 9.4)
                    self.c.drawString(x, self.y - 5 * mm - j * 5 * mm, line)
            self.c.setStrokeColor(LINE)
            self.c.setLineWidth(0.5)
            self.c.line(ML, self.y - h + 1.5 * mm, PAGE_W - MR, self.y - h + 1.5 * mm)
            self.y -= h + 2 * mm
        self.y -= 2 * mm

    def image(self, path: str, height: float, caption: str = "") -> None:
        from reportlab.lib.utils import ImageReader

        img = ImageReader(path)
        iw, ih = img.getSize()
        w = min(CONTENT_W, height * iw / ih)
        h = w * ih / iw
        self._space(h + (8 * mm if caption else 4 * mm))
        self.c.drawImage(img, ML, self.y - h, w, h, mask="auto")
        self.c.setStrokeColor(LINE)
        self.c.rect(ML, self.y - h, w, h, stroke=1, fill=0)
        self.y -= h + 3 * mm
        if caption:
            self.c.setFont(FONT, 7.6)
            self.c.setFillColor(GRAY)
            self.c.drawString(ML, self.y, caption)
            self.y -= 5 * mm
        self.y -= 2 * mm

    def signature(self, name: str, role: str, extra: str = "") -> None:
        self._space(34 * mm)
        self.c.setStrokeColor(LINE)
        self.c.line(ML, self.y - 16 * mm, ML + 70 * mm, self.y - 16 * mm)
        self.c.setFont(FONT_B, 9.6)
        self.c.setFillColor(INK)
        self.c.drawString(ML, self.y - 21 * mm, name)
        self.c.setFont(FONT, 8.4)
        self.c.setFillColor(GRAY)
        self.c.drawString(ML, self.y - 25.5 * mm, role)
        if extra:
            self.c.drawString(ML, self.y - 30 * mm, extra)
        qr = 24 * mm
        self.c.drawImage(_qr_image(self.meta.qr_url), PAGE_W - MR - qr, self.y - 30 * mm, qr, qr, mask="auto")
        self.c.setFont(FONT, 6.8)
        self.c.setFillColor(GRAY)
        self.c.drawRightString(PAGE_W - MR, self.y - 33.5 * mm, "Verificar documento")
        self.y -= 38 * mm

    def closing(self, text: str) -> None:
        self._space(20 * mm)
        self.c.setFillColor(FOREST)
        self.c.rect(ML, self.y - 16 * mm, CONTENT_W, 16 * mm, stroke=0, fill=1)
        self.c.setFont(FONT, 8.2)
        self.c.setFillColor(WHITE)
        for i, line in enumerate(_wrap(text, FONT, 8.2, CONTENT_W - 12 * mm)[:2]):
            self.c.drawString(ML + 6 * mm, self.y - 6.5 * mm - i * 4.6 * mm, line)
        self.y -= 20 * mm

    # ---------------------------------------------------------------- salida
    def save(self, path: str) -> str:
        self.c.showPage()
        self.c.save()
        data = self.buf.getvalue()
        with open(path, "wb") as fh:
            fh.write(data)
        return path
