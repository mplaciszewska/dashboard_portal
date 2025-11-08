from dataclasses import dataclass
from pathlib import Path
from reportlab.lib import colors

@dataclass(frozen=True)
class ReportSettings:
    font_regular: str
    font_bold: str
    font_heading: str

class ReportColors:
    PRIMARY = colors.HexColor('#1A4A57')
    SECONDARY = colors.HexColor('#800020')
    ACCENT = colors.HexColor('#2474A6')
    LIGHT_TEAL = colors.HexColor('#79A7AC')
    WARM_BEIGE = colors.HexColor('#EBE7A8')
    TEXT_DARK = colors.HexColor('#2C3E50')
    TEXT_LIGHT = colors.white
    BACKGROUND_LIGHT = colors.HexColor('#F8F9FA')
    BORDER_LIGHT = colors.HexColor('#DEE2E6')
   
@dataclass(frozen=True) 
class ReportConfig:
    title: str = "Dashboard Portal"
    subtitle: str = "Raport"
    cornerLogo: str = "Dashboard Portal"
    footer: str = "Dashboard Portal - analiza zdjęć lotniczych w PZGiK"
