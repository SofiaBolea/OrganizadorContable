// ═══════════════════════════════════════
// TIPOS Y FUNCIONES PURAS COMPARTIDAS
// (importable desde client y server)
// ═══════════════════════════════════════

export interface OcurrenciaMaterializada {
  id: string;
  fechaOriginal: string;
  estado: string;
  tituloOverride: string | null;
  fechaOverride: string | null;
  colorOverride: string | null;
}

export interface RecurrenciaData {
  frecuencia: string;
  intervalo: number;
  diaSemana: string | null;
  diaDelMes: string | null;
  mesDelAnio: string | null;
  hastaFecha: string | null;
  conteoMaximo: number | null;
}

export interface TareaAsignacionRow {
  tareaAsignacionId: string;
  tareaId: string;
  titulo: string;
  prioridad: string;
  tipoTarea: string;
  fechaVencimientoBase: string | null;
  descripcion: string | null;
  asignadoId: string;
  asignadoNombre: string;
  asignadoPorId: string;
  asignadoPorNombre: string;
  estado: string;
  fechaAsignacion: string;
  refColorId: string | null;
  refColorTitulo: string | null;
  refColorHexa: string | null;
  recurrencia: RecurrenciaData | null;
  ocurrenciasMaterializadas: OcurrenciaMaterializada[];
}

/** Fila expandida que se muestra en la tabla */
export interface TareaDisplayRow {
  /** Clave única para React */
  key: string;
  tareaAsignacionId: string;
  tareaId: string;
  /** null = virtual (no guardada en BD), string = materializada */
  ocurrenciaId: string | null;
  esVirtual: boolean;
  titulo: string;
  /** Título base de la tarea (sin override) */
  tituloBase: string;
  prioridad: string;
  tipoTarea: string;
  /** Fecha concreta de esta ocurrencia (con override si aplica) */
  fechaOcurrencia: string | null;
  /** Fecha original de la ocurrencia (sin override) — usada para materializar */
  fechaOriginalOcurrencia: string | null;
  descripcion: string | null;
  asignadoId: string;
  asignadoNombre: string;
  asignadoPorId: string;
  asignadoPorNombre: string;
  estado: string;
  fechaAsignacion: string;
  refColorId: string | null;
  refColorTitulo: string | null;
  refColorHexa: string | null;
  tieneRecurrencia: boolean;
  frecuencia: string | null;
}

// ═══════════════════════════════════════
// GENERADOR DE FECHAS VIRTUALES
// ═══════════════════════════════════════

const MAX_OCURRENCIAS_VIRTUALES = 200;

