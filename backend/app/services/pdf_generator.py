"""Genera el PDF del formato PDP-PPIP-F-03 lleno con los datos de la visita.

Usa ReportLab — puro Python, sin dependencias del sistema (no requiere GTK).
"""
from pathlib import Path
from datetime import datetime
from html import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
    KeepTogether,
)

from app.models.visita import Visita


BASE_DIR = Path(__file__).resolve().parent.parent
PDFS_DIR = BASE_DIR.parent / "storage" / "pdfs"
PDFS_DIR.mkdir(parents=True, exist_ok=True)


# ---------- Estilos reutilizables ----------

_styles = getSampleStyleSheet()

_style_titulo = ParagraphStyle(
    "titulo_formato",
    parent=_styles["Heading1"],
    fontSize=12,
    alignment=1,  # centrado
    spaceAfter=10,
    textColor=colors.HexColor("#0F172A"),
)

_style_header_titulo = ParagraphStyle(
    "header_titulo",
    parent=_styles["Normal"],
    fontSize=10,
    alignment=1,
    fontName="Helvetica-Bold",
)

_style_header_meta = ParagraphStyle(
    "header_meta",
    parent=_styles["Normal"],
    fontSize=8,
)

_style_campo_label = ParagraphStyle(
    "campo_label",
    parent=_styles["Normal"],
    fontSize=10,
)

_style_subtitulo = ParagraphStyle(
    "subtitulo",
    parent=_styles["Normal"],
    fontSize=10,
    alignment=1,
    fontName="Helvetica-Bold",
    spaceBefore=8,
    spaceAfter=4,
)

_style_pie = ParagraphStyle(
    "pie",
    parent=_styles["Normal"],
    fontSize=7,
    alignment=1,
    fontName="Helvetica-Oblique",
    textColor=colors.HexColor("#374151"),
)

_style_firma = ParagraphStyle(
    "firma",
    parent=_styles["Normal"],
    fontSize=9,
    alignment=1,
    fontName="Helvetica-Bold",
)


# ---------- Bloques del documento ----------

def _header_table(fecha_impresion: str, folio: str) -> Table:
    """Encabezado tipo Pétreos del Pacífico con logo, título y metadatos."""
    logo_cell = Paragraph(
        '<b><font size="14">PÉTREOS</font></b><br/>'
        '<font size="7">DEL PACÍFICO</font>',
        ParagraphStyle("logo", parent=_styles["Normal"], alignment=1),
    )

    titulo_cell = Paragraph(
        "PETREOS DEL PACIFICO, S.A. DE C.V.<br/>"
        "<b>PLAN DE PROTECCIÓN DE<br/>LA INSTALACIÓN PORTUARIA</b>",
        _style_header_titulo,
    )

    meta_data = [
        ["Fecha:", fecha_impresion],
        ["Revisión:", "00"],
        ["Código:", "PDP-PPIP-F-03"],
        ["Folio:", folio],
    ]
    meta_cell = Table(meta_data, colWidths=[22 * mm, 35 * mm])
    meta_cell.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("FONTNAME", (3, 3), (3, 3), "Courier-Bold"),  # folio en monospace
    ]))

    tabla = Table(
        [[logo_cell, titulo_cell, meta_cell]],
        colWidths=[45 * mm, 75 * mm, 60 * mm],
    )
    tabla.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    return tabla


def _campo(label: str, valor: str) -> Paragraph:
    """Renglón tipo 'Etiqueta: __valor__' con línea de subrayado visual."""
    return Paragraph(
        f'<font color="#374151">{label}</font> '
        f'<b><u>{escape(valor) if valor else "&nbsp;"}</u></b>',
        _style_campo_label,
    )


def _tabla_personas(personas: list[dict]) -> Table:
    """Tabla de visitantes con columna de foto opcional."""
    header = ["Foto", "Nombre(s)", "Nacionalidad", "No. Identificación"]
    data = [header]

    for p in personas:
        foto_cell = ""
        if p.get("foto_path"):
            foto_p = Path(p["foto_path"])
            if foto_p.exists():
                try:
                    foto_cell = Image(str(foto_p), width=15 * mm, height=18 * mm)
                except Exception:
                    foto_cell = ""
        data.append([
            foto_cell,
            p["nombre"],
            p["nacionalidad"],
            p["identificacion"],
        ])

    # Filas vacías para dar sensación de formato oficial (mínimo 5 renglones)
    filas_faltantes = max(0, 5 - len(personas))
    for _ in range(filas_faltantes):
        data.append(["", "", "", ""])

    tabla = Table(
        data,
        colWidths=[20 * mm, 75 * mm, 35 * mm, 50 * mm],
    )
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return tabla


