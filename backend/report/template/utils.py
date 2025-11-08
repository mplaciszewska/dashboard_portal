from datetime import datetime
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

from .settings import ReportColors


def create_info_box(styles, label: str, value: str, col_width: float) -> Table:
        """Create a styled info box for key metrics."""
        data = [
            [Paragraph(f"<b>{label}</b>", styles['table_cell'])],
            [Paragraph(str(value), styles['info_box_value'])]
        ]
        t = Table(data, colWidths=[col_width])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ReportColors.BACKGROUND_LIGHT),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 1, ReportColors.BORDER_LIGHT),
            ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
            ('VALIGN', (0, 1), (0, 1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        return t
    
def create_table(data: list, col_widths: list, has_header: bool = True) -> Table:
    table = Table(data, colWidths=col_widths)
    style_commands = [
        ('FONTNAME', (0, 0), (-1, -1), 'regular'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]
    
    if has_header:
        style_commands.extend([
            ('BACKGROUND', (0, 0), (-1, 0), ReportColors.PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), ReportColors.TEXT_LIGHT),
            ('FONTNAME', (0, 0), (-1, 0), 'bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ])
        for i in range(1, len(data)):
            bg_color = ReportColors.BACKGROUND_LIGHT if i % 2 == 0 else colors.white
            style_commands.append(('BACKGROUND', (0, i), (-1, i), bg_color))
    else:
        for i in range(len(data)):
            bg_color = ReportColors.BACKGROUND_LIGHT if i % 2 == 0 else colors.white
            style_commands.append(('BACKGROUND', (0, i), (-1, i), bg_color))
    
    style_commands.extend([
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, ReportColors.PRIMARY if has_header else ReportColors.BORDER_LIGHT),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, ReportColors.BORDER_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, ReportColors.BORDER_LIGHT),
    ])
    
    table.setStyle(TableStyle(style_commands))
    return table


def is_valid_date(str_date):
        try:
            return bool(datetime.strptime(str_date.strip(), "%Y-%m-%d"))
        except Exception:
            return False

def is_valid_month(str_date):
    try:
        parts = str_date.strip().split('-')
        return len(parts) == 2 and len(parts[0]) == 4 and len(parts[1]) == 2
    except Exception:
        return False
    
def sort_key(row):
    try:
        dt_obj = datetime.strptime(row['dt_pzgik'], "%Y-%m-%d")
        # Use year/month/day tuple instead of timestamp to avoid Windows epoch issues
        dt_tuple = (dt_obj.year, dt_obj.month, dt_obj.day)
    except Exception:
        dt_tuple = (0, 0, 0)  # For invalid dates, sort to end
    
    year = -row['rok_wykonania'] if row['rok_wykonania'] is not None else 0
    return (-dt_tuple[0], -dt_tuple[1], -dt_tuple[2], year)