# app/report.py
import io
import matplotlib.pyplot as plt
from datetime import datetime
from statistics import mean
from collections import Counter
from reportlab.lib.pagesizes import A4
from reportlab.platypus import Paragraph, Spacer, Table, Image, PageBreak
from reportlab.lib.units import inch

from .template import TemplateBuilder
from .style import StyleBuilder
from .settings import ReportSettings

from utils.features import Feature, FeatureProperties, Region, RegionProperties
from reportlab.platypus import TableStyle
from reportlab.lib import colors

from reportlab.platypus import TableStyle
from reportlab.lib import colors

def generate_report_pdf(data: dict) -> bytes:
    date = datetime.now().strftime('%Y-%m-%d  %H:%M:%S')
    buffer = io.BytesIO()
    builder = TemplateBuilder(buffer)
    builder.set_doc_name(f"Raport - {date}")
    builder.create_doc()
    doc = builder.doc

    styles_builder = StyleBuilder(
        ReportSettings(
            "data/fonts/LiberationSans-Regular.ttf",
            "data/fonts/LiberationSans-Bold.ttf",
            "data/fonts/LibreBaskerville-Bold.ttf"
        )
    )
    styles_builder.register_fonts()
    styles_builder.create_paragraph_styles()
    styles = styles_builder.style

    elements = []
    
    elements.append(Spacer(1, 12))
    # --- Tytuł i data raportu
    elements.append(Paragraph("Dashboard Portal", styles['title']))
    elements.append(Paragraph("Raport", styles['subtitle']))
    elements.append(Spacer(1, 24))
    
    elements.append(Paragraph("Podsumowanie", styles['heading2']))
    elements.append(Spacer(1, 12))

    area_name = data.get("area_name", "Nieznany obszar")
    area_size = data.get("area", 0)
    features: list[Feature] = data.get("features", [])
    count = len(features)
    density = count / area_size if area_size > 0 else 0

    # --- Podstawowa tabela
    table_data = {
        "Obszar": area_name,
        "Powierzchnia obszaru": f"{area_size:.2f} km²",
        "Liczba zdjęć": count,
        "Zdjęcia analogowe": sum(1 for f in features if f.properties.zrodlo_danych == "Zdj. analogowe"),
        "Zdjęcia cyfrowe": sum(1 for f in features if f.properties.zrodlo_danych == "Zdj. cyfrowe"),
        "Pokrycie obszaru zdjęciami": f"{density:.0f} zdjęć/km²",
        "Rok największej liczby zdjęć": (lambda yrs: str(max(set(yrs), key=yrs.count)) if yrs else "Brak danych")( [f.properties.rok_wykonania for f in features if f.properties.rok_wykonania is not None] ),
        "Najczęstszy kolor zdjęć": (lambda cols: str(max(set(cols), key=cols.count)) if cols else "Brak danych")( [f.properties.kolor for f in features if f.properties.kolor is not None] ),
        "Liczba listnych/bestlistnych": "Brak",
        "Data ostatniego nalotu": data.get("data_ostatniego_nalotu", "Brak danych"),
        "Data ostatniej aktualizacji bazy danych": data.get("data_aktualizacji_bazy", "Brak danych"),
        "Data wygenerowania raportu": date
        
    }

    table = Table([[k, v] for k, v in table_data.items()])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), styles['normal'].fontName),
        ('FONTSIZE', (0, 0), (-1, -1), styles['normal'].fontSize),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        # ('BACKGROUND', (0, 0), (0, 1), colors.lightgrey),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))


    # --- Lata wykonania
    years = [f.properties.rok_wykonania for f in features if f.properties.rok_wykonania is not None]
    if years:
        years_count = Counter(years)
        # Sort by count descending, then by year ascending
        sorted_years = sorted(years_count.items(), key=lambda x: (-x[1], x[0]))
        table_data = [["Rok", "Liczba zdjęć"]] + [[year, count] for year, count in sorted_years]
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), styles['normal'].fontName),
            ('FONTSIZE', (0,0), (-1,-1), styles['normal'].fontSize),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('ALIGN', (0,0), (-1,-1), 'CENTER')
        ]))
        elements.append(Paragraph("Lata wykonania zdjęć:", styles['heading2']))
        elements.append(table)
        elements.append(Spacer(1, 12))

    # --- Typ zdjęcia
    types_count = Counter(f.properties.charakterystyka_przestrzenna or "Nieznany" for f in features)
    table_data = [["Skala/GSD", "Liczba zdjęć"]] + [[k, v] for k,v in types_count.items()]
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), styles['normal'].fontName),
        ('FONTSIZE', (0,0), (-1,-1), styles['normal'].fontSize),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))
    elements.append(Paragraph("Charakterystyka przestrzenna:", styles['heading2']))
    elements.append(table)
    elements.append(Spacer(1, 12))

    # --- Kolor / Mono
    colors_count = Counter(f.properties.kolor or "Nieznany" for f in features)
    table_data = [["Rodzaj zdjęcia", "Liczba zdjęć"]] + [[k,v] for k,v in colors_count.items()]
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), styles['normal'].fontName),
        ('FONTSIZE', (0,0), (-1,-1), styles['normal'].fontSize),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))
    elements.append(Paragraph("Kolory zdjęć:", styles['heading2']))
    elements.append(table)
    elements.append(Spacer(1, 12))
    
    # Numery zgłoszeń
    zgłoszenia = [f.properties.numer_zgloszenia for f in features]
    table_data = [["Numer zgłoszenia", "Liczba zdjęć"]] + [[num, zgłoszenia.count(num)] for num in set(zgłoszenia)]
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), styles['normal'].fontName),
        ('FONTSIZE', (0,0), (-1,-1), styles['normal'].fontSize),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))
    elements.append(Paragraph("Numery zgłoszeń:", styles['heading2']))
    elements.append(table)
    elements.append(Spacer(1, 12))

    

    # --- Generowanie PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
