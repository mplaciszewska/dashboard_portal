from dataclasses import dataclass

@dataclass(frozen=True)
class ReportSettings:
    font_regular: str
    font_bold: str
    font_heading: str