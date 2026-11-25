"""Plazo en el que una visita aprobada permite el acceso.

Las horas son las del servidor (hora local de la instalación). Reglas:
  - Un solo día: cuenta desde el día y la hora de llegada solicitados y dura
    las horas solicitadas; sin horas, hasta terminar el día. Si OPIP aprueba
    después de la hora de llegada, cuenta desde la aprobación.
  - Varios días: de 08:00 a 17:00 cada día del rango.
"""
from datetime import date, datetime, time, timedelta


JORNADA_INICIO = time(8, 0)
JORNADA_FIN = time(17, 0)


def limite_para_aprobar(fecha_inicio: date, fecha_fin: date) -> datetime:
    """Hasta cuándo tiene sentido aprobar la solicitud."""
    if fecha_inicio != fecha_fin:
        return datetime.combine(fecha_fin, JORNADA_FIN)
    return datetime.combine(fecha_fin + timedelta(days=1), time.min)


def plazo_al_aprobar(visita, aprobada_en: datetime) -> tuple[datetime, datetime]:
    """(vigente_desde, vigente_hasta) que se guarda cuando OPIP aprueba."""
    if visita.fecha_inicio != visita.fecha_fin:
        desde = max(aprobada_en, datetime.combine(visita.fecha_inicio, JORNADA_INICIO))
        return desde, limite_para_aprobar(visita.fecha_inicio, visita.fecha_fin)

    desde = max(aprobada_en, datetime.combine(visita.fecha_inicio, visita.hora_inicio))
    if visita.duracion_horas:
        return desde, desde + timedelta(hours=visita.duracion_horas)
    return desde, limite_para_aprobar(visita.fecha_inicio, visita.fecha_fin)


def texto_horario(fecha_inicio: date, fecha_fin: date, hora_inicio: time) -> str:
    """Texto para el campo Horario del formato PDP-PPIP-F-03."""
    if fecha_inicio != fecha_fin:
        return f"{JORNADA_INICIO:%H:%M} - {JORNADA_FIN:%H:%M}"
    return f"Llegada {hora_inicio:%H:%M}"


def proxima_ventana(visita, ahora: datetime) -> tuple[datetime, datetime] | None:
    """(inicio, fin) del acceso en curso o del siguiente; None si ya venció
    o si nunca se aprobó."""
    if visita.vigente_desde is None or ahora >= visita.vigente_hasta:
        return None
    if visita.fecha_inicio == visita.fecha_fin:
        return visita.vigente_desde, visita.vigente_hasta
    dia = max(ahora.date(), visita.fecha_inicio)
    if ahora >= datetime.combine(dia, JORNADA_FIN):
        dia += timedelta(days=1)
    return datetime.combine(dia, JORNADA_INICIO), datetime.combine(dia, JORNADA_FIN)


def ventana_actual(visita, ahora: datetime) -> tuple[datetime, datetime] | None:
    """Como proxima_ventana, pero solo si el acceso es hoy (o sigue en curso).

    Se muestra desde las 00:00 del día para que el guardia sepa a quién
    espera; `inicio` indica a partir de qué hora puede entrar.
    """
    ventana = proxima_ventana(visita, ahora)
    if ventana is None or ventana[0].date() > ahora.date():
        return None
    return ventana