const DIAS_SEMANA_MAP: Record<string, number> = {
  DO: 0, LU: 1, MA: 2, MI: 3, JU: 4, VI: 5, SA: 6,
};

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function generarFechasRecurrencia(
  rec: RecurrenciaData,
  fechaBase: string | null,
  limite: number = MAX_OCURRENCIAS_VIRTUALES
): string[] {
  // Si no hay fecha base, usar hoy como punto de partida
  const fechaEfectiva = fechaBase || formatDateISO(new Date());
  if (!fechaEfectiva) return [];

  const fechas: string[] = [];
  const inicio = new Date(fechaEfectiva.split("T")[0] + "T12:00:00");
  const hastaDate = rec.hastaFecha
    ? new Date(rec.hastaFecha.split("T")[0] + "T23:59:59")
    : null;
  const maxCount = rec.conteoMaximo
    ? Math.min(rec.conteoMaximo, limite)
    : limite;

  const intervalo = rec.intervalo || 1;

  switch (rec.frecuencia) {
    case "DIARIA": {
      const cur = new Date(inicio);
      while (fechas.length < maxCount) {
        if (hastaDate && cur > hastaDate) break;
        fechas.push(formatDateISO(cur));
        cur.setDate(cur.getDate() + intervalo);
      }
      break;
    }

    case "SEMANAL": {
      if (rec.diaSemana) {
        const diasTarget = rec.diaSemana
          .split(",")
          .map((d) => DIAS_SEMANA_MAP[d.trim().toUpperCase()])
          .filter((d) => d !== undefined)
          .sort((a, b) => a - b);

        if (diasTarget.length === 0) {
          diasTarget.push(inicio.getDay());
        }

        const cur = new Date(inicio);
        const diaSemanaInicio = cur.getDay();
        cur.setDate(cur.getDate() - diaSemanaInicio);

        while (fechas.length < maxCount) {
          for (const dia of diasTarget) {
            const fecha = new Date(cur);
            fecha.setDate(fecha.getDate() + dia);
            if (fecha < inicio) continue;
            if (hastaDate && fecha > hastaDate) return fechas;
            if (fechas.length >= maxCount) return fechas;
            fechas.push(formatDateISO(fecha));
          }
          cur.setDate(cur.getDate() + 7 * intervalo);
        }
      } else {
        const cur = new Date(inicio);
        while (fechas.length < maxCount) {
          if (hastaDate && cur > hastaDate) break;
          fechas.push(formatDateISO(cur));
          cur.setDate(cur.getDate() + 7 * intervalo);
        }
      }
      break;
    }

    case "MENSUAL": {
      if (rec.diaDelMes) {
        const diasMes = rec.diaDelMes
          .split(",")
          .map((d) => parseInt(d.trim(), 10))
          .filter((d) => !isNaN(d) && d >= 1 && d <= 31)
          .sort((a, b) => a - b);

        if (diasMes.length === 0) diasMes.push(inicio.getDate());

        let mesActual = inicio.getMonth();
        let anioActual = inicio.getFullYear();

        while (fechas.length < maxCount) {
          for (const dia of diasMes) {
            const ultimoDia = new Date(anioActual, mesActual + 1, 0).getDate();
            const diaReal = Math.min(dia, ultimoDia);
            const fecha = new Date(anioActual, mesActual, diaReal, 12, 0, 0);
            if (fecha < inicio) continue;
            if (hastaDate && fecha > hastaDate) return fechas;
            if (fechas.length >= maxCount) return fechas;
            fechas.push(formatDateISO(fecha));
          }
          mesActual += intervalo;
          if (mesActual >= 12) {
            anioActual += Math.floor(mesActual / 12);
            mesActual = mesActual % 12;
          }
        }
      } else {
        const cur = new Date(inicio);
        while (fechas.length < maxCount) {
          if (hastaDate && cur > hastaDate) break;
          fechas.push(formatDateISO(cur));
          cur.setMonth(cur.getMonth() + intervalo);
        }
      }
      break;
    }

    case "ANUAL": {
      const cur = new Date(inicio);
      while (fechas.length < maxCount) {
        if (hastaDate && cur > hastaDate) break;
        fechas.push(formatDateISO(cur));
        cur.setFullYear(cur.getFullYear() + intervalo);
      }
      break;
    }

    default: {
      fechas.push(formatDateISO(inicio));
    }
  }

  return fechas;
}

// ═══════════════════════════════════════
// EXPANSIÓN: TareaAsignacionRow[] → TareaDisplayRow[]
// ═══════════════════════════════════════

