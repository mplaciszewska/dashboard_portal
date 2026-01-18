from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import StyleSheet1, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from .settings import ReportSettings, ReportColors


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
                fontSize=24,
                leading=32,
                alignment=TA_CENTER,
                textColor=ReportColors.PRIMARY,
                spaceBefore=12,
                spaceAfter=6,
            ),
            ParagraphStyle(
                name="subtitle",
                fontName="regular",
                fontSize=14,
                leading=20,
                alignment=TA_CENTER,
                textColor=ReportColors.SECONDARY,
                spaceAfter=20,
            ),
            ParagraphStyle(
                name="section_header",
                fontName="heading",
                fontSize=14,
                leading=22,
                spaceBefore=20,
                spaceAfter=12,
                alignment=TA_CENTER,
                textColor=ReportColors.PRIMARY,
                borderColor=ReportColors.SECONDARY,
                borderWidth=0,
                borderPadding=0,
                leftIndent=0,
            ),
            ParagraphStyle(
                name="heading1",
                fontName="bold",
                fontSize=12,
                leading=20,
                spaceBefore=16,
                spaceAfter=8,
                alignment=TA_LEFT,
                textColor=ReportColors.PRIMARY,
            ),
            ParagraphStyle(
                name="heading2",
                fontName="bold",
                fontSize=11,
                leading=18,
                spaceBefore=12,
                spaceAfter=8,
                alignment=TA_LEFT,
                textColor=ReportColors.TEXT_DARK,
            ),
            ParagraphStyle(
                name="normal",
                fontName="regular",
                fontSize=10,
                leading=14,
                alignment=TA_LEFT,
                textColor=ReportColors.TEXT_DARK,
            ),
            ParagraphStyle(
                name="table_header",
                fontName="bold",
                fontSize=10,
                leading=14,
                alignment=TA_LEFT,
                textColor=ReportColors.TEXT_LIGHT,
            ),
            ParagraphStyle(
                name="table_cell",
                fontName="regular",
                fontSize=9,
                leading=13,
                alignment=TA_CENTER,
                textColor=ReportColors.TEXT_DARK,
            ),
            ParagraphStyle(
                name="table_cell_center",
                fontName="regular",
                fontSize=9,
                leading=13,
                alignment=TA_CENTER,
                textColor=ReportColors.TEXT_DARK,
            ),
            ParagraphStyle(
                name="footer",
                fontName="regular",
                fontSize=8,
                leading=12,
                alignment=TA_CENTER,
                textColor=colors.grey,
            ),
            ParagraphStyle(
                name="info_box",
                fontName="regular",
                fontSize=11,
                leading=14,
                alignment=TA_LEFT,
                textColor=ReportColors.TEXT_DARK,
                leftIndent=8,
                rightIndent=8,
            ),
            ParagraphStyle(
                name="info_box_value",
                fontName="bold",
                fontSize=11,
                leading=14,
                alignment=TA_CENTER,
                textColor=ReportColors.PRIMARY,
                wordWrap='LTR',
                splitLongWords=0,
            ),
        ]

        for style in styles:
            self._style.add(style)
