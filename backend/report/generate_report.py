import io
import os
from datetime import datetime
import pytz
from collections import Counter
from reportlab.lib.units import inch, cm
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.platypus.flowables import HRFlowable

from .template.template import TemplateBuilder
from .template.style import StyleBuilder
from .template.settings import (
    ReportSettings,
    ReportColors,
    ReportConfig
)
from .template.utils import (
    is_valid_date,
    is_valid_month,
    create_info_box,
    create_table,
    sort_key
)
from ..models import Feature

def generate_report_pdf(data: dict) -> bytes:
    report_date = datetime.now(pytz.timezone("Europe/Warsaw")).strftime('%Y-%m-%d  %H:%M:%S')
    buffer = io.BytesIO()
    builder = TemplateBuilder(buffer)
    builder.set_doc_name(f"Raport - {report_date}")
    builder.set_header_name(ReportConfig.cornerLogo)
    builder.create_doc()
    doc = builder.doc
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    fonts_dir = os.path.join(base_dir, "styles/fonts")
    styles_builder = StyleBuilder(
        ReportSettings(
            os.path.join(fonts_dir, "LiberationSans-Regular.ttf"),
            os.path.join(fonts_dir, "LiberationSans-Bold.ttf"),
            os.path.join(fonts_dir, "LibreBaskerville-Bold.ttf")
        )
    )
    styles_builder.register_fonts()
    styles_builder.create_paragraph_styles()
    styles = styles_builder.style

    elements = []
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(ReportConfig.title, styles['title']))
    elements.append(Paragraph(ReportConfig.subtitle, styles['subtitle']))
    
    elements.append(HRFlowable(
        width="100%",
        thickness=2,
        color=ReportColors.SECONDARY,
        spaceBefore=10,
        spaceAfter=40
    ))

    
    # summary section
    elements.append(Paragraph("Podsumowanie", styles['section_header']))
    elements.append(Spacer(1, 0.1*inch))

    area_name = data.get("area_name", "Nieznany obszar")
    area_size = data.get("area", 0)
    last_update = data.get("last_update", "Brak danych")
    features: list[Feature] = data.get("features", [])
    count = len(features)
    density = count / area_size if area_size > 0 else 0
    
    box_width = doc.width / 3
    
    box1 = create_info_box(styles, "Obszar", area_name, doc.width/2)
    elements.append(box1)
    elements.append(Spacer(1, 0.1*inch))
    
    box2 = create_info_box(styles, "Powierzchnia", f"{area_size:.2f} km²", box_width)
    box3 = create_info_box(styles, "Liczba zdjęć", f"{count:}", box_width)
    box4 = create_info_box(styles, "Gęstość", f"{density:.0f} zdjęć/km²", box_width)
    
    info_boxes = [[box2, box3, box4]]
    
    metrics_table = Table(info_boxes, colWidths=[box_width + 5] * 4, rowHeights=None)
    metrics_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # statistics section
    tableData = []
    for f in features:
        dt_pzgik = getattr(f.properties, 'dt_pzgik', None)
        rok_wykonania = getattr(f.properties, 'rok_wykonania', None)
        if dt_pzgik and rok_wykonania:
            tableData.append({
                'dt_pzgik': dt_pzgik,
                'rok_wykonania': rok_wykonania,
                'dateObj': dt_pzgik
            })

    sorted_tableData = sorted(tableData, key=sort_key)
    latest_dt_pzgik = sorted_tableData[0]['dt_pzgik'] if sorted_tableData else "Brak danych"
    
    veg_counts = {'Okres wegetacji': 0, 'Poza wegetacją': 0, 'Brak danych': 0}
    for f in features:
        raw_date = getattr(f.properties, 'data_nalotu', None)
        date = raw_date.replace('"', '').strip() if raw_date else ''
        veg_type = 'Brak danych'
        month = None
        if date and is_valid_date(date):
            try:
                d = datetime.strptime(date, "%Y-%m-%d")
                month = d.month
            except Exception:
                month = None
        elif date and is_valid_month(date):
            try:
                month = int(date.split('-')[1])
            except Exception:
                month = None
        if month is not None and not isinstance(month, str):
            if 4 <= month <= 9:
                veg_type = 'Okres wegetacji'
            elif month in [10, 11, 12, 1, 2, 3]:
                veg_type = 'Poza wegetacją'
        veg_counts[veg_type] += 1

    analog_count = sum(1 for f in features if f.properties.zrodlo_danych == "Zdj. analogowe")
    digital_count = sum(1 for f in features if f.properties.zrodlo_danych == "Zdj. cyfrowe")
    years_list = [f.properties.rok_wykonania for f in features if f.properties.rok_wykonania is not None]
    most_common_year = str(max(set(years_list), key=years_list.count)) if years_list else "Brak danych"
    colors_list = [f.properties.kolor for f in features if f.properties.kolor is not None]
    most_common_color = str(max(set(colors_list), key=colors_list.count)) if colors_list else "Brak danych"

    types_count = Counter(f.properties.charakterystyka_przestrzenna or "Nieznany" for f in features)
    sorted_types = sorted(types_count.items(), key=lambda x: -x[1])
    most_common_gsd = sorted_types[0][0] if sorted_types else "Brak danych"
    
    elements.append(Paragraph("Szczegółowe Informacje", styles['section_header']))
    elements.append(Spacer(1, 0.1*inch))
    
    detail_data = [
        ["Zdjęcia analogowe", f"{analog_count:,}"],
        ["Zdjęcia cyfrowe", f"{digital_count:,}"],
        ["Rok największej liczby zdjęć", most_common_year],
        ["Najczęstszy kolor zdjęć", most_common_color],
        ["Najczęstsza rozdzielczość", most_common_gsd],
        ["Zdjęcia w okresie wegetacji", f"{veg_counts['Okres wegetacji']:,}"],
        ["Zdjęcia poza wegetacją", f"{veg_counts['Poza wegetacją']:,}"],
        ["Zdjęcia bez daty nalotu", f"{veg_counts['Brak danych']:,}"],
        ["Ostatnio dodana paczka zdjęć", latest_dt_pzgik],
        ["Data aktualizacji bazy danych", last_update],
        ["Data wygenerowania raportu", report_date],
    ]
    
    table = create_table(detail_data, [doc.width * 0.45, doc.width * 0.55], has_header=False)
    elements.append(table)
    elements.append(Spacer(1, 0.4*inch))

    # years section
    years = [f.properties.rok_wykonania for f in features if f.properties.rok_wykonania is not None]
    if years:
        elements.append(Paragraph("Rozkład Zdjęć Według Lat Wykonania", styles['section_header']))
        elements.append(Spacer(1, 0.1*inch))
        
        years_count = Counter(years)
        sorted_years = sorted(years_count.items(), key=lambda x: (-x[1], x[0]))
        table_data = [["Rok", "Liczba zdjęć", "Udział %"]]
        
        total_years = sum(count for _, count in sorted_years)
        for year, count in sorted_years:
            percentage = (count / total_years * 100) if total_years > 0 else 0
            table_data.append([str(year), f"{count:,}", f"{percentage:.2f}%"])
        
        table = create_table(
            table_data, 
            [doc.width * 0.25, doc.width * 0.4, doc.width * 0.35]
        )
        elements.append(table)
        elements.append(Spacer(1, 0.3*inch))

    # resolution section
    elements.append(Paragraph("Charakterystyka Przestrzenna (Skala/GSD)", styles['section_header']))
    elements.append(Spacer(1, 0.1*inch))
    
    table_data = [["Skala/GSD", "Liczba zdjęć", "Udział %"]]
    total_types = sum(types_count.values())
    for type_name, count in sorted_types:
        percentage = (count / total_types * 100) if total_types > 0 else 0
        table_data.append([type_name, f"{count:,}", f"{percentage:.2f}%"])
    
    table = create_table(
        table_data, 
        [doc.width * 0.4, doc.width * 0.3, doc.width * 0.3]
    )
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))


    # colors section
    elements.append(Paragraph("Rodzaje Zdjęć (Kolor)", styles['section_header']))
    elements.append(Spacer(1, 0.1*inch))
    
    colors_count = Counter(f.properties.kolor or "Nieznany" for f in features)
    sorted_colors = sorted(colors_count.items(), key=lambda x: -x[1])
    
    table_data = [["Rodzaj zdjęcia", "Liczba zdjęć", "Udział %"]]
    total_colors = sum(colors_count.values())
    for color_name, count in sorted_colors:
        percentage = (count / total_colors * 100) if total_colors > 0 else 0
        table_data.append([color_name, f"{count:,}", f"{percentage:.2f}%"])
    
    table = create_table(
        table_data, 
        [doc.width * 0.4, doc.width * 0.3, doc.width * 0.3]
    )
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))

    # report numbers section
    elements.append(Paragraph("Numery Zgłoszeń", styles['section_header']))
    elements.append(Spacer(1, 0.1*inch))
    
    zgłoszenia = [f.properties.numer_zgloszenia for f in features]
    zgłoszenia_count = Counter(zgłoszenia)
    sorted_zgłoszenia = sorted(zgłoszenia_count.items(), key=lambda x: -x[1])

    table_data = [["Numer zgłoszenia", "Liczba zdjęć"]]
    for num, count in sorted_zgłoszenia:
        table_data.append([str(num), f"{count:,}"])
    
    table = create_table(
        table_data, 
        [doc.width * 0.5, doc.width * 0.5]
    )
    elements.append(table)
    elements.append(Spacer(1, 0.2*inch))
    
    # footer
    elements.append(HRFlowable(
        width="100%",
        thickness=1,
        color=ReportColors.BORDER_LIGHT,
        spaceBefore=20,
        spaceAfter=10
    ))
    elements.append(Paragraph(
        ReportConfig.footer,
        styles['footer']
    ))

    
    doc.build(elements)
    buffer.seek(0)
    return buffer.read()