export function expandirTareasADisplayRows(
  tareas: TareaAsignacionRow[]
): TareaDisplayRow[] {
  const rows: TareaDisplayRow[] = [];

  for (const t of tareas) {
    if (!t.recurrencia) {
      // Tarea única: buscar ocurrencia materializada (si existe)
      const mat = t.ocurrenciasMaterializadas.length > 0
        ? t.ocurrenciasMaterializadas[0]
        : null;

      // No mostrar si la ocurrencia está cancelada
      if (mat?.estado === "CANCELADA") continue;

      rows.push({
        key: t.tareaAsignacionId,
        tareaAsignacionId: t.tareaAsignacionId,
        tareaId: t.tareaId,
        ocurrenciaId: mat?.id || null,
        esVirtual: !mat,
        titulo: mat?.tituloOverride || t.titulo,
        tituloBase: t.titulo,
        prioridad: t.prioridad,
        tipoTarea: t.tipoTarea,
        fechaOcurrencia: mat?.fechaOverride || mat?.fechaOriginal || t.fechaVencimientoBase,
        fechaOriginalOcurrencia: mat?.fechaOriginal || t.fechaVencimientoBase,
        descripcion: t.descripcion,
        asignadoId: t.asignadoId,
        asignadoNombre: t.asignadoNombre,
        asignadoPorId: t.asignadoPorId,
        asignadoPorNombre: t.asignadoPorNombre,
        estado: mat?.estado || "PENDIENTE",
        fechaAsignacion: t.fechaAsignacion,
        refColorId: t.refColorId,
        refColorTitulo: t.refColorTitulo,
        refColorHexa: t.refColorHexa,
        tieneRecurrencia: false,
        frecuencia: null,
      });
    } else {
      const fechas = generarFechasRecurrencia(
        t.recurrencia,
        t.fechaVencimientoBase
      );

      const matMap = new Map<string, OcurrenciaMaterializada>();
      for (const o of t.ocurrenciasMaterializadas) {
        const fechaKey = o.fechaOriginal.split("T")[0];
        matMap.set(fechaKey, o);
      }

      // Si no se generaron fechas, mostrar al menos 1 fila resumen
      if (fechas.length === 0 && matMap.size === 0) {
        rows.push({
          key: t.tareaAsignacionId,
          tareaAsignacionId: t.tareaAsignacionId,
          tareaId: t.tareaId,
          ocurrenciaId: null,
          esVirtual: true,
          titulo: t.titulo,
          tituloBase: t.titulo,
          prioridad: t.prioridad,
          tipoTarea: t.tipoTarea,
          fechaOcurrencia: t.fechaVencimientoBase,
          fechaOriginalOcurrencia: t.fechaVencimientoBase,
          descripcion: t.descripcion,
          asignadoId: t.asignadoId,
          asignadoNombre: t.asignadoNombre,
          asignadoPorId: t.asignadoPorId,
          asignadoPorNombre: t.asignadoPorNombre,
          estado: t.estado,
          fechaAsignacion: t.fechaAsignacion,
          refColorId: t.refColorId,
          refColorTitulo: t.refColorTitulo,
          refColorHexa: t.refColorHexa,
          tieneRecurrencia: true,
          frecuencia: t.recurrencia!.frecuencia,
        });
        continue;
      }

      for (const fechaStr of fechas) {
        const mat = matMap.get(fechaStr);

        // Ocultar ocurrencias canceladas
        if (mat?.estado === "CANCELADA") {
          matMap.delete(fechaStr);
          continue;
        }

        rows.push({
          key: `${t.tareaAsignacionId}--${fechaStr}`,
          tareaAsignacionId: t.tareaAsignacionId,
          tareaId: t.tareaId,
          ocurrenciaId: mat?.id || null,
          esVirtual: !mat,
          titulo: mat?.tituloOverride || t.titulo,
          tituloBase: t.titulo,
          prioridad: t.prioridad,
          tipoTarea: t.tipoTarea,
          fechaOcurrencia: mat?.fechaOverride || mat?.fechaOriginal || fechaStr,
          fechaOriginalOcurrencia: mat?.fechaOriginal || fechaStr,
          descripcion: t.descripcion,
          asignadoId: t.asignadoId,
          asignadoNombre: t.asignadoNombre,
          asignadoPorId: t.asignadoPorId,
          asignadoPorNombre: t.asignadoPorNombre,
          estado: mat?.estado || "PENDIENTE",
          fechaAsignacion: t.fechaAsignacion,
          refColorId: t.refColorId,
          refColorTitulo: t.refColorTitulo,
          refColorHexa: t.refColorHexa,
          tieneRecurrencia: true,
          frecuencia: t.recurrencia!.frecuencia,
        });

        matMap.delete(fechaStr);
      }

      // Ocurrencias materializadas huérfanas (excluir canceladas)
      for (const [fechaKey, mat] of matMap.entries()) {
        if (mat.estado === "CANCELADA") continue;

        rows.push({
          key: `${t.tareaAsignacionId}--${fechaKey}`,
          tareaAsignacionId: t.tareaAsignacionId,
          tareaId: t.tareaId,
          ocurrenciaId: mat.id,
          esVirtual: false,
          titulo: mat.tituloOverride || t.titulo,
          tituloBase: t.titulo,
          prioridad: t.prioridad,
          tipoTarea: t.tipoTarea,
          fechaOcurrencia: mat.fechaOverride || fechaKey,
          fechaOriginalOcurrencia: fechaKey,
          descripcion: t.descripcion,
          asignadoId: t.asignadoId,
          asignadoNombre: t.asignadoNombre,
          asignadoPorId: t.asignadoPorId,
          asignadoPorNombre: t.asignadoPorNombre,
          estado: mat.estado,
          fechaAsignacion: t.fechaAsignacion,
          refColorId: t.refColorId,
          refColorTitulo: t.refColorTitulo,
          refColorHexa: t.refColorHexa,
          tieneRecurrencia: true,
          frecuencia: t.recurrencia!.frecuencia,
        });
      }
    }
  }

  // Ordenar por fecha ascendente (sin fecha al final)
  rows.sort((a, b) => {
    if (!a.fechaOcurrencia && !b.fechaOcurrencia) return 0;
    if (!a.fechaOcurrencia) return 1;
    if (!b.fechaOcurrencia) return -1;
    return a.fechaOcurrencia.localeCompare(b.fechaOcurrencia);
  });

  return rows;
}
