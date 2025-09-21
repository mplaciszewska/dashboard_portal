from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import StyleSheet1, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


from .settings import ReportSettings


class StyleBuilder:
    def __init__(self, settings: ReportSettings) -> None:
        self.settings = settings
        self.reset()

    def reset(self) -> None:
        self._style = StyleSheet1()

    @property
    def style(self) -> StyleSheet1:
        style = self._style
        self.reset()
        return style

    def register_fonts(self) -> None:
        pdfmetrics._reset()
        pdfmetrics.registerFont(TTFont("regular", self.settings.font_regular))
        pdfmetrics.registerFont(TTFont("bold", self.settings.font_bold))
        pdfmetrics.registerFont(TTFont("heading", self.settings.font_heading))

    def create_paragraph_styles(self) -> None:
        styles = [
            ParagraphStyle(
                name="title",
                fontName="heading",
                fontSize=16,
                leading=30,
                alignment=TA_CENTER,
            ),
            ParagraphStyle(
                name="subtitle",
                fontName="heading",
                fontSize=14,
                leading=24,
                alignment=TA_CENTER,
            ),
            ParagraphStyle(
                name="heading1",
                fontName="bold",
                fontSize=16,
                leading=24,
                spaceBefore=16,
                alignment=TA_LEFT,
            ),
            ParagraphStyle(
                name="heading2",
                fontName="bold",
                fontSize=12,
                leading=18,
                spaceBefore=6,
                spaceAfter=6,
                alignment=TA_LEFT,
                leftIndent=10,
            ),
            ParagraphStyle(
                name="normal",
                fontName="regular",
                fontSize=11,
                leading=16,
                alignment=TA_LEFT,
            ),
            ParagraphStyle(
                name="normal_spaced",
                fontName="regular",
                fontSize=12,
                leading=18,
                alignment=TA_LEFT,
            ),
            ParagraphStyle(
                name="normal_center",
                fontName="regular",
                fontSize=11,
                leading=16,
                alignment=TA_CENTER,
            ),
            ParagraphStyle(
                name="normal_right",
                fontName="regular",
                fontSize=12,
                leading=16,
                alignment=TA_RIGHT,
            ),
            ParagraphStyle(
                name="normal_bold",
                fontName="bold",
                fontSize=12,
                leading=16,
                alignment=TA_LEFT,
            ),
            ParagraphStyle(
                name="normal_bold_center",
                fontName="bold",
                fontSize=12,
                leading=16,
                alignment=TA_CENTER,
            ),
            ParagraphStyle(
                name="small",
                fontName="regular",
                fontSize=10,
                leading=12,
                alignment=TA_LEFT,
            ),
            ParagraphStyle(
                name="x_small_center",
                fontName="regular",
                fontSize=6,
                leading=7,
                alignment=TA_CENTER,
                wordWrap="CJK",
            ),
            ParagraphStyle(
                name="small_center",
                fontName="regular",
                fontSize=10,
                leading=12,
                alignment=TA_CENTER,
            ),
            ParagraphStyle(
                name="small_bold",
                fontName="bold",
                fontSize=10,
                leading=12,
                alignment=TA_LEFT,
            ),
            ParagraphStyle(
                name="small_bold_center",
                fontName="bold",
                fontSize=10,
                leading=12,
                alignment=TA_CENTER,
            ),
            ParagraphStyle(
                name="list_numbered",
                fontName="regular",
                fontSize=12,
                leading=18,
                alignment=TA_LEFT,
                leftIndent=30,
                bulletFontSize=12,
                bulletIndent=0,
            ),
            ParagraphStyle(
                name="list_bullet",
                fontName="regular",
                fontSize=12,
                leading=18,
                alignment=TA_LEFT,
                leftIndent=40,
                bulletFontSize=18,
                bulletIndent=20,
            ),
            ParagraphStyle(
                name="link",
                fontName="regular",
                fontSize=12,
                leading=18,
                alignment=TA_RIGHT,
                textColor=colors.blue,
            ),
        ]

        for style in styles:
            self._style.add(style)