def _tabla_vehiculos(vehiculos: list[dict]) -> Table:
    header = ["Marca", "Modelo", "Año", "Placas"]
    data = [header]
    for v in vehiculos:
        data.append([v["marca"], v["modelo"], v["anio"] or "", v["placas"]])

    if not vehiculos:
        data.append(["", "", "", ""])

    tabla = Table(data, colWidths=[55 * mm, 55 * mm, 20 * mm, 50 * mm])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return tabla


def _bloque_firmas(solicitante: str) -> Table:
    """Firmas al pie; la del solicitante lleva su nombre completo."""
    firma_izq = Paragraph(
        f"SOLICITO<br/><br/><b>{escape(solicitante)}</b><br/>"
        '<font color="#000">_______________________________</font><br/>'
        "NOMBRE Y FIRMA",
        _style_firma,
    )
    firma_der = Paragraph(
        "Vo. Bo. DE AUTORIZACIÓN<br/><br/><br/>"
        '<font color="#000">_______________________________</font><br/>'
        "OFICIAL DE PROTECCIÓN DE LA<br/>INSTALACIÓN PORTUARIA",
        _style_firma,
    )
    tabla = Table([[firma_izq, firma_der]], colWidths=[90 * mm, 90 * mm])
    tabla.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 30),
    ]))
    return tabla


# ---------- Función pública ----------

def generar_pdf_visita(visita: Visita) -> Path:
    """Renderiza el formato PDP-PPIP-F-03 con los datos de la visita.
    Devuelve la ruta al PDF generado."""

    personas_ctx = [
        {
            "nombre": p.nombre,
            "nacionalidad": p.nacionalidad,
            "identificacion": f"{p.tipo_identificacion}: {p.numero_identificacion}",
            "foto_path": p.foto_path,
        }
        for p in visita.personas
    ]

    vehiculos_ctx = [
        {"marca": v.marca, "modelo": v.modelo, "anio": v.anio, "placas": v.placas}
        for v in visita.vehiculos
    ]

    output_path = PDFS_DIR / f"{visita.folio}.pdf"

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title=f"Solicitud de Acceso {visita.folio}",
    )

    duracion_txt = ""
    if visita.duracion_horas:
        duracion_txt += f"En Horas: {visita.duracion_horas}   "
    if visita.duracion_dias:
        duracion_txt += f"En Días: {visita.duracion_dias}"

    story = [
        _header_table(datetime.now().strftime("%d/%m/%Y"), visita.folio),
        Spacer(1, 6 * mm),
        Paragraph("SOLICITUD DE ACCESO TEMPORAL A LA INSTALACIÓN PORTUARIA", _style_titulo),
        _campo("Empresa que solicita el acceso:", visita.empresa_solicitante),
        Spacer(1, 3 * mm),
        _campo("Justificación de la Visita:", visita.justificacion),
        Spacer(1, 3 * mm),
        _campo("Persona a Visitar:", visita.persona_a_visitar),
        Spacer(1, 3 * mm),
        _campo("Área a Visitar:", visita.area_a_visitar),
        Spacer(1, 3 * mm),
        _campo(
            "Tiempos de la Visita — Fecha del:",
            f"{visita.fecha_inicio.strftime('%d/%m/%Y')}   al: "
            f"{visita.fecha_fin.strftime('%d/%m/%Y')}",
        ),
        Spacer(1, 3 * mm),
        _campo(f"Duración de la Visita — {duracion_txt.strip()}   Horario:", visita.horario),
        Spacer(1, 3 * mm),
        Paragraph("Datos de las visitas", _style_subtitulo),
        Paragraph(f"<b>Empresa:</b> {escape(visita.empresa_solicitante)}", _styles["Normal"]),
        Spacer(1, 2 * mm),
        _tabla_personas(personas_ctx),
        Spacer(1, 5 * mm),
        Paragraph("<b>Datos del Vehículo:</b>", _styles["Normal"]),
        Spacer(1, 2 * mm),
        _tabla_vehiculos(vehiculos_ctx),
        Spacer(1, 5 * mm),
        _campo("Observaciones:", visita.observaciones or ""),
        Spacer(1, 10 * mm),
        KeepTogether(_bloque_firmas(visita.solicitante.nombre_completo)),
        Spacer(1, 5 * mm),
        Paragraph(
            "El presente documento es implementado en cumplimiento a las "
            "prescripciones del Código PBIP.",
            _style_pie,
        ),
    ]

    doc.build(story)
    return output_